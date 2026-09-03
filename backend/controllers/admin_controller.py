from flask import request
from services.admin_service import admin_service
from utils.response_formatter import success_response, error_response
from utils.logger import logger

def get_auth_token_from_request():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return request.headers.get("X-Admin-Token") or request.cookies.get("sigap_admin_token")

class AdminController:
    def login(self, data):
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if not username or not password:
            return error_response(
                message="Username dan password wajib diisi.",
                errors=[
                    {"field": "username", "message": "Username wajib diisi."} if not username else None,
                    {"field": "password", "message": "Password wajib diisi."} if not password else None
                ],
                code=400
            )

        session_data = admin_service.authenticate(username, password)
        if not session_data:
            return error_response(
                message="Username atau password salah. Akses ditolak.",
                code=401
            )

        response = success_response(
            data={"session": session_data},
            message="Autentikasi admin berhasil.",
            code=200
        )
        return response

    def logout(self):
        token = get_auth_token_from_request()
        if token:
            admin_service.logout(token)
        return success_response(
            data={"logged_out": True},
            message="Sesi admin telah diakhiri."
        )

    def get_current_user(self):
        token = get_auth_token_from_request()
        if not token:
            return error_response(message="Token sesi tidak ditemukan. Silakan login.", code=401)
        
        session = admin_service.validate_session(token)
        if not session:
            return error_response(message="Sesi admin tidak valid atau telah kedaluwarsa.", code=401)

        return success_response(data={"user": session}, message="Sesi valid.")

    def get_dashboard(self):
        token = get_auth_token_from_request()
        if not admin_service.validate_session(token):
            return error_response(message="Akses tidak diizinkan. Silakan login terlebih dahulu.", code=401)

        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        stats = admin_service.get_dashboard_stats(start_date=start_date, end_date=end_date)
        return success_response(data=stats, message="Statistik dashboard admin berhasil dimuat.")

    def get_reports(self):
        token = get_auth_token_from_request()
        if not admin_service.validate_session(token):
            return error_response(message="Akses tidak diizinkan. Silakan login terlebih dahulu.", code=401)

        search = request.args.get("search")
        status = request.args.get("status")
        category = request.args.get("category")
        urgency = request.args.get("urgency")
        finding_type = request.args.get("finding_type")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        try:
            page = max(1, int(request.args.get("page", 1)))
        except ValueError:
            page = 1
            
        try:
            limit = max(1, min(100, int(request.args.get("limit", 25))))
        except ValueError:
            limit = 25

        filters = {
            "search": search,
            "status": status,
            "category": category,
            "urgency": urgency,
            "finding_type": finding_type,
            "location": request.args.get("location"),
            "assigned_to": request.args.get("assigned_to"),
            "source": request.args.get("source"),
            "start_date": start_date,
            "end_date": end_date
        }

        result = admin_service.get_reports(filters=filters, page=page, limit=limit)
        return success_response(data=result, message="Daftar laporan berhasil diambil.")


    def get_report_detail(self, ticket_no):
        token = get_auth_token_from_request()
        if not admin_service.validate_session(token):
            return error_response(message="Akses tidak diizinkan. Silakan login terlebih dahulu.", code=401)

        report = admin_service.get_report_detail(ticket_no)
        if not report:
            return error_response(message=f"Laporan dengan nomor tiket '{ticket_no}' tidak ditemukan.", code=404)

        return success_response(data={"report": report}, message="Detail laporan berhasil dimuat.")

    def update_report(self, ticket_no, data):
        token = get_auth_token_from_request()
        session = admin_service.validate_session(token)
        if not session:
            return error_response(message="Akses tidak diizinkan. Silakan login terlebih dahulu.", code=401)

        admin_name = session.get("name", "Admin HSSE")
        updated = admin_service.update_report(ticket_no, data, admin_user=admin_name)
        if not updated:
            return error_response(message=f"Laporan dengan nomor tiket '{ticket_no}' tidak ditemukan.", code=404)

        return success_response(data={"report": updated}, message="Status dan tindak lanjut laporan berhasil diperbarui.")

    def get_recap(self):
        token = get_auth_token_from_request()
        if not admin_service.validate_session(token):
            return error_response(message="Akses tidak diizinkan. Silakan login terlebih dahulu.", code=401)

        filters = {
            "start_date": request.args.get("start_date"),
            "end_date": request.args.get("end_date"),
            "category": request.args.get("category"),
            "status": request.args.get("status"),
            "urgency": request.args.get("urgency"),
            "finding_type": request.args.get("finding_type")
        }

        recap_data = admin_service.get_recap(filters=filters)
        return success_response(data=recap_data, message="Data rekapitulasi laporan berhasil dibuat.")

    def get_officers(self):
        """Kembalikan daftar HSSE Officer untuk dropdown disposisi (PRD §4.1).
        Endpoint ini tidak memerlukan autentikasi agar frontend publik (Modal WA)
        dapat memuat daftar yang sama dengan Portal Admin."""
        officers = admin_service.get_officers()
        return success_response(data={"officers": officers}, message="Daftar HSSE Officer berhasil dimuat.")

admin_controller = AdminController()
