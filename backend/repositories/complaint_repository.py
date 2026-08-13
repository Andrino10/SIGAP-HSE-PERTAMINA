import os
import datetime
import threading
from config.settings import STORAGE_DIR
from utils.json_storage import atomic_json_write, load_json_file

COMPLAINTS_FILE = os.path.join(STORAGE_DIR, "complaints.json")

class ComplaintRepository:
    def __init__(self):
        self.complaints = []
        self._lock = threading.RLock()
        self._load()

    def _load(self):
        try:
            loaded = load_json_file(COMPLAINTS_FILE, [])
            self.complaints = loaded if isinstance(loaded, list) else []
        except (OSError, ValueError, TypeError):
            self.complaints = []

    def _save(self):
        atomic_json_write(COMPLAINTS_FILE, self.complaints)

    def generate_ticket_number(self):
        now = datetime.datetime.now()
        date_str = now.strftime("%Y%m%d")
        seq = len(self.complaints) + 1
        return f"TKT-{date_str}-{seq:04d}"

    def create(self, complaint_data):
        with self._lock:
            ticket_no = self.generate_ticket_number()
            now_iso = datetime.datetime.now().isoformat()
            categories = complaint_data.get("categories") or complaint_data.get("kategori_list")
            if not isinstance(categories, list):
                categories = [complaint_data.get("category", "Lain-lain")]
            categories = [
                item.strip()
                for item in categories
                if isinstance(item, str) and item.strip()
            ] or ["Lain-lain"]

            record = {
                "ticket_number": ticket_no,
                "reporter_name": complaint_data.get("reporter_name", ""),
                "division": complaint_data.get("division", "Umum"),
                "location": complaint_data.get("location", "Kantor Utama"),
                "occurrence_date": complaint_data.get("occurrence_date") or complaint_data.get("tanggal_kejadian"),
                "category": categories[0],
                "categories": categories,
                "description": complaint_data.get("description", ""),
                "urgency": complaint_data.get("urgency", "Sedang"),
                "status": "Submitted",
                "assigned_engineer": "Tim HSSE / Safety Officer",
                "created_at": now_iso,
                "attachment": complaint_data.get("attachment", None)
            }

            self.complaints.insert(0, record)
            try:
                self._save()
            except Exception:
                self.complaints.pop(0)
                raise
            return dict(record)

    def get_all(self):
        with self._lock:
            return [dict(record) for record in self.complaints]

    def get_by_ticket(self, ticket_no):
        with self._lock:
            for c in self.complaints:
                if c.get("ticket_number") == ticket_no:
                    return dict(c)
        return None

complaint_repo = ComplaintRepository()
