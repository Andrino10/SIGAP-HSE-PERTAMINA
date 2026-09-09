import os
import json
import uuid
import datetime
import threading
import base64
import hashlib
import hmac
from werkzeug.security import generate_password_hash, check_password_hash
from config.settings import STORAGE_DIR
from utils.json_storage import atomic_json_write, load_json_file
from utils.logger import logger

ADMIN_USERS_FILE = os.path.join(STORAGE_DIR, "admin_users.json")
# Dukung nama variabel lama dan nama yang didokumentasikan di Vercel.
DEFAULT_ADMIN_USERNAME = os.getenv("SIGAP_ADMIN_USER") or os.getenv("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASSWORD = os.getenv("SIGAP_ADMIN_PASSWORD") or os.getenv("ADMIN_PASSWORD", "admin_hsse_2026")
DEFAULT_ADMIN_NAME = os.getenv("SIGAP_ADMIN_NAME", "Administrator HSSE")
DEFAULT_ADMIN_ROLE = os.getenv("SIGAP_ADMIN_ROLE", "HSSE Superintendent / Officer")
SESSION_SECRET = (
    os.getenv("SIGAP_ADMIN_SESSION_SECRET")
    or os.getenv("ADMIN_JWT_SECRET")
    or "sigap-development-secret-change-in-production"
).encode("utf-8")
SESSION_TTL_HOURS = 24

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

    @staticmethod
    def _encode_segment(value):
        return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")

    @staticmethod
    def _decode_segment(value):
        padding = "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(f"{value}{padding}")

    def _issue_token(self, session_data):
        """Buat token bertanda tangan yang tetap valid lintas instance serverless."""
        payload = json.dumps(session_data, separators=(",", ":")).encode("utf-8")
        encoded_payload = self._encode_segment(payload)
        signature = hmac.new(
            SESSION_SECRET, encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        return f"adm_v1.{encoded_payload}.{self._encode_segment(signature)}"

    def _read_token(self, token):
        try:
            version, encoded_payload, encoded_signature = str(token).split(".", 2)
            if version != "adm_v1":
                return None
            expected_signature = hmac.new(
                SESSION_SECRET, encoded_payload.encode("ascii"), hashlib.sha256
            ).digest()
            actual_signature = self._decode_segment(encoded_signature)
            if not hmac.compare_digest(expected_signature, actual_signature):
                return None
            session = json.loads(self._decode_segment(encoded_payload).decode("utf-8"))
            expires_at = datetime.datetime.fromisoformat(session["expires_at"])
            if datetime.datetime.now(datetime.timezone.utc) >= expires_at:
                return None
            return session
        except (ValueError, KeyError, TypeError, json.JSONDecodeError):
            return None

    def authenticate(self, username, password):
        with self._lock:
            user = self.users.get(username.strip())
            if not user:
                return None
            
            if check_password_hash(user["password_hash"], password):
                session_data = {
                    "username": user["username"],
                    "name": user["name"],
                    "role": user["role"],
                    "unit": user.get("unit", "Pertamina EP Lirik Field"),
                    "email": user.get("email", "hsse.admin@pertamina.com"),
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "expires_at": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=SESSION_TTL_HOURS)).isoformat(),
                    "session_id": uuid.uuid4().hex,
                }
                token = self._issue_token(session_data)
                session_data["token"] = token
                self.sessions[token] = session_data
                return session_data
            return None

    def validate_session(self, token):
        if not token:
            return None
        with self._lock:
            # Logout pada instance yang sama tetap langsung mencabut token.
            if token in self.sessions and self.sessions[token] is None:
                return None

            # Jangan mengandalkan dictionary proses: Vercel dapat mengarahkan
            # request berikutnya ke instance lain. Tanda tangan token menjaga
            # sesi tetap dapat diverifikasi lintas instance sampai kedaluwarsa.
            session = self._read_token(token)
            if not session:
                return None
            session["token"] = token
            return session

    def revoke_session(self, token):
        with self._lock:
            if not self._read_token(token):
                return False
            self.sessions[token] = None
            return True

admin_repo = AdminRepository()
