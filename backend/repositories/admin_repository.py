import os
import json
import uuid
import datetime
import threading
from werkzeug.security import generate_password_hash, check_password_hash
from config.settings import STORAGE_DIR
from utils.json_storage import atomic_json_write, load_json_file
from utils.logger import logger

ADMIN_USERS_FILE = os.path.join(STORAGE_DIR, "admin_users.json")
DEFAULT_ADMIN_USERNAME = os.getenv("SIGAP_ADMIN_USER", "admin")
DEFAULT_ADMIN_PASSWORD = os.getenv("SIGAP_ADMIN_PASSWORD", "admin_hsse_2026")
DEFAULT_ADMIN_NAME = os.getenv("SIGAP_ADMIN_NAME", "Administrator HSSE")
DEFAULT_ADMIN_ROLE = os.getenv("SIGAP_ADMIN_ROLE", "HSSE Superintendent / Officer")

class AdminRepository:
    def __init__(self):
        self.users = {}
        self.sessions = {}  # token -> session_data
        self._lock = threading.RLock()
        self._load_users()

    def _load_users(self):
        with self._lock:
            try:
                loaded = load_json_file(ADMIN_USERS_FILE, {})
                if isinstance(loaded, dict) and loaded:
                    self.users = loaded
                else:
                    self._create_default_admin()
            except Exception as e:
                logger.warning(f"Error loading admin users: {e}. Initializing default admin.")
                self._create_default_admin()

    def _create_default_admin(self):
        hashed_password = generate_password_hash(DEFAULT_ADMIN_PASSWORD, method="pbkdf2:sha256")
        self.users = {
            DEFAULT_ADMIN_USERNAME: {
                "username": DEFAULT_ADMIN_USERNAME,
                "password_hash": hashed_password,
                "name": DEFAULT_ADMIN_NAME,
                "role": DEFAULT_ADMIN_ROLE,
                "email": "hsse.admin@pertamina.com",
                "unit": "PT Pertamina EP Lirik Field",
                "created_at": datetime.datetime.now().isoformat()
            }
        }
        self._save_users()

    def _save_users(self):
        try:
            atomic_json_write(ADMIN_USERS_FILE, self.users)
        except Exception as e:
            logger.error(f"Failed to persist admin users: {e}")

    def authenticate(self, username, password):
        with self._lock:
            user = self.users.get(username.strip())
            if not user:
                return None
            
            if check_password_hash(user["password_hash"], password):
                token = f"adm_sess_{uuid.uuid4().hex}"
                session_data = {
                    "token": token,
                    "username": user["username"],
                    "name": user["name"],
                    "role": user["role"],
                    "unit": user.get("unit", "Pertamina EP Lirik Field"),
                    "email": user.get("email", "hsse.admin@pertamina.com"),
                    "created_at": datetime.datetime.now().isoformat(),
                    "expires_at": (datetime.datetime.now() + datetime.timedelta(hours=24)).isoformat()
                }
                self.sessions[token] = session_data
                return session_data
            return None

    def validate_session(self, token):
        if not token:
            return None
        with self._lock:
            session = self.sessions.get(token)
            if not session:
                return None
            
            # Check expiry
            try:
                expires_at = datetime.datetime.fromisoformat(session["expires_at"])
                if datetime.datetime.now() > expires_at:
                    del self.sessions[token]
                    return None
            except Exception:
                pass

            return dict(session)

    def revoke_session(self, token):
        with self._lock:
            if token in self.sessions:
                del self.sessions[token]
                return True
            return False

admin_repo = AdminRepository()
