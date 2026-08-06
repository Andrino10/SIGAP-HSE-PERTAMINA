from services.complaint_service import complaint_service
from validators.request_validator import validate_complaint_request
from utils.response_formatter import success_response, error_response

class PengontrolPengaduan:
    def buat_pengaduan(self, data):
        kesalahan = validate_complaint_request(data)
        if kesalahan:
            return error_response(message="Validasi pengaduan gagal.", errors=kesalahan, code=400)

        catatan = complaint_service.create_complaint(data)
        return success_response(data={"complaint": catatan}, message="Pengaduan/laporan bahaya berhasil dikirimkan.", code=201)

    def ambil_semua(self):
        daftar = complaint_service.get_all()
        return success_response(data={"complaints": daftar, "total": len(daftar)}, message="Daftar laporan pengaduan berhasil diambil.")

    def ambil_berdasarkan_tiket(self, nomor_tiket):
        catatan = complaint_service.get_by_ticket(nomor_tiket)
        if not catatan:
            return error_response(message=f"Pengaduan dengan nomor tiket '{nomor_tiket}' tidak ditemukan.", code=404)
        return success_response(data={"complaint": catatan}, message="Detail pengaduan berhasil diambil.")

    def create(self, data):
        return self.buat_pengaduan(data)

    def get_all(self):
        return self.ambil_semua()

    def get_by_ticket(self, ticket_no):
        return self.ambil_berdasarkan_tiket(ticket_no)

pengontrol_pengaduan = PengontrolPengaduan()
complaint_controller = pengontrol_pengaduan
