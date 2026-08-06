"""Validasi dan perapihan mekanis ``backend/data/knowledge.json``.

Contoh:
    python backend/scripts/maintain_knowledge.py --check
    python backend/scripts/maintain_knowledge.py --fix

Perintah ``--fix`` hanya membersihkan boilerplate yang sudah dikenal, spasi,
duplikasi kata kunci/tag, dan format JSON. Konten teknis baru tetap harus ditinjau
oleh personel HSE yang berwenang.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PATH = PROJECT_ROOT / "backend" / "data" / "knowledge.json"
REQUIRED_FIELDS = (
    "id",
    "kategori",
    "judul",
    "kata_kunci",
    "tingkat_risiko",
    "penjelasan_risiko",
    "solusi",
    "referensi",
    "tag",
)
VALID_RISKS = {"rendah", "sedang", "tinggi"}
ID_PATTERN = re.compile(r"^HSE-[A-Z0-9]+-\d{3}$")
GENERIC_IMPACT_SUFFIX = (
    ", yang dapat mengakibatkan cedera fisik pada pekerja, kerusakan "
    "fasilitas/alat kerja, serta mengganggu kelancaran operasional proyek."
)
GENERIC_PPE_SUFFIX = (
    ", serta wajibkan penggunaan alat pelindung yang sesuai standar SNI/ANSI"
)
GENERIC_IMMEDIATE_ACTION_FRAGMENTS = (
    "Hentikan pekerjaan sementara jika berisiko tinggi",
    "Kendalikan paparan yang sedang berlangsung",
)
OLD_GENERIC_VERIFICATION = (
    "3. Inspeksi & Pengawasan: Lakukan verifikasi kelayakan oleh Supervisor K3 "
    "sebelum aktivitas kerja dilanjutkan secara aman."
)
NEW_GENERIC_VERIFICATION = (
    "3. Inspeksi & Pengawasan: Dokumentasikan tindakan dan minta Supervisor atau "
    "Tim HSE memverifikasi pengendalian sebelum aktivitas dilanjutkan."
)
GENERIC_SYSTEMIC_SUFFIX = (
    " yang berpotensi memicu insiden keselamatan kerja, cedera fisik, "
    "dan ketidaksesuaian SOP K3 di lokasi proyek."
)
ACRONYMS = {
    "apd": "APD", "apar": "APAR", "b3": "B3", "co": "CO",
    "h2s": "H2S", "jsa": "JSA", "k3": "K3", "loto": "LOTO",
    "lti": "LTI", "mcb": "MCB", "msds": "MSDS", "n95": "N95",
    "nrr": "NRR", "p3k": "P3K", "ppe": "PPE", "ptw": "PTW",
    "scba": "SCBA", "sds": "SDS", "sika": "SIKA", "simops": "SIMOPS",
    "sio": "SIO", "sni": "SNI", "sop": "SOP", "tbm": "TBM",
}
RISK_SENTENCE_CORRECTIONS = {
    "HSE-APD-001": "tidak adanya perlindungan kepala meningkatkan kemungkinan cedera serius akibat benda jatuh atau benturan keras.",
    "HSE-APD-012": "APD yang tidak nyaman dapat mendorong pekerja melepas atau tidak menggunakannya sehingga tubuh terpapar bahaya pekerjaan.",
    "HSE-PENGAWASAN-009": "kurangnya pengawasan pada malam hari dapat membuat penyimpangan prosedur terlambat diketahui dan respons darurat melambat.",
    "HSE-RISIKO-010": "interaksi antarbahaya dapat tidak dikenali sehingga pengendalian satu pekerjaan bertentangan atau tidak memadai untuk pekerjaan lainnya.",
    "HSE-BUDAYA-003": "tekanan target dapat mendorong pekerja melewati SOP, mempercepat pekerjaan secara tidak aman, atau mengabaikan hak menghentikan pekerjaan.",
    "HSE-PERILAKU-001": "pengendalian yang telah ditetapkan tidak diterapkan sehingga tindakan tidak aman dapat berulang dan memicu insiden.",
    "HSE-PERILAKU-004": "distraksi menurunkan perhatian terhadap perubahan kondisi, pergerakan alat, dan peringatan bahaya di sekitar pekerja.",
    "HSE-PERILAKU-005": "pekerja dapat melewati pemeriksaan, SOP, atau batas aman demi mengejar target waktu.",
    "HSE-PERILAKU-006": "pekerja yang mengalami insiden dapat terlambat memperoleh bantuan karena tidak ada rekan atau petugas siaga di dekatnya.",
    "HSE-PERILAKU-007": "alat improvisasi dapat gagal saat digunakan karena kapasitas, material, atau pengamannya tidak terverifikasi.",
    "HSE-INSIDEN-002": "akar penyebab kecelakaan tidak diketahui sehingga tindakan korektif tidak tepat dan kejadian serupa dapat berulang.",
    "HSE-INSIDEN-003": "pola dan akar penyebab insiden tidak teridentifikasi sehingga peluang pencegahan kejadian berulang terlewat.",
    "HSE-AUDIT-007": "evaluasi kepatuhan, penelusuran keputusan, dan verifikasi pengendalian menjadi sulit dilakukan karena bukti tidak lengkap.",
    "HSE-BUDAYA-005": "tekanan target dapat menurunkan fokus dan mendorong pekerja mengabaikan prosedur keselamatan.",
    "HSE-BUDAYA-008": "keputusan organisasi dapat mengutamakan produksi daripada pengendalian sehingga bahaya sistemik tidak segera diperbaiki.",
    "HSE-STANDAR-001": "persyaratan minimum, tanggung jawab, dan kriteria penerimaan pekerjaan menjadi tidak jelas sehingga pengendalian diterapkan tidak konsisten.",
    "HSE-STANDAR-003": "pekerja dapat menggunakan persyaratan yang sudah tidak sesuai dengan kondisi, peralatan, atau perubahan regulasi terbaru.",
}


def load_entries(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError("Akar knowledge.json wajib berupa array JSON.")
    return data


def validate(entries: list[dict]) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    for position, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict):
            errors.append(f"Artikel #{position} bukan object JSON.")
            continue

        kb_id = str(entry.get("id", "")).strip() or f"artikel #{position}"
        for field in REQUIRED_FIELDS:
            value = entry.get(field)
            if value is None or (isinstance(value, str) and not value.strip()):
                errors.append(f"{kb_id}: field '{field}' kosong.")
            if field in {"kata_kunci", "tag"} and (
                not isinstance(value, list) or not value
            ):
                errors.append(f"{kb_id}: field '{field}' wajib berupa array berisi data.")

        if kb_id in seen_ids:
            errors.append(f"ID duplikat: {kb_id}.")
        seen_ids.add(kb_id)

        if not ID_PATTERN.fullmatch(kb_id):
            errors.append(f"{kb_id}: format ID wajib HSE-KATEGORI-001.")

        risk = str(entry.get("tingkat_risiko", "")).strip().lower()
        if risk not in VALID_RISKS:
            errors.append(f"{kb_id}: tingkat_risiko '{risk}' tidak valid.")

        if len(str(entry.get("penjelasan_risiko", "")).strip()) < 500:
            errors.append(f"{kb_id}: penjelasan_risiko terlalu singkat (minimal 500 karakter).")
        if len(entry.get("kata_kunci", [])) < 3:
            errors.append(f"{kb_id}: minimal tiga kata_kunci diperlukan.")
        if len(entry.get("tag", [])) < 2:
            errors.append(f"{kb_id}: minimal dua tag diperlukan.")

        references = entry.get("referensi", [])
        if not isinstance(references, list) or len(references) < 2:
            errors.append(f"{kb_id}: minimal dua referensi resmi diperlukan.")
        else:
            for reference_number, reference in enumerate(references, start=1):
                if not isinstance(reference, dict):
                    errors.append(
                        f"{kb_id}: referensi #{reference_number} wajib berupa object."
                    )
                    continue
                title = str(reference.get("judul", "")).strip()
                url = str(reference.get("url", "")).strip()
                if not title or not url.startswith("https://"):
                    errors.append(
                        f"{kb_id}: referensi #{reference_number} wajib memiliki judul "
                        "dan URL HTTPS."
                    )

        solution_lines = str(entry.get("solusi", "")).splitlines()
        if len(solution_lines) < 3:
            errors.append(f"{kb_id}: solusi wajib memiliki minimal tiga langkah.")
        else:
            for number, line in enumerate(solution_lines, start=1):
                if not line.strip().startswith(f"{number}."):
                    errors.append(f"{kb_id}: langkah solusi #{number} tidak bernomor benar.")
            immediate_action = solution_lines[0].strip()
            if not immediate_action.startswith("1. Tindakan Segera: "):
                errors.append(
                    f"{kb_id}: langkah pertama wajib diawali '1. Tindakan Segera:'."
                )
            if any(
                fragment.casefold() in immediate_action.casefold()
                for fragment in GENERIC_IMMEDIATE_ACTION_FRAGMENTS
            ):
                errors.append(
                    f"{kb_id}: tindakan segera masih generik dan wajib disesuaikan "
                    "dengan kondisi bahaya artikel."
                )
    return errors


def clean_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace(".,", ".")
    return text


def normalize_acronyms(text: str) -> str:
    for source, target in ACRONYMS.items():
        text = re.sub(rf"\b{re.escape(source)}\b", target, text, flags=re.IGNORECASE)
    text = re.sub(r"\bdb\b", "dB", text, flags=re.IGNORECASE)
    return text


def clean_entries(entries: list[dict]) -> list[dict]:
    cleaned: list[dict] = []
    for original in entries:
        entry = dict(original)
        entry["id"] = str(entry.get("id", "")).strip()
        for field in ("kategori", "judul"):
            entry[field] = normalize_acronyms(str(entry.get(field, "")).strip())

        risk_explanation = str(entry.get("penjelasan_risiko", "")).strip()
        if risk_explanation.endswith(GENERIC_IMPACT_SUFFIX):
            risk_explanation = risk_explanation[: -len(GENERIC_IMPACT_SUFFIX)].rstrip()
            risk_explanation = re.sub(r"[,.]+$", "", risk_explanation) + "."
        risk_explanation = risk_explanation.replace(
            "kondisi ini berisiko menyebabkan risiko ",
            "kondisi ini meningkatkan risiko ",
        )
        risk_explanation = normalize_acronyms(clean_sentence(risk_explanation))
        if risk_explanation.endswith(GENERIC_SYSTEMIC_SUFFIX):
            risk_explanation = risk_explanation[: -len(GENERIC_SYSTEMIC_SUFFIX)].rstrip()
            risk_explanation = re.sub(r"[,.]+$", "", risk_explanation) + "."
        correction = RISK_SENTENCE_CORRECTIONS.get(entry["id"])
        if correction:
            marker = "Tanpa penerapan kendali K3 yang tepat, "
            prefix = risk_explanation.split(marker, 1)[0]
            risk_explanation = prefix + marker + correction
        entry["penjelasan_risiko"] = risk_explanation

        solution_lines = []
        for line in str(entry.get("solusi", "")).splitlines():
            line = line.strip().replace(GENERIC_PPE_SUFFIX, "")
            line = line.replace("Pengendalian Teknis & APD:", "Pengendalian:")
            line = line.replace(OLD_GENERIC_VERIFICATION, NEW_GENERIC_VERIFICATION)
            line = normalize_acronyms(clean_sentence(line))
            if line:
                solution_lines.append(line)
        entry["solusi"] = "\n".join(solution_lines)

        for field in ("kata_kunci", "tag"):
            values = entry.get(field, [])
            entry[field] = list(
                dict.fromkeys(
                    normalize_acronyms(str(value).strip())
                    for value in values
                    if str(value).strip()
                )
            )
        entry["referensi"] = [
            {
                "judul": clean_sentence(str(reference.get("judul", ""))),
                "url": str(reference.get("url", "")).strip(),
            }
            for reference in entry.get("referensi", [])
            if isinstance(reference, dict)
        ]
        entry["tingkat_risiko"] = str(entry.get("tingkat_risiko", "")).lower().strip()
        cleaned.append(entry)

    # Dua klasifikasi lama tidak konsisten dengan dampak yang tertulis.
    risk_corrections = {
        "HSE-APD-007": "tinggi",       # potensi tertabrak secara fatal
        "HSE-LINGKUNGAN-010": "sedang",  # potensi hipotermia
    }
    for entry in cleaned:
        if entry["id"] in risk_corrections:
            entry["tingkat_risiko"] = risk_corrections[entry["id"]]
    return cleaned


def atomic_write(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temp_name = tempfile.mkstemp(
        prefix="knowledge-", suffix=".json.tmp", dir=path.parent
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as file:
            json.dump(entries, file, ensure_ascii=False, indent=2)
            file.write("\n")
        os.replace(temp_name, path)
    except Exception:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
        raise


def print_summary(path: Path, entries: list[dict], errors: list[str]) -> None:
    categories = Counter(entry.get("kategori", "") for entry in entries)
    risks = Counter(entry.get("tingkat_risiko", "") for entry in entries)
    print(f"Sumber            : {path}")
    print(f"Total artikel     : {len(entries)}")
    print(f"Total kategori    : {len(categories)}")
    print(
        "Ringkasan risiko  : "
        + ", ".join(f"{risk}={risks.get(risk, 0)}" for risk in ("tinggi", "sedang", "rendah"))
    )
    print(f"Status validasi   : {'VALID' if not errors else 'TIDAK VALID'}")
    for error in errors[:20]:
        print(f"- {error}")
    if len(errors) > 20:
        print(f"- ... dan {len(errors) - 20} kesalahan lainnya")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", type=Path, default=DEFAULT_PATH)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="Validasi tanpa mengubah file.")
    mode.add_argument("--fix", action="store_true", help="Rapikan lalu validasi file.")
    args = parser.parse_args()

    entries = load_entries(args.path)
    if args.fix:
        entries = clean_entries(entries)
        errors = validate(entries)
        if errors:
            print_summary(args.path, entries, errors)
            return 1
        atomic_write(args.path, entries)
    errors = validate(entries)
    print_summary(args.path, entries, errors)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
