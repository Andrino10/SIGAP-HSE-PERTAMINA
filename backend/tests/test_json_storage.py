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


if __name__ == "__main__":
    unittest.main()
