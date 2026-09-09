import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import json_storage


class TestRedisBackedJsonStorage(unittest.TestCase):
    def test_redis_load_write_and_counter(self):
        environment = {
            "UPSTASH_REDIS_REST_URL": "https://example.upstash.io",
            "UPSTASH_REDIS_REST_TOKEN": "test-token",
        }
        with patch.dict(os.environ, environment, clear=False), patch(
            "utils.json_storage._redis_command"
        ) as command:
            command.side_effect = ["OK", '[{"ticket_number":"HSE-TEST-0001"}]', 7]

            json_storage.atomic_json_write("/tmp/complaints.json", [{"ticket_number": "HSE-TEST-0001"}])
            loaded = json_storage.load_json_file("/tmp/complaints.json", [])
            counter = json_storage.next_counter("ticket:20260909")

        self.assertEqual(loaded[0]["ticket_number"], "HSE-TEST-0001")
        self.assertEqual(counter, 7)
        self.assertEqual(command.call_args_list[0].args[0][0], "SET")
        self.assertEqual(command.call_args_list[1].args[0][0], "GET")
        self.assertEqual(command.call_args_list[2].args[0], ["INCR", "sigap-hsse:counter:ticket:20260909"])

    def test_marketplace_custom_prefix_is_detected(self):
        environment = {
            "UPSTASH_REDIS_REST_KV_REST_API_URL": "https://example.upstash.io",
            "UPSTASH_REDIS_REST_KV_REST_API_TOKEN": "test-token",
        }
        with patch.dict(os.environ, environment, clear=True):
            self.assertEqual(
                json_storage._redis_config(),
                ("https://example.upstash.io", "test-token"),
            )

    def test_status_reports_temporary_storage_without_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            status = json_storage.get_storage_status()
        self.assertFalse(status["persistent"])
        self.assertEqual(status["backend"], "filesystem-sementara")

    def test_redis_key_is_stable_across_serverless_paths(self):
        first = json_storage._redis_key("/var/task/backend/data/storage/complaints.json")
        second = json_storage._redis_key("/var/task/data/storage/complaints.json")
        self.assertEqual(first, "sigap-hsse:json:v1:complaints.json")
        self.assertEqual(first, second)

    def test_redis_load_accepts_native_json_response(self):
        environment = {
            "UPSTASH_REDIS_REST_URL": "https://example.upstash.io",
            "UPSTASH_REDIS_REST_TOKEN": "test-token",
        }
        with patch.dict(os.environ, environment, clear=False), patch(
            "utils.json_storage._redis_command", return_value=[{"ticket_number": "HSE-TEST-0002"}]
        ):
            loaded = json_storage.load_json_file("/tmp/complaints.json", [])
        self.assertEqual(loaded[0]["ticket_number"], "HSE-TEST-0002")


if __name__ == "__main__":
    unittest.main()
