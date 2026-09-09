import json
import os
import tempfile
import time
import hashlib
from urllib.error import URLError
from urllib.request import Request, urlopen


def _redis_config():
    """Return REST credentials injected by Upstash/Vercel Marketplace, if any."""
    url = os.getenv("UPSTASH_REDIS_REST_URL") or os.getenv("KV_REST_API_URL")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN") or os.getenv("KV_REST_API_TOKEN")
    if not url or not token:
        # Integrasi Upstash Marketplace dapat menambahkan custom prefix, contoh:
        # UPSTASH_REDIS_REST_KV_REST_API_URL dan pasangan ..._TOKEN.
        for variable_name, candidate_url in os.environ.items():
            if not variable_name.endswith("_KV_REST_API_URL"):
                continue
            candidate_token = os.getenv(f"{variable_name[:-3]}TOKEN")
            if candidate_url and candidate_token:
                url, token = candidate_url, candidate_token
                break
    if not url or not token:
        return None
    return url.rstrip("/"), token


def _redis_key(path):
    # Path hash keeps separate files (complaints, users, conversations) in one store
    # without exposing local filesystem layout as a database key.
    path_hash = hashlib.sha256(os.path.abspath(path).encode("utf-8")).hexdigest()[:20]
    return f"sigap-hsse:json:{path_hash}"


def _redis_command(command):
    config = _redis_config()
    if not config:
        return None

    url, token = config
    request = Request(
        url,
        data=json.dumps(command, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (URLError, OSError, ValueError) as exc:
        raise RuntimeError(f"Penyimpanan Redis tidak dapat diakses: {exc}") from exc

    if payload.get("error"):
        raise RuntimeError(f"Penyimpanan Redis menolak perintah: {payload['error']}")
    return payload.get("result")


def next_counter(name):
    """Atomically increment a counter when Redis storage is configured."""
    if not _redis_config():
        return None
    result = _redis_command(["INCR", f"sigap-hsse:counter:{name}"])
    try:
        return int(result)
    except (TypeError, ValueError) as exc:
        raise RuntimeError("Penyimpanan Redis memberi urutan tiket yang tidak valid.") from exc


def get_storage_status():
    """Return a non-sensitive storage diagnostic for authenticated admins."""
    if not _redis_config():
        return {
            "backend": "filesystem-sementara",
            "persistent": False,
            "healthy": False,
            "message": "Kredensial Redis belum tersedia pada Function ini.",
        }
    try:
        healthy = _redis_command(["PING"]) == "PONG"
    except RuntimeError:
        healthy = False
    return {
        "backend": "upstash-redis",
        "persistent": healthy,
        "healthy": healthy,
        "message": "Redis aktif dan tiket tersimpan persisten." if healthy else "Redis terkonfigurasi tetapi belum dapat dihubungi.",
    }


def load_json_file(path, default):
    """Membaca JSON dan mengembalikan default jika file belum tersedia."""
    if _redis_config():
        raw_value = _redis_command(["GET", _redis_key(path)])
        if raw_value is None:
            return default
        if not isinstance(raw_value, str):
            raise ValueError("Nilai penyimpanan Redis bukan teks JSON.")
        return json.loads(raw_value)

    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def atomic_json_write(path, data):
    """Menulis JSON secara atomik agar file tidak setengah tertulis saat gagal."""
    if _redis_config():
        serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        result = _redis_command(["SET", _redis_key(path), serialized])
        if result != "OK":
            raise RuntimeError("Penyimpanan Redis gagal menyimpan data SIGAP.")
        return

    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    descriptor, temp_path = tempfile.mkstemp(
        prefix="storage-", suffix=".json.tmp", dir=directory
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
            file.write("\n")
        
        # Retry loop for Windows file system locks (e.g. OneDrive)
        for attempt in range(5):
            try:
                os.replace(temp_path, path)
                break
            except PermissionError:
                if attempt == 4:
                    raise
                time.sleep(0.05)
    except Exception:
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass
        raise
