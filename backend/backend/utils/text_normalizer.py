import re

PETA_TYPO = {
    "ga": "tidak",
    "gak": "tidak",
    "ngga": "tidak",
    "nggak": "tidak",
    "tdk": "tidak",
    "gabisa": "tidak bisa",
    "cant": "tidak bisa",
    "pake": "pakai",
    "pke": "pakai",
    "gapake": "tidak pakai",
    "gapke": "tidak pakai",
    "helmnya": "helm",
    "harnessnya": "harness",
    "sepatunya": "sepatu",
    "kabelnya": "kabel",
    "alatnya": "alat",
    "tanggannya": "tangga",
    "apd nya": "apd",
    "apdnya": "apd",
    "tglnya": "tangga",
    "sarung tangannya": "sarung tangan",
    "maskernya": "masker",
    "forkliftnya": "forklift",
    "cranenya": "crane",
    "gensetnya": "generator",
    "bahya": "bahaya",
    "bhaya": "bahaya",
    "jatoh": "jatuh",
    "ketingian": "ketinggian",
    "kelistrik": "listrik",
    "loto": "lockout tagout",
    "statusnya": "status"
}

def normalisasi_teks(teks):
    """Membersihkan dan menormalisasi teks masukan pengguna ke Bahasa Indonesia baku."""
    if not teks:
        return ""
    
    teks = teks.lower()
    teks = re.sub(r'<[^>]+>', '', teks)
    teks = re.sub(r'[^a-z0-9\s\.\-]', ' ', teks)
    
    kata_kata = teks.split()
    kata_terfilter = [PETA_TYPO.get(k, k) for k in kata_kata]
    
    hasil = " ".join(kata_terfilter)
    return hasil.strip()

def normalize_text(text):
    return normalisasi_teks(text)
