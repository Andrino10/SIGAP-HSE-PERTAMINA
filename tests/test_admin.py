import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from repositories.complaint_repository import complaint_repo
from repositories.admin_repository import admin_repo

class TestSIGAPAdminBackend(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        # Login to get valid token
        login_res = self.client.post(
            "/api/admin/login",
            data=json.dumps({"username": "admin", "password": "admin_hsse_2026"}),
            content_type="application/json"
        )
        self.assertEqual(login_res.status_code, 200)
        self.token = login_res.get_json()["data"]["session"]["token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    def test_admin_login_invalid_password(self):
        res = self.client.post(
            "/api/admin/login",
            data=json.dumps({"username": "admin", "password": "wrong_password"}),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 401)
        self.assertFalse(res.get_json()["success"])

    def test_admin_unauthorized_endpoints(self):
        dashboard_res = self.client.get("/api/admin/dashboard")
        self.assertEqual(dashboard_res.status_code, 401)

        reports_res = self.client.get("/api/admin/reports")
        self.assertEqual(reports_res.status_code, 401)

        recap_res = self.client.get("/api/admin/recap")
        self.assertEqual(recap_res.status_code, 401)

    def test_admin_dashboard_metrics(self):
        res = self.client.get("/api/admin/dashboard", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertIn("summary", data)
        self.assertIn("total", data["summary"])
        self.assertIn("open", data["summary"])
        self.assertIn("in_progress", data["summary"])
        self.assertIn("closed", data["summary"])
        self.assertIn("critical", data["summary"])
        self.assertIn("category_distribution", data)

    def test_report_creation_and_workflow_update(self):
        # 1. Create new complaint report
        complaint_payload = {
            "reporter_name": "Ahmad Fauzi",
            "division": "Konstruksi & Fasilitas",
            "location": "Scaffolding Tangki 04",
            "occurrence_date": "2026-08-27",
            "categories": ["Pekerjaan di Ketinggian"],
            "description": "Ditemukan pipa perancah goyang dan clamp pengunci kendor di ketinggian 6 meter.",
            "urgency": "Tinggi"
        }

        create_res = self.client.post(
            "/api/complaints",
            data=json.dumps(complaint_payload),
            content_type="application/json"
        )
        self.assertEqual(create_res.status_code, 201)
        created_data = create_res.get_json()["data"]["complaint"]
        ticket_no = created_data["ticket_number"]
        
        self.assertTrue(ticket_no.startswith("HSE-") or ticket_no.startswith("TKT-"))
        self.assertEqual(created_data["status"], "Open")
        self.assertEqual(created_data["risk_level"], "Tinggi")

        # 2. Admin fetches report detail
        detail_res = self.client.get(f"/api/admin/reports/{ticket_no}", headers=self.auth_headers)
        self.assertEqual(detail_res.status_code, 200)
        report_detail = detail_res.get_json()["data"]["report"]
        self.assertEqual(report_detail["reporter_name"], "Ahmad Fauzi")
        self.assertGreaterEqual(len(report_detail.get("history", [])), 1)

        # 3. Admin updates status to In Progress with follow up notes
        update1_res = self.client.patch(
            f"/api/admin/reports/{ticket_no}",
            data=json.dumps({
                "status": "In Progress",
                "assigned_engineer": "Juni Trihardiyanto (Safety Lead)",
                "follow_up_notes": "Tim HSSE menuju lokasi untuk inspeksi ulang perancah dan memasang safety tag merah."
            }),
            content_type="application/json",
            headers=self.auth_headers
        )
        self.assertEqual(update1_res.status_code, 200)
        updated1 = update1_res.get_json()["data"]["report"]
        self.assertEqual(updated1["status"], "In Progress")
        self.assertEqual(updated1["follow_up_notes"], "Tim HSSE menuju lokasi untuk inspeksi ulang perancah dan memasang safety tag merah.")

        # 4. Admin updates status to Closed / Resolved
        update2_res = self.client.patch(
            f"/api/admin/reports/{ticket_no}",
            data=json.dumps({
                "status": "Closed / Resolved",
                "follow_up_notes": "Pengencangan clamp telah selesai, perancah dinyatakan aman dan tagging hijau telah dipasang."
            }),
            content_type="application/json",
            headers=self.auth_headers
        )
        self.assertEqual(update2_res.status_code, 200)
        updated2 = update2_res.get_json()["data"]["report"]
        self.assertEqual(updated2["status"], "Closed / Resolved")
        
        # Verify history has 3 entries
        self.assertGreaterEqual(len(updated2["history"]), 3)

    def test_admin_recap_filtering(self):
        recap_res = self.client.get("/api/admin/recap", headers=self.auth_headers)
        self.assertEqual(recap_res.status_code, 200)
        recap_data = recap_res.get_json()["data"]
        self.assertIn("summary", recap_data)
        self.assertIn("category_breakdown", recap_data)
        self.assertIn("finding_type_breakdown", recap_data)
        self.assertIn("risk_breakdown", recap_data)
        self.assertIn("reports", recap_data)

    def test_admin_logout(self):
        logout_res = self.client.post("/api/admin/logout", headers=self.auth_headers)
        self.assertEqual(logout_res.status_code, 200)

        # After logout, accessing with old token returns 401
        dashboard_res = self.client.get("/api/admin/dashboard", headers=self.auth_headers)
        self.assertEqual(dashboard_res.status_code, 401)

if __name__ == "__main__":
    unittest.main()
