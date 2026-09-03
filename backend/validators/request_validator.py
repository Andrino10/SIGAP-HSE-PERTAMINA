import datetime
import re

from repositories.knowledge_repository import knowledge_repo


def _text_value(
    data,
    field,
    errors,
    label,
    *,
    aliases=(),
    required=False,
    min_length=None,
    max_length=None,
):
    """Read a text field safely and append one clear error per failed rule."""
    candidates = (field, *aliases)
    selected_field = field
    raw_value = None

    for candidate in candidates:
        value = data.get(candidate)
        if value not in (None, ""):
            selected_field = candidate
            raw_value = value
            break
        if candidate in data and raw_value is None:
            selected_field = candidate
            raw_value = value

    if raw_value is None:
        text = ""
    elif not isinstance(raw_value, str):
        errors.append({"field": selected_field, "message": f"{label} harus berupa teks."})
        return ""
    else:
        text = raw_value.strip()

    if not text:
        if required:
            errors.append({"field": field, "message": f"{label} wajib diisi."})
        return ""

    if min_length is not None and len(text) < min_length:
        errors.append(
            {
                "field": field,
                "message": f"{label} terlalu pendek (minimal {min_length} karakter).",
            }
        )
    elif max_length is not None and len(text) > max_length:
        errors.append(
            {
                "field": field,
                "message": f"{label} terlalu panjang (maksimal {max_length} karakter).",
            }
        )
    return text


def _validate_occurrence_date(data, errors, *, required, aliases=("tanggal_kejadian",)):
    value = _text_value(
        data,
        "occurrence_date",
        errors,
        "Tanggal kejadian",
        aliases=aliases,
        required=required,
        max_length=10,
    )
    if not value:
        return ""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        errors.append(
            {
                "field": "occurrence_date",
                "message": "Tanggal kejadian harus menggunakan format YYYY-MM-DD yang valid.",
            }
        )
        return ""
    try:
        parsed = datetime.date.fromisoformat(value)
    except ValueError:
        errors.append(
            {
                "field": "occurrence_date",
                "message": "Tanggal kejadian harus menggunakan format YYYY-MM-DD yang valid.",
            }
        )
        return ""
    if parsed > datetime.date.today():
        errors.append(
            {
                "field": "occurrence_date",
                "message": "Tanggal kejadian tidak boleh melebihi hari ini.",
            }
        )
    return value


def _validate_reporter_name(data, errors, *, required):
    value = _text_value(
        data,
        "reporter_name",
        errors,
        "Nama pelapor",
        aliases=("nama_pelapor",),
        required=required,
        min_length=2,
        max_length=150,
    )
    if value.lower() in {"anonim", "pelapor anonim"}:
        errors.append(
            {
                "field": "reporter_name",
                "message": "Nama pelapor harus menggunakan identitas yang jelas.",
            }
        )
    return value


def _valid_categories():
    return {item["nama"] for item in knowledge_repo.get_categories()}


def _validate_category(data, errors, *, required, aliases=()):
    category = _text_value(
        data,
        "category",
        errors,
        "Kategori",
        aliases=aliases,
        required=required,
        max_length=100,
    )
    if category and category not in _valid_categories():
        errors.append(
            {
                "field": "category",
                "message": f"Kategori '{category}' tidak tersedia di knowledge.json.",
            }
        )
    return category


def _validate_categories(data, errors, *, required, aliases=()):
    """Validasi daftar kategori dengan dukungan payload kategori tunggal lama."""
    selected_field = None
    raw_categories = None
    for field in ("categories", "kategori_list"):
        if field in data:
            selected_field = field
            raw_categories = data.get(field)
            break

    if selected_field is None:
        category = _validate_category(
            data,
            errors,
            required=required,
            aliases=aliases,
        )
        return [category] if category else []

    if not isinstance(raw_categories, list):
        errors.append(
            {
                "field": selected_field,
                "message": "Kategori harus berupa daftar teks.",
            }
        )
        return []

    legacy_category_present = any(
        isinstance(data.get(field), str) and data.get(field).strip()
        for field in ("category", *aliases)
    )
    if not raw_categories and legacy_category_present:
        category = _validate_category(
            data,
            errors,
            required=required,
            aliases=aliases,
        )
        return [category] if category else []

    if required and not raw_categories:
        errors.append(
            {
                "field": selected_field,
                "message": "Minimal satu kategori wajib dipilih.",
            }
        )
        return []

    if len(raw_categories) > 5:
        errors.append(
            {
                "field": selected_field,
                "message": "Maksimal lima kategori dapat dipilih dalam satu laporan.",
            }
        )

    valid_categories = _valid_categories()
    categories = []
    for index, raw_category in enumerate(raw_categories):
        if not isinstance(raw_category, str):
            errors.append(
                {
                    "field": f"{selected_field}[{index}]",
                    "message": "Setiap kategori harus berupa teks.",
                }
            )
            continue

        category = raw_category.strip()
        if not category:
            errors.append(
                {
                    "field": f"{selected_field}[{index}]",
                    "message": "Kategori tidak boleh kosong.",
                }
            )
        elif len(category) > 100:
            errors.append(
                {
                    "field": f"{selected_field}[{index}]",
                    "message": "Kategori terlalu panjang (maksimal 100 karakter).",
                }
            )
        elif category not in valid_categories:
            errors.append(
                {
                    "field": f"{selected_field}[{index}]",
                    "message": f"Kategori '{category}' tidak tersedia di knowledge.json.",
                }
            )
        elif category in categories:
            errors.append(
                {
                    "field": selected_field,
                    "message": f"Kategori '{category}' dipilih lebih dari satu kali.",
                }
            )
        else:
            categories.append(category)

    if "Umum" in categories and len(categories) > 1:
        errors.append(
            {
                "field": selected_field,
                "message": "Kategori 'Umum' tidak dapat digabungkan dengan kategori khusus.",
            }
        )

    return categories


def validate_chat_request(data):
    if not isinstance(data, dict):
        return ["Request payload harus berupa JSON object."]

    errors = []
    _text_value(
        data,
        "message",
        errors,
        "Pesan pertanyaan",
        required=True,
        min_length=2,
        max_length=1000,
    )
    _text_value(
        data,
        "session_id",
        errors,
        "Session ID",
        aliases=("id_sesi",),
        max_length=150,
    )
    _validate_categories(data, errors, required=False, aliases=("kategori",))
    return errors


def validate_complaint_request(data):
    if not isinstance(data, dict):
        return ["Request payload harus berupa JSON object."]

    errors = []
    _validate_reporter_name(data, errors, required=True)
    _text_value(
        data,
        "division",
        errors,
        "Fungsi/Divisi pelapor",
        required=True,
        max_length=150,
    )
    _text_value(
        data,
        "location",
        errors,
        "Lokasi kejadian",
        required=True,
        max_length=250,
    )
    _validate_occurrence_date(data, errors, required=True)
    _validate_categories(data, errors, required=True)
    _text_value(
        data,
        "description",
        errors,
        "Deskripsi masalah",
        required=True,
        min_length=10,
        max_length=3000,
    )

    urgency = _text_value(
        data,
        "urgency",
        errors,
        "Urgensi",
        max_length=20,
    )
    if urgency and urgency not in {"Ringan", "Sedang", "Berat", "Tinggi"}:
        errors.append(
            {
                "field": "urgency",
                "message": "Urgensi harus Ringan, Sedang, Berat, atau Tinggi.",
            }
        )
    return errors


def validate_consultation_request(data):
    """Validate a condition report from the consultation form."""
    if not isinstance(data, dict):
        return ["Request payload harus berupa JSON object."]

    errors = []
    _validate_reporter_name(data, errors, required=True)
    _text_value(
        data,
        "division",
        errors,
        "Fungsi/Divisi",
        required=True,
        max_length=150,
    )
    _text_value(
        data,
        "location",
        errors,
        "Lokasi temuan",
        required=True,
        max_length=250,
    )
    _validate_occurrence_date(data, errors, required=True)
    _text_value(
        data,
        "description",
        errors,
        "Deskripsi kondisi bahaya",
        required=True,
        min_length=10,
        max_length=3000,
    )
    _validate_categories(data, errors, required=True)
    _text_value(data, "session_id", errors, "Session ID", max_length=150)

    urgency = _text_value(
        data,
        "urgency",
        errors,
        "Urgensi",
        max_length=20,
    )
    if urgency and urgency not in {"Ringan", "Sedang", "Berat", "Tinggi"}:
        errors.append(
            {
                "field": "urgency",
                "message": "Urgensi harus Ringan, Sedang, Berat, atau Tinggi.",
            }
        )
    return errors


def validate_resolution_request(data):
    if not isinstance(data, dict):
        return ["Request payload harus berupa JSON object."]

    errors = []
    _text_value(
        data,
        "session_id",
        errors,
        "Session ID",
        aliases=("id_sesi",),
        required=True,
        max_length=150,
    )
    if "resolved" in data and not isinstance(data["resolved"], bool):
        errors.append({"field": "resolved", "message": "Status resolved wajib berupa boolean."})

    _text_value(data, "feedback", errors, "Feedback", max_length=1000)
    _text_value(
        data,
        "selected_tech_number",
        errors,
        "Nomor petugas pilihan",
        aliases=("nomor_petugas_pilihan",),
        max_length=30,
    )
    _validate_reporter_name(data, errors, required=False)
    for field, aliases, label, maximum in (
        ("division", ("divisi",), "Fungsi/Divisi", 150),
        ("location", ("lokasi",), "Lokasi", 250),
        ("description", ("deskripsi",), "Deskripsi", 3000),
        ("ticket_number", (), "Nomor tiket", 100),
    ):
        _text_value(
            data,
            field,
            errors,
            label,
            aliases=aliases,
            max_length=maximum,
        )

    _validate_occurrence_date(data, errors, required=False)

    _validate_categories(data, errors, required=False, aliases=("kategori",))
    urgency = _text_value(
        data,
        "urgency",
        errors,
        "Urgensi",
        aliases=("urgensi",),
        max_length=20,
    )
    if urgency and urgency not in {"Ringan", "Sedang", "Berat", "Tinggi"}:
        errors.append(
            {
                "field": "urgency",
                "message": "Urgensi harus Ringan, Sedang, Berat, atau Tinggi.",
            }
        )
    return errors
