import os
import uuid
import datetime
import hashlib
import threading
from werkzeug.security import generate_password_hash, check_password_hash
from config.settings import STORAGE_DIR
from utils.json_storage import atomic_json_write, load_json_file
from utils.logger import logger

ADMIN_USERS_FILE = os.path.join(STORAGE_DIR, "admin_users.json")
ADMIN_SESSIONS_FILE = os.path.join(STORAGE_DIR, "admin_sessions.json")

DEFAULT_ADMIN_USERNAME = os.getenv("SIGAP_ADMIN_USER", "admin")
DEFAULT_ADMIN_PASSWORD = os.getenv("SIGAP_ADMIN_PASSWORD", "admin_hsse_2026")
DEFAULT_ADMIN_NAME = os.getenv("SIGAP_ADMIN_NAME", "Administrator HSSE")
DEFAULT_ADMIN_ROLE = os.getenv("SIGAP_ADMIN_ROLE", "HSSE Superintendent / Officer")


class AdminRepository:
    def __init__(self):
        self.users = {}
        self._lock = threading.RLock()
        self._load_users()

    def _load_users(self):
        """Muat data pengguna admin dari file. Jika gagal, buat default admin."""
        with self._lock:
            loaded = {}
            try:
                loaded = load_json_file(ADMIN_USERS_FILE, {})
            except Exception as e:
                logger.warning(f"Tidak bisa baca admin_users.json: {e}")

            if isinstance(loaded, dict) and loaded:
                self.users = loaded
                logger.info(f"Admin users dimuat dari file: {list(self.users.keys())}")
            else:
                logger.info("admin_users.json kosong/tidak ada. Membuat default admin...")
                self._create_default_admin()

    def _create_default_admin(self):
        """Buat akun admin default dan simpan ke file."""
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
        """Simpan data pengguna ke file JSON."""
        try:
            atomic_json_write(ADMIN_USERS_FILE, self.users)
        except Exception as e:
            logger.error(f"Gagal menyimpan admin users: {e}")

    # ── Utility: verifikasi password ──────────────────────────────────────────

    def _verify_password(self, user: dict, password: str) -> bool:
        """
        Verifikasi password dengan dua strategi:
        1. Gunakan werkzeug check_password_hash (hash dari file)
        2. Fallback: bandingkan langsung dengan DEFAULT_ADMIN_PASSWORD jika user adalah admin default
        """
        stored_hash = user.get("password_hash", "")
        # Strategi 1: Verifikasi hash werkzeug
        try:
            if stored_hash and check_password_hash(stored_hash, password):
                return True
        except Exception as e:
            logger.warning(f"check_password_hash gagal: {e}")

        # Strategi 2: Fallback langsung (untuk admin default di cold-start Vercel)
        if (user.get("username") == DEFAULT_ADMIN_USERNAME
                and password == DEFAULT_ADMIN_PASSWORD):
            logger.info("Login admin via fallback plaintext match (cold-start tolerance).")
            return True

        return False

    # ── Session persistence ──────────────────────────────────────────────────
    # Sessions disimpan di file JSON agar tidak hilang saat Vercel cold-start.

    def _load_sessions(self) -> dict:
        """Baca semua session dari file dan kembalikan sebagai dict token -> session."""
        try:
            data = load_json_file(ADMIN_SESSIONS_FILE, {})
            if isinstance(data, dict):
                return data
        except Exception:
            pass
        return {}

    def _save_sessions(self, sessions: dict):
        """Tulis dict session ke file secara atomik."""
        try:
            atomic_json_write(ADMIN_SESSIONS_FILE, sessions)
        except Exception as e:
            logger.error(f"Gagal menyimpan admin sessions: {e}")

    def _purge_expired(self, sessions: dict) -> dict:
        """Hapus session kadaluarsa dan kembalikan yang masih valid."""
        now = datetime.datetime.now()
        valid = {}
        for token, sess in sessions.items():
            try:
                exp = datetime.datetime.fromisoformat(sess["expires_at"])
                if now <= exp:
                    valid[token] = sess
            except Exception:
                pass  # Abaikan session dengan data rusak
        return valid

    # ── Public API ───────────────────────────────────────────────────────────

    def authenticate(self, username: str, password: str):
        """
        Autentikasi admin. Return session_data jika sukses, None jika gagal.
        Mendukung cold-start Vercel: password DEFAULT_ADMIN_PASSWORD selalu diterima
        untuk username DEFAULT_ADMIN_USERNAME.
        """
        with self._lock:
            # Jika users kosong (cold-start race condition), reload dulu
            if not self.users:
                self._load_users()

            # Cari user di dictionary
            user = self.users.get(username.strip())

            # Fallback: Jika user tidak ada di file tapi ini adalah admin default,
            # izinkan login dan sekaligus seed data admin ke file.
            if not user:
                if (username.strip() == DEFAULT_ADMIN_USERNAME
                        and password == DEFAULT_ADMIN_PASSWORD):
                    logger.info("Admin default tidak ada di file, membuat ulang untuk cold-start...")
                    self._create_default_admin()
                    user = self.users.get(DEFAULT_ADMIN_USERNAME)
                else:
                    logger.warning(f"Login gagal: username '{username}' tidak ditemukan.")
                    return None

            # Verifikasi password
            if not self._verify_password(user, password):
                logger.warning(f"Login gagal: password salah untuk '{username}'.")
                return None

            # Buat token session
            token = f"adm_sess_{uuid.uuid4().hex}"
            now = datetime.datetime.now()
            session_data = {
                "token": token,
                "username": user["username"],
                "name": user["name"],
                "role": user["role"],
                "unit": user.get("unit", "Pertamina EP Lirik Field"),
                "email": user.get("email", "hsse.admin@pertamina.com"),
                "created_at": now.isoformat(),
                "expires_at": (now + datetime.timedelta(hours=72)).isoformat()
            }

            # Simpan session ke file (persisten di Vercel)
            try:
                sessions = self._load_sessions()
                sessions = self._purge_expired(sessions)
                sessions[token] = session_data
                self._save_sessions(sessions)
            except Exception as e:
                logger.error(f"Gagal menyimpan session setelah login: {e}")
                # Tetap kembalikan session_data walau simpan gagal (in-flight session)

            logger.info(f"Login berhasil untuk admin '{username}'. Token: {token[:20]}...")
            return session_data

    def validate_session(self, token: str):
        """
        Validasi token session. Return session_data jika valid, None jika tidak.
        Membaca dari file agar valid di semua Vercel instance.
        """
        if not token:
            return None

        with self._lock:
            # Selalu baca dari file (multi-instance Vercel)
            sessions = self._load_sessions()
            session = sessions.get(token)
            if not session:
                return None

            # Cek expiry
            try:
                expires_at = datetime.datetime.fromisoformat(session["expires_at"])
                if datetime.datetime.now() > expires_at:
                    # Hapus token kadaluarsa
                    del sessions[token]
                    self._save_sessions(sessions)
                    return None
            except Exception:
                pass

            return dict(session)

    def revoke_session(self, token: str) -> bool:
        """Hapus session (logout)."""
        with self._lock:
            sessions = self._load_sessions()
            if token in sessions:
                del sessions[token]
                self._save_sessions(sessions)
                return True
            return False


admin_repo = AdminRepository()
