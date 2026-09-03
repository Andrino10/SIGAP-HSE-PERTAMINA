from repositories.complaint_repository import complaint_repo
from utils.text_normalizer import normalisasi_teks

HIGH_RISK_KEYWORDS = [
    "kebakaran", "api", "ledakan", "jatuh", "tertimpa", "tersengat", "sengatan listrik",
    "keracunan", "tumpahan kimia", "roboh", "runtuh", "tertabrak", "terjepit",
    "kekurangan oksigen", "luka bakar", "darurat", "longsor", "korsleting", "heat stroke"
]

class ComplaintService:
    def create_complaint(self, data):
        # Simpan salinan yang sudah dirapikan agar payload milik caller tidak
        # dimutasi dan data yang masuk ke penyimpanan tetap konsisten.
        clean_data = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in data.items()
        }
        desc = normalisasi_teks(clean_data.get("description", ""))
        bounded_desc = f" {desc} "
        urgency = clean_data.get("urgency") or "Sedang"

        for kw in HIGH_RISK_KEYWORDS:
            normalized_keyword = normalisasi_teks(kw)
            if f" {normalized_keyword} " in bounded_desc:
                urgency = "Tinggi"
                break

        clean_data["urgency"] = urgency
        record = complaint_repo.create(clean_data)
        return record

    def get_all(self):
        return complaint_repo.get_all()

    def get_by_ticket(self, ticket_no):
        return complaint_repo.get_by_ticket(ticket_no)

complaint_service = ComplaintService()
