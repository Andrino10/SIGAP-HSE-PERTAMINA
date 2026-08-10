import json
import os
import sys
import unittest
from unittest.mock import patch


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from repositories.conversation_repository import conversation_repo
from repositories.knowledge_repository import KnowledgeRepository, knowledge_repo
from services.retrieval_service import retrieval_service
from services.escalation_service import layanan_eskalasi
from validators.request_validator import (
    validate_chat_request,
    validate_complaint_request,
    validate_consultation_request,
)


class TestSIGAPKnowledgeBackend(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.session_ids = []

    def tearDown(self):
        for session_id in self.session_ids:
            conversation_repo.clear_session(session_id)

    def test_deployment_routes_serve_frontend_assets_and_health(self):
        homepage = self.client.get("/")
        stylesheet = self.client.get("/style.css")
        script = self.client.get("/app.js")
        health = self.client.get("/api/health")

        self.assertEqual(homepage.status_code, 200)
        self.assertIn(b"SIGAP-AI HSE", homepage.data)
        self.assertEqual(stylesheet.status_code, 200)
        self.assertIn("text/css", stylesheet.content_type)
        self.assertEqual(script.status_code, 200)
        self.assertIn("javascript", script.content_type)
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.get_json()["data"]["status"], "ready")

    def post_chat(self, session_id, message, category=None, categories=None):
        self.session_ids.append(session_id)
        payload = {
            "session_id": session_id,
            "message": message,
        }
        if category:
            payload["category"] = category
        if categories:
            payload["categories"] = categories
        return self.client.post(
            "/api/chatbot/message",
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_get_all_540_entries_with_metadata(self):
        response = self.client.get("/api/knowledge")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"]["total"], 540)
        self.assertEqual(len(payload["data"]["knowledge_base"]), 540)
        self.assertEqual(payload["data"]["metadata"]["total_categories"], 27)
        self.assertEqual(payload["data"]["metadata"]["source"], "knowledge.json")
        self.assertTrue(payload["data"]["metadata"]["valid"])
        self.assertTrue(all(payload["data"]["metadata"]["quality_checks"].values()))

        forbidden_phrases = (
            "meningkatkan risiko meningkat",
            "yang berpotensi memicu insiden keselamatan kerja",
            ".,",
        )
        generic_immediate_actions = (
            "hentikan pekerjaan sementara jika berisiko tinggi",
            "kendalikan paparan yang sedang berlangsung",
        )
        first_steps = []
        for entry in payload["data"]["knowledge_base"]:
            self.assertGreaterEqual(len(entry["solusi"].splitlines()), 3, entry["id"])
            self.assertGreaterEqual(len(entry["kata_kunci"]), 3, entry["id"])
            self.assertGreaterEqual(len(entry["tag"]), 2, entry["id"])
            self.assertGreaterEqual(len(entry["penjelasan_risiko"]), 500, entry["id"])
            self.assertGreaterEqual(len(entry["referensi"]), 2, entry["id"])
            self.assertTrue(
                all(reference["url"].startswith("https://") for reference in entry["referensi"]),
                entry["id"],
            )
            first_step = entry["solusi"].splitlines()[0]
            first_steps.append(first_step)
            self.assertTrue(
                first_step.startswith("1. Tindakan Segera: "), entry["id"]
            )
            for phrase in generic_immediate_actions:
                self.assertNotIn(phrase, first_step.lower(), entry["id"])
            for phrase in forbidden_phrases:
                self.assertNotIn(phrase, entry["penjelasan_risiko"].lower(), entry["id"])
        self.assertEqual(len(first_steps), len(set(first_steps)))

    def test_categories_are_derived_from_knowledge_json(self):
        response = self.client.get("/api/knowledge/categories")
        payload = response.get_json()["data"]
        self.assertEqual(payload["total"], 27)
        self.assertEqual(sum(item["jumlah"] for item in payload["details"]), 540)
        self.assertTrue(all(item["jumlah"] == 20 for item in payload["details"]))
        self.assertIn("Kelelahan & Jam Kerja", payload["categories"])

    def test_starters_cover_all_knowledge_categories(self):
        response = self.client.get("/api/chatbot/starters")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["total_categories"], 27)
        self.assertEqual(set(data["by_category"]), set(
            item["nama"] for item in knowledge_repo.get_categories()
        ))
        self.assertTrue(all(1 <= len(items) <= 3 for items in data["by_category"].values()))

    def test_get_entry_by_id(self):
        response = self.client.get("/api/knowledge/HSE-LISTRIK-001")
        self.assertEqual(response.status_code, 200)
        entry = response.get_json()["data"]["knowledge"]
        self.assertEqual(entry["judul"], "Kabel listrik terbuka")
        self.assertEqual(entry["kategori"], "Kelistrikan")

    def test_unknown_entry_id_returns_404(self):
        response = self.client.get("/api/knowledge/HSE-TIDAK-ADA")
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.get_json()["success"])

    def test_exact_chat_match_uses_and_displays_knowledge_reference(self):
        response = self.post_chat(
            "SESSION-TEST-HELM",
            "Pekerja tidak menggunakan helm di area konstruksi",
            "Alat Pelindung Diri (APD)",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["kb_reference"]["id"], "HSE-APD-001")
        self.assertEqual(data["knowledge_source"], "knowledge.json")
        self.assertTrue(data["knowledge_valid"])
        self.assertIn("REFERENSI KNOWLEDGE BASE", data["response"])
        self.assertIn("HSE-APD-001", data["response"])
        self.assertIn("Regulasi resmi", data["response"])
        self.assertGreaterEqual(len(data["kb_reference"]["referensi"]), 2)
        self.assertGreaterEqual(data["confidence"], 0.55)
        for section in (
            "KONDISI TERIDENTIFIKASI",
            "TINGKAT RISIKO",
            "PENJELASAN RISIKO",
            "SOLUSI & TINDAKAN",
            "REKOMENDASI K3",
            "REFERENSI KNOWLEDGE BASE",
            "STATUS PENANGANAN",
        ):
            self.assertIn(section, data["response"])

    def test_single_condition_is_not_reported_as_three_violations(self):
        response = self.post_chat(
            "SESSION-TEST-LISTRIK",
            "Ditemukan kabel listrik terbuka di jalur pekerja",
            "Kelistrikan",
        )
        data = response.get_json()["data"]
        self.assertEqual(data["kb_reference"]["id"], "HSE-LISTRIK-001")
        self.assertEqual(len(data["kb_references"]), 1)
        self.assertNotIn("Kondisi #2", data["response"])

    def test_unknown_condition_does_not_cite_weak_candidate(self):
        response = self.post_chat(
            "SESSION-TEST-UNKNOWN",
            "Reaktor keramik eksperimental mengeluarkan kode kuantum ZX-991",
            "Umum",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertIsNone(data["kb_reference"])
        self.assertEqual(data["kb_references"], [])
        self.assertTrue(data["needs_escalation"])
        self.assertIn("Belum ada artikel knowledge.json", data["response"])
        self.assertIn("Tidak ada artikel yang dicantumkan", data["response"])

    def test_explicit_mixed_report_can_reference_multiple_categories(self):
        response = self.post_chat(
            "SESSION-TEST-MIXED",
            "Pekerja tanpa helm dan bekerja di ketinggian tanpa safety harness",
            "Umum",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        reference_ids = {item["id"] for item in data["kb_references"]}
        self.assertIn("HSE-APD-001", reference_ids)
        self.assertIn("HSE-KETINGGIAN-001", reference_ids)
        self.assertIn("Kondisi #2", data["response"])

    def test_user_can_select_multiple_categories_in_hse_assistant(self):
        selected_categories = [
            "Alat Pelindung Diri (APD)",
            "Pekerjaan di Ketinggian",
        ]
        response = self.post_chat(
            "SESSION-TEST-MULTI-CATEGORY",
            "Pekerja tanpa helm dan bekerja di ketinggian tanpa safety harness",
            categories=selected_categories,
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["category"], selected_categories[0])
        self.assertEqual(data["categories"], selected_categories)
        self.assertEqual(data["context"]["categories"], selected_categories)
        self.assertEqual(data["context"]["category_source"], "explicit")

        reference_categories = {
            item["kategori"] for item in data["kb_references"]
        }
        self.assertEqual(reference_categories, set(selected_categories))
        self.assertIn("1. Alat Pelindung Diri (APD)", data["whatsapp_message"])
        self.assertIn("2. Pekerjaan di Ketinggian", data["whatsapp_message"])

    def test_multi_category_validation_is_clear_and_bounded(self):
        valid = validate_chat_request(
            {
                "message": "Temuan gabungan di area kerja",
                "categories": ["Kelistrikan", "Lingkungan Kerja"],
            }
        )
        self.assertEqual(valid, [])

        general_mixed = validate_chat_request(
            {
                "message": "Temuan gabungan di area kerja",
                "categories": ["Umum", "Kelistrikan"],
            }
        )
        self.assertTrue(any("tidak dapat digabungkan" in item["message"] for item in general_mixed))

        too_many = validate_chat_request(
            {
                "message": "Temuan gabungan di area kerja",
                "categories": [
                    "Alat Pelindung Diri (APD)",
                    "Pekerjaan di Ketinggian",
                    "Kelistrikan",
                    "Lingkungan Kerja",
                    "Pengawasan & Prosedur",
                    "Tanggap Darurat",
                ],
            }
        )
        self.assertTrue(any("Maksimal lima kategori" in item["message"] for item in too_many))

    def test_multi_category_routes_to_officer_for_best_matching_article(self):
        response = self.post_chat(
            "SESSION-TEST-MULTI-ROUTING",
            "Terdapat tumpahan cairan kimia di lantai kerja yang belum dibersihkan",
            categories=["Alat Pelindung Diri (APD)", "Bahan Kimia & B3"],
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["category"], "Alat Pelindung Diri (APD)")
        self.assertEqual(data["kb_reference"]["kategori"], "Bahan Kimia & B3")
        self.assertEqual(data["context"]["assigned_category"], "Bahan Kimia & B3")
        self.assertEqual(data["assigned_technician"]["nama"], "Ronny Pribadi")

    def test_inferred_category_does_not_force_wrong_height_category(self):
        response = self.post_chat(
            "SESSION-TEST-INFERENCE",
            "Tekanan target produksi tinggi membuat pekerja tidak fokus",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["kb_reference"]["id"], "HSE-BUDAYA-005")
        self.assertEqual(data["category"], "Budaya Keselamatan")

    def test_rigging_terms_are_not_forced_into_heavy_equipment(self):
        response = self.post_chat(
            "SESSION-TEST-RIGGING-INFERENCE",
            "Crane mengangkat beban dengan sling rusak saat aktivitas rigging",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["category"], "Pengangkatan & Rigging")
        self.assertTrue(data["kb_reference"]["id"].startswith("HSE-LIFTING-"))

    def test_schema_validation_rejects_duplicate_id(self):
        duplicate = {
            "id": "HSE-TEST-001",
            "kategori": "Umum",
            "judul": "Contoh",
            "kata_kunci": ["contoh", "uji", "validasi"],
            "tingkat_risiko": "rendah",
            "penjelasan_risiko": (
                "Artikel contoh ini menjelaskan bahaya, mekanisme paparan, konsekuensi, "
                "faktor penentu risiko, pengendalian, serta kebutuhan verifikasi lapangan. " * 6
            ),
            "solusi": "1. Tindakan segera.\n2. Terapkan pengendalian.\n3. Verifikasi hasil.",
            "referensi": [
                {"judul": "Undang-Undang Nomor 1 Tahun 1970", "url": "https://example.test/uu"},
                {"judul": "Peraturan Pemerintah Nomor 50 Tahun 2012", "url": "https://example.test/pp"},
            ],
            "tag": ["contoh", "pengujian"],
        }
        with self.assertRaisesRegex(ValueError, "ID duplikat"):
            KnowledgeRepository._validate_entries([duplicate, duplicate])

    def test_schema_validation_rejects_generic_immediate_action(self):
        generic_entry = {
            "id": "HSE-TEST-002",
            "kategori": "Umum",
            "judul": "Contoh tindakan segera generik",
            "kata_kunci": ["contoh", "tindakan segera", "validasi"],
            "tingkat_risiko": "sedang",
            "penjelasan_risiko": (
                "Artikel pengujian ini menjelaskan bahaya, mekanisme paparan, konsekuensi, "
                "faktor penentu risiko, pengendalian, serta kebutuhan verifikasi lapangan. " * 6
            ),
            "solusi": (
                "1. Tindakan Segera: Kendalikan paparan yang sedang berlangsung; "
                "bila berisiko tinggi, hentikan pekerjaan.\n"
                "2. Pengendalian: Terapkan pengendalian yang sesuai.\n"
                "3. Inspeksi & Pengawasan: Verifikasi tindakan sebelum bekerja."
            ),
            "referensi": [
                {"judul": "Undang-Undang Nomor 1 Tahun 1970", "url": "https://example.test/uu"},
                {"judul": "Peraturan Pemerintah Nomor 50 Tahun 2012", "url": "https://example.test/pp"},
            ],
            "tag": ["contoh", "pengujian"],
        }
        with self.assertRaisesRegex(ValueError, "tindakan segera yang spesifik"):
            KnowledgeRepository._validate_entries([generic_entry])

    def test_report_validator_accepts_every_knowledge_category(self):
        errors = validate_complaint_request(
            {
                "reporter_name": "Pelapor Uji",
                "division": "Operasi",
                "location": "Area Uji",
                "category": "Kelelahan & Jam Kerja",
                "description": "Pekerja terlihat kelelahan setelah shift panjang.",
            }
        )
        self.assertEqual(errors, [])

        anonymous_errors = validate_consultation_request(
            {
                "reporter_name": "",
                "division": "Operasi",
                "location": "Area Uji",
                "category": "Kelelahan & Jam Kerja",
                "description": "Pekerja terlihat kelelahan setelah shift panjang.",
                "urgency": "Sedang",
            }
        )
        self.assertEqual(anonymous_errors, [])

    def test_incomplete_consultation_returns_clear_validation_errors(self):
        response = self.client.post(
            "/api/consultations",
            data=json.dumps({"category": "Tidak Ada"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        payload = response.get_json()
        self.assertFalse(payload["success"])
        self.assertGreaterEqual(len(payload["errors"]), 4)

    def test_valid_consultation_returns_ticket_number(self):
        with patch(
            "services.consultation_service.complaint_repo.create",
            return_value={"ticket_number": "TKT-TEST-0001"},
        ):
            response = self.client.post(
                "/api/consultations",
                data=json.dumps(
                    {
                        "reporter_name": "",
                        "division": "Operasi",
                        "location": "Area Uji",
                        "category": "Bahan Kimia & B3",
                        "description": "Terdapat tumpahan bahan kimia di lantai.",
                        "urgency": "Berat",
                    }
                ),
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["data"]["ticket_number"], "TKT-TEST-0001")

    def test_direct_escalation_preserves_report_without_ticket_in_whatsapp(self):
        session_id = "SESSION-TEST-DIRECT-WA"
        self.session_ids.append(session_id)
        response = self.client.post(
            "/api/chatbot/resolve",
            data=json.dumps(
                {
                    "session_id": session_id,
                    "resolved": False,
                    "reporter_name": "Pelapor Uji",
                    "division": "Operasi",
                    "location": "Gudang B3",
                    "category": "Bahan Kimia & B3",
                    "description": "Terdapat tumpahan bahan kimia di lantai gudang.",
                    "urgency": "Berat",
                    "ticket_number": "TKT-TEST-0002",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["assigned_technician"]["nama"], "Ronny Pribadi")
        self.assertNotIn("TKT-TEST-0002", data["whatsapp_message"])
        self.assertNotIn("Nomor Tiket", data["whatsapp_message"])
        self.assertIn("tumpahan bahan kimia", data["whatsapp_message"].lower())

    def test_resolution_requires_boolean_status(self):
        response = self.client.post(
            "/api/chatbot/resolve",
            data=json.dumps({"session_id": "SESSION-TEST-INVALID", "resolved": "false"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_every_exact_title_retrieves_its_own_article(self):
        failures = []
        unexpected_multiple = []
        for entry in knowledge_repo.get_all():
            result = retrieval_service.retrieve(
                entry["judul"],
                category_hint=entry["kategori"],
                top_k=3,
            )
            actual_id = result["top_entry"]["id"] if result["top_entry"] else None
            if actual_id != entry["id"]:
                failures.append((entry["id"], actual_id, result["confidence"]))
            if len(result["all_matches"]) != 1:
                unexpected_multiple.append((entry["id"], len(result["all_matches"])))
        self.assertEqual(failures, [])
        self.assertEqual(unexpected_multiple, [])

    def test_word_api_inside_rapi_does_not_trigger_fire_escalation(self):
        result = layanan_eskalasi.periksa_eskalasi(
            "Area kerja sudah rapi dan aman.",
            {"category": "Umum", "symptoms": []},
            entri_kb={"tingkat_risiko": "rendah"},
            tingkat_relevansi="tinggi",
        )
        self.assertFalse(result["needs_escalation"])


if __name__ == "__main__":
    unittest.main()
