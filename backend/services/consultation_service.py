import uuid
import datetime
from repositories.complaint_repository import complaint_repo

class ConsultationService:
    def start_consultation(self, data):
        """Register a validated condition report without requiring an account."""
        clean_data = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in data.items()
        }
        categories = clean_data.get("categories") or clean_data.get("kategori_list")
        if not isinstance(categories, list):
            categories = [clean_data.get("category") or "Umum"]
        categories = [item.strip() for item in categories if isinstance(item, str) and item.strip()]
        session_id = clean_data.get("session_id") or f"SESSION-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"

        consultation_record = {
            "session_id": session_id,
            "asset": "Area Kerja",
            "reporter_name": clean_data.get("reporter_name") or clean_data.get("nama_pelapor") or "",
            "division": clean_data.get("division") or "Umum",
            "location": clean_data.get("location") or "Area Kerja",
            "occurrence_date": clean_data.get("occurrence_date") or clean_data.get("tanggal_kejadian"),
            "category": categories[0],
            "categories": categories,
            "description": clean_data.get("description", ""),
            "urgency": clean_data.get("urgency") or "Sedang",
            # PRD §6: Field source & chat_session_id
            "source": clean_data.get("source"),           # akan diteruskan ke complaint_repo
            "risk_level": clean_data.get("risk_level"),   # dari suggested_risk_level chatbot
            "created_at": datetime.datetime.now().isoformat(),
            "status": "active"
        }

        # Save ticket reference if description is long enough
        if len(clean_data.get("description", "")) >= 10:
            ticket = complaint_repo.create(consultation_record)
            consultation_record["ticket_number"] = ticket.get("ticket_number")
            consultation_record["source"] = ticket.get("source")

        return consultation_record

consultation_service = ConsultationService()

