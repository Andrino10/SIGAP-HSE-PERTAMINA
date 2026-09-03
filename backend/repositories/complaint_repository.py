import os
import datetime
import threading
from config.settings import STORAGE_DIR
from utils.json_storage import atomic_json_write, load_json_file
from utils.logger import logger

COMPLAINTS_FILE = os.path.join(STORAGE_DIR, "complaints.json")

def normalize_status(status_raw):
    """Normalize various status strings into standard SIGAP HSE workflow statuses: Open, In Progress, Closed / Resolved."""
    if not status_raw:
        return "Open"
    s = str(status_raw).strip().lower()
    if s in {"resolved", "selesai", "closed", "closed / resolved", "closed/resolved", "tuntas"}:
        return "Closed / Resolved"
    elif s in {"in_progress", "in progress", "diproses", "sedang diproses", "investigasi", "mitigasi", "penanganan"}:
        return "In Progress"
    else:
        return "Open"

def infer_finding_type(category, description=""):
    """Infer Unsafe Act vs Unsafe Condition based on category and description keywords."""
    act_keywords = ["perilaku", "tidak pakai", "tidak mengenakan", "tanpa permit", "tanpa izin", "merokok", "bercanda", "tidak disiplin", "lalai", "unsafe act", "tanpa sika", "tanpa jsa"]
    text = f"{category} {description}".lower()
    if any(kw in text for kw in act_keywords) or "perilaku" in category.lower() or "budaya" in category.lower():
        return "Unsafe Act"
    return "Unsafe Condition"

def infer_risk_level(urgency, description=""):
    """Infer risk level (Rendah, Sedang, Tinggi) based on urgency and keywords."""
    u = str(urgency).lower()
    high_keywords = ["kebakaran", "api", "ledakan", "jatuh", "tertimpa", "tersengat", "sengatan listrik", "keracunan", "tumpahan kimia", "roboh", "darurat", "kritis"]
    text = description.lower()
    if u in {"tinggi", "berat", "high", "critical"} or any(kw in text for kw in high_keywords):
        return "Tinggi"
    elif u in {"ringan", "low"}:
        return "Rendah"
    return "Sedang"

class ComplaintRepository:
    def __init__(self):
        self.complaints = []
        self._lock = threading.RLock()
        self._load()

    def _load(self):
        try:
            loaded = load_json_file(COMPLAINTS_FILE, [])
            self.complaints = loaded if isinstance(loaded, list) else []
            # Ensure historical records have standard status and ticket format
            for c in self.complaints:
                if "status" in c:
                    c["status"] = normalize_status(c.get("status"))
                if "ticket_number" not in c and "complaint_id" in c:
                    c["ticket_number"] = c["complaint_id"]
                if "history" not in c:
                    c["history"] = [{
                        "timestamp": c.get("created_at") or c.get("submitted_at") or datetime.datetime.now().isoformat(),
                        "action": "Laporan Dibuat",
                        "status": c.get("status", "Open"),
                        "actor": c.get("reporter_name") or (c.get("reporter") or {}).get("name", "Pekerja Lapangan"),
                        "notes": "Laporan kondisi bahaya dicatat di sistem."
                    }]
                if "finding_type" not in c:
                    c["finding_type"] = infer_finding_type(c.get("category", ""), c.get("description", "") or c.get("complaint_description", ""))
                if "risk_level" not in c:
                    c["risk_level"] = infer_risk_level(c.get("urgency", "Sedang"), c.get("description", "") or c.get("complaint_description", ""))
        except (OSError, ValueError, TypeError) as e:
            logger.error(f"Error loading complaints: {e}")
            self.complaints = []

    def _save(self):
        atomic_json_write(COMPLAINTS_FILE, self.complaints)

    def generate_ticket_number(self):
        now = datetime.datetime.now()
        date_str = now.strftime("%Y%m%d")
        seq = len(self.complaints) + 1
        return f"HSE-{date_str}-{seq:04d}"

    def create(self, complaint_data):
        with self._lock:
            ticket_no = self.generate_ticket_number()
            now_iso = datetime.datetime.now().isoformat()
            categories = complaint_data.get("categories") or complaint_data.get("kategori_list")
            if not isinstance(categories, list):
                categories = [complaint_data.get("category", "Umum")]
            categories = [
                item.strip()
                for item in categories
                if isinstance(item, str) and item.strip()
            ] or ["Umum"]

            category_primary = categories[0]
            description = complaint_data.get("description") or complaint_data.get("complaint_description", "")
            urgency = complaint_data.get("urgency", "Sedang")
            reporter_name = complaint_data.get("reporter_name") or (complaint_data.get("reporter") or {}).get("name", "Pekerja Lapangan")
            finding_type = complaint_data.get("finding_type") or infer_finding_type(category_primary, description)
            risk_level = complaint_data.get("risk_level") or infer_risk_level(urgency, description)

            # Tentukan sumber laporan: dari eskalasi chatbot atau form langsung
            raw_session_id = complaint_data.get("session_id") or complaint_data.get("id_sesi") or ""
            is_chatbot_source = bool(raw_session_id and str(raw_session_id).upper().startswith("SESS-"))
            source = complaint_data.get("source") or ("chatbot_escalation" if is_chatbot_source else "direct_form")

            initial_history = [{
                "timestamp": now_iso,
                "action": "Laporan Dibuat",
                "status": "Open",
                "actor": reporter_name,
                "notes": "Laporan kondisi bahaya berhasil disampaikan ke sistem SIGAP HSE."
            }]

            record = {
                "id": ticket_no,
                "ticket_number": ticket_no,
                "source": source,
                "chat_session_id": raw_session_id if is_chatbot_source else None,
                "reporter_name": reporter_name,
                "division": complaint_data.get("division", "Operasi Lapangan"),
                "location": complaint_data.get("location", "Area Kerja Konstruksi"),
                "occurrence_date": complaint_data.get("occurrence_date") or complaint_data.get("tanggal_kejadian") or datetime.date.today().isoformat(),
                "category": category_primary,
                "categories": categories,
                "finding_type": finding_type,
                "description": description,
                "urgency": urgency,
                "risk_level": risk_level,
                "status": "Open",
                "assigned_to": complaint_data.get("assigned_to", None),
                "assigned_engineer": complaint_data.get("assigned_engineer", "Tim HSSE / Safety Officer"),
                "follow_up_notes": "",
                "history": initial_history,
                "created_at": now_iso,
                "updated_at": now_iso,
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
            ticket_clean = str(ticket_no).strip().upper()
            for c in self.complaints:
                if (
                    str(c.get("ticket_number", "")).strip().upper() == ticket_clean
                    or str(c.get("complaint_id", "")).strip().upper() == ticket_clean
                    or str(c.get("id", "")).strip().upper() == ticket_clean
                ):
                    return dict(c)
        return None

    def update(self, ticket_no, update_data, updated_by="Admin HSSE"):
        with self._lock:
            ticket_clean = str(ticket_no).strip().upper()
            target = None
            for c in self.complaints:
                if (
                    str(c.get("ticket_number", "")).strip().upper() == ticket_clean
                    or str(c.get("complaint_id", "")).strip().upper() == ticket_clean
                    or str(c.get("id", "")).strip().upper() == ticket_clean
                ):
                    target = c
                    break
            
            if not target:
                return None

            now_iso = datetime.datetime.now().isoformat()
            prev_status = target.get("status", "Open")
            new_status = normalize_status(update_data.get("status", prev_status))
            notes = (update_data.get("follow_up_notes") or update_data.get("notes") or "").strip()

            # Record in history if status changed or notes added
            status_changed = new_status != prev_status
            if status_changed or notes:
                action_text = f"Status diubah dari '{prev_status}' menjadi '{new_status}'" if status_changed else "Pembaruan Catatan Tindak Lanjut"
                if "history" not in target or not isinstance(target["history"], list):
                    target["history"] = []
                
                target["history"].append({
                    "timestamp": now_iso,
                    "action": action_text,
                    "previous_status": prev_status,
                    "status": new_status,
                    "actor": updated_by,
                    "notes": notes or ("Status laporan diperbarui." if status_changed else "")
                })

            target["status"] = new_status
            if notes:
                target["follow_up_notes"] = notes

            # PRD §6: assigned_to (structured 6-officer field)
            new_assigned_to = update_data.get("assigned_to")
            if new_assigned_to is not None:
                prev_assigned = target.get("assigned_to") or target.get("assigned_engineer", "")
                if new_assigned_to and new_assigned_to != prev_assigned:
                    if "history" not in target or not isinstance(target["history"], list):
                        target["history"] = []
                    target["history"].append({
                        "timestamp": now_iso,
                        "action": f"Tiket didisposisikan ke: {new_assigned_to}",
                        "previous_status": target.get("status", "Open"),
                        "status": target.get("status", "Open"),
                        "actor": updated_by,
                        "notes": f"Tanggung jawab tiket dialihkan ke {new_assigned_to}."
                    })
                target["assigned_to"] = new_assigned_to
                target["assigned_engineer"] = new_assigned_to  # jaga kompatibilitas legacy

            # Legacy field (jika hanya assigned_engineer yang dikirim tanpa assigned_to)
            elif update_data.get("assigned_engineer"):
                target["assigned_engineer"] = update_data["assigned_engineer"]

            if update_data.get("finding_type"):
                target["finding_type"] = update_data["finding_type"]
            if update_data.get("risk_level"):
                target["risk_level"] = update_data["risk_level"]

            target["updated_at"] = now_iso

            self._save()
            return dict(target)

complaint_repo = ComplaintRepository()
