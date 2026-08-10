import json
import os
import tempfile


def load_json_file(path, default):
    """Membaca JSON dan mengembalikan default jika file belum tersedia."""
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def atomic_json_write(path, data):
    """Menulis JSON secara atomik agar file tidak setengah tertulis saat gagal."""
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    descriptor, temp_path = tempfile.mkstemp(
        prefix="storage-", suffix=".json.tmp", dir=directory
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
            file.write("\n")
        os.replace(temp_path, path)
    except Exception:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
