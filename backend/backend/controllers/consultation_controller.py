from services.consultation_service import consultation_service
from utils.response_formatter import success_response, error_response
from validators.request_validator import validate_consultation_request

class PengontrolKonsultasi:
    def buat_konsultasi(self, data):
        errors = validate_consultation_request(data)
        if errors:
            return error_response(
                message="Data laporan kondisi bahaya belum lengkap atau tidak valid.",
                errors=errors,
                code=400,
            )

        catatan = consultation_service.start_consultation(data)
        return success_response(
            data={
                "consultation": catatan,
                "session_id": catatan.get("session_id"),
                "ticket_number": catatan.get("ticket_number"),
            },
            message="Sesi konsultasi HSSE berhasil didaftarkan.",
            code=201
        )

    def create_consultation(self, data):
        return self.buat_konsultasi(data)

pengontrol_konsultasi = PengontrolKonsultasi()
consultation_controller = pengontrol_konsultasi
