import os
import datetime
import threading
from config.settings import STORAGE_DIR
from utils.json_storage import atomic_json_write, load_json_file

CONVERSATIONS_FILE = os.path.join(STORAGE_DIR, "conversations.json")

class ConversationRepository:
    def __init__(self):
        self.sessions = {}
        self._lock = threading.RLock()
        self._load()

    def _load(self):
        try:
            loaded = load_json_file(CONVERSATIONS_FILE, {})
            self.sessions = loaded if isinstance(loaded, dict) else {}
        except (OSError, ValueError, TypeError):
            self.sessions = {}

    def _save(self):
        atomic_json_write(CONVERSATIONS_FILE, self.sessions)

    def get_session(self, session_id):
        with self._lock:
            if session_id not in self.sessions:
                self.sessions[session_id] = {
                    "session_id": session_id,
                    "created_at": datetime.datetime.now().isoformat(),
                    "updated_at": datetime.datetime.now().isoformat(),
                    "context": {
                        "category": None,
                        "categories": [],
                        "kategori_list": [],
                        "category_source": None,
                        "assigned_category": None,
                        "location": None,
                        "occurrence_date": None,
                        "initial_description": None,
                        "last_user_message": None,
                        "symptoms": [],
                        "error_message": None,
                        "steps_tried": [],
                        "last_result": None,
                        "status": "initial",
                        "kb_id": None
                    },
                    "messages": []
                }
            return self.sessions[session_id]

    def update_context(self, session_id, new_context):
        with self._lock:
            session = self.get_session(session_id)
            session["context"].update(new_context)
            session["updated_at"] = datetime.datetime.now().isoformat()
            self._save()
            return dict(session["context"])

    def add_message(self, session_id, role, content, meta=None):
        with self._lock:
            session = self.get_session(session_id)
            msg = {
                "role": role,
                "content": content,
                "timestamp": datetime.datetime.now().isoformat(),
                "meta": meta or {}
            }
            session["messages"].append(msg)
            session["updated_at"] = datetime.datetime.now().isoformat()
            self._save()
            return dict(msg)

    def clear_session(self, session_id):
        with self._lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
                self._save()
            return {"session_id": session_id, "cleared": True}

    def get_all_sessions(self):
        with self._lock:
            return list(self.sessions.values())

conversation_repo = ConversationRepository()
