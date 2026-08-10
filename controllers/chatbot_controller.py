import uuid
from validators.request_validator import validate_chat_request, validate_resolution_request
from utils.response_formatter import success_response, error_response
from utils.whatsapp_formatter import susun_pesan_whatsapp
from config.settings import DAFTAR_PETUGAS_HSE, dapatkan_petugas_per_kategori
from services.cache_service import cache_service
from services.context_service import layanan_konteks
from services.retrieval_service import retrieval_service
from services.escalation_service import layanan_eskalasi
from services.ai_service import layanan_ai
from repositories.conversation_repository import conversation_repo
from repositories.knowledge_repository import knowledge_repo
from utils.text_normalizer import normalisasi_teks


def _daftar_kategori_payload(data):
    raw_categories = (
        data.get("categories")
        or data.get("kategori_list")
        or data.get("category")
        or data.get("kategori")
        or []
    )
    if isinstance(raw_categories, str):
        raw_categories = [raw_categories]
    if not isinstance(raw_categories, list):
        return []
    categories = []
    for item in raw_categories:
        category = item.strip() if isinstance(item, str) else ""
        if category and category not in categories:
            categories.append(category)
    return categories


class PengontrolChatbot:
    def tangani_pesan(self, data):
        kesalahan = validate_chat_request(data)
        if kesalahan:
            return error_response(message="Validasi gagal.", errors=kesalahan, code=400)

        id_sesi = data.get("session_id") or data.get("id_sesi") or f"SESS-{uuid.uuid4().hex[:8].upper()}"
        pesan_pengguna = data.get("message", "").strip()
        kategori_eksplisit = _daftar_kategori_payload(data)

        conversation_repo.add_message(id_sesi, "user", pesan_pengguna)

        # 1. Pemrosesan Konteks
        hasil_konteks = layanan_konteks.proses_pesan_pengguna(id_sesi, pesan_pengguna, kategori_eksplisit=kategori_eksplisit)
        konteks = hasil_konteks["context"]
        pertanyaan_terenkaya = hasil_konteks.get("enriched_query", pesan_pengguna)

        # Cache terikat pada versi knowledge.json. Ketika file dilengkapi, jawaban
        # lama otomatis tidak digunakan lagi.
        knowledge_metadata = knowledge_repo.get_metadata()
        knowledge_version = (
            f"{knowledge_metadata.get('loaded_at')}:"
            f"{knowledge_metadata.get('valid')}"
        )
        muatan_tercache = cache_service.get(
            pertanyaan_terenkaya,
            konteks.get("categories")
            or konteks.get("kategori_list")
            or konteks.get("category")
            or konteks.get("kategori"),
            version=knowledge_version,
        )
        if muatan_tercache and not hasil_konteks["needs_clarification"]:
            muatan_tercache["session_id"] = id_sesi
            conversation_repo.add_message(id_sesi, "assistant", muatan_tercache["response"], meta={"cached": True})
            return success_response(data=muatan_tercache, message="Analisis HSE berhasil (Cache HIT).")

        # Cek Klarifikasi
        if hasil_konteks["needs_clarification"]:
            pesan_klarifikasi = hasil_konteks["clarification_prompt"]
            conversation_repo.add_message(id_sesi, "system", pesan_klarifikasi)
            return success_response(
                data={
                    "session_id": id_sesi,
                    "response": pesan_klarifikasi,
                    "status": "membutuhkan_informasi_tambahan",
                    "needs_clarification": True,
                    "context": konteks
                },
                message="Informasi tambahan diperlukan."
            )

        # 2. Hybrid Retrieval
        sumber_kategori = konteks.get("category_source")
        petunjuk_kategori = (
            konteks.get("categories")
            or konteks.get("kategori_list")
            or konteks.get("category")
            or konteks.get("kategori")
            if sumber_kategori in {"explicit", "knowledge_match"}
            else None
        )
        id_kb_aktif = konteks.get("kb_id")
        hasil_pencarian = retrieval_service.retrieve(
            query_text=pertanyaan_terenkaya,
            category_hint=petunjuk_kategori,
            active_kb_id=id_kb_aktif,
            top_k=3
        )
        entri_teratas = hasil_pencarian["top_entry"]
        tingkat_relevansi = hasil_pencarian["relevance_level"]
        kepercayaan = hasil_pencarian["confidence"]

        if entri_teratas:
            konteks["kb_id"] = entri_teratas.get("id")
            konteks["assigned_category"] = (
                entri_teratas.get("kategori") or entri_teratas.get("category")
            )
            if sumber_kategori != "explicit":
                kategori_hasil = entri_teratas.get("kategori") or entri_teratas.get("category")
                konteks["categories"] = [kategori_hasil]
                konteks["kategori_list"] = [kategori_hasil]
                konteks["category"] = kategori_hasil
                konteks["kategori"] = kategori_hasil
                konteks["category_source"] = "knowledge_match"
            conversation_repo.update_context(id_sesi, konteks)
        elif petunjuk_kategori:
            konteks["assigned_category"] = (
                petunjuk_kategori[0]
                if isinstance(petunjuk_kategori, list)
                else petunjuk_kategori
            )
            conversation_repo.update_context(id_sesi, konteks)

        # 3. Cek Pemicu Eskalasi
        pesan_normal = normalisasi_teks(pesan_pengguna)
        pesan_berbatas = f" {pesan_normal} "
        langkah_gagal = any(
            f" {kata} " in pesan_berbatas for kata in ["gagal", "tetap"]
        )
        permintaan_langsung = any(
            f" {normalisasi_teks(frasa)} " in pesan_berbatas
            for frasa in ["eskalasi", "hubungi safety", "butuh hse", "safety officer", "darurat"]
        )
        hasil_eskalasi = layanan_eskalasi.periksa_eskalasi(
            pesan_pengguna, konteks, entri_kb=entri_teratas, tingkat_relevansi=tingkat_relevansi, langkah_gagal=langkah_gagal, permintaan_langsung=permintaan_langsung
        )

        # 4. Hasilkan Jawaban Analisis HSE
        jawaban_ai = layanan_ai.buat_jawaban(
            pesan_pengguna, entri_teratas, tingkat_relevansi, konteks, hasil_eskalasi, hasil_pencarian=hasil_pencarian
        )

        conversation_repo.add_message(
            id_sesi, "assistant", jawaban_ai,
            meta={"confidence": kepercayaan, "kb_id": entri_teratas.get("id") if entri_teratas else None}
        )

        teks_wa_mentah, tautan_wa, petugas_ditunjuk = susun_pesan_whatsapp(konteks)

        kategori_terpilih = (
            konteks.get("categories")
            or konteks.get("kategori_list")
            or _daftar_kategori_payload(konteks)
            or ["Umum"]
        )
        kategori_utama = kategori_terpilih[0]

        muatan_data = {
            "session_id": id_sesi,
            "response": jawaban_ai,
            "category": kategori_utama,
            "kategori": kategori_utama,
            "categories": kategori_terpilih,
            "kategori_list": kategori_terpilih,
            "confidence": kepercayaan,
            "relevance_level": tingkat_relevansi,
            "kb_reference": {
                "id": entri_teratas.get("id"),
                "judul": entri_teratas.get("judul") or entri_teratas.get("title"),
                "kategori": entri_teratas.get("kategori") or entri_teratas.get("category"),
                "referensi": entri_teratas.get("referensi", []),
            } if entri_teratas else None,
            "kb_references": [
                {
                    "id": match["entry"]["id"],
                    "judul": match["entry"]["judul"],
                    "kategori": match["entry"]["kategori"],
                    "tingkat_risiko": match["entry"]["tingkat_risiko"],
                    "confidence": match["hybrid_score"],
                    "matched_terms": match.get("matched_terms", []),
                    "referensi": match["entry"].get("referensi", []),
                }
                for match in hasil_pencarian.get("all_matches", [])
            ],
            "knowledge_source": knowledge_metadata.get("source", "knowledge.json"),
            "knowledge_valid": knowledge_metadata.get("valid", False),
            "needs_escalation": hasil_eskalasi["needs_escalation"],
            "escalation_data": hasil_eskalasi["escalation_data"],
            "assigned_technician": petugas_ditunjuk,
            "technician_roster": list(DAFTAR_PETUGAS_HSE.values()),
            "whatsapp_url": tautan_wa,
            "whatsapp_message": teks_wa_mentah,
            "context": konteks
        }

        cache_service.set(
            pertanyaan_terenkaya,
            kategori_terpilih,
            muatan_data,
            version=knowledge_version,
        )

        return success_response(data=muatan_data, message="Analisis HSE berhasil.")

    def selesaikan_masalah(self, data):
        kesalahan = validate_resolution_request(data)
        if kesalahan:
            return error_response(
                message="Data penyelesaian atau eskalasi tidak valid.",
                errors=kesalahan,
                code=400,
            )
        id_sesi = data.get("session_id") or data.get("id_sesi")
        terselesaikan = data.get("resolved", True)
        umpan_balik = data.get("feedback", "")
        nomor_petugas_pilihan = data.get("selected_tech_number") or data.get("nomor_petugas_pilihan")

        sesi = conversation_repo.get_session(id_sesi) if id_sesi else {}
        konteks = sesi.get("context", {})

        for f in ["reporter_name", "division", "location", "device", "description", "urgency", "ticket_number", "nama_pelapor", "divisi", "lokasi", "deskripsi", "urgensi"]:
            if data.get(f):
                konteks[f] = data.get(f)

        if any(
            field in data
            for field in ("categories", "kategori_list", "category", "kategori")
        ):
            kategori_terpilih = _daftar_kategori_payload(data)
            if kategori_terpilih:
                konteks["categories"] = kategori_terpilih
                konteks["kategori_list"] = kategori_terpilih
                konteks["category"] = kategori_terpilih[0]
                konteks["kategori"] = kategori_terpilih[0]
                konteks["category_source"] = "explicit"

        if terselesaikan:
            konteks["status"] = "selesai"
            if id_sesi:
                conversation_repo.update_context(id_sesi, konteks)

            return success_response(
                data={"session_id": id_sesi, "status": "selesai"},
                message="Kondisi bahaya telah ditangani. Terima kasih telah menggunakan SIGAP-AI HSE Companion."
            )
        else:
            konteks["status"] = "perlu_bantuan_hse"
            if id_sesi:
                conversation_repo.update_context(id_sesi, konteks)

            teks_wa_mentah, tautan_wa, petugas_ditunjuk = susun_pesan_whatsapp(
                konteks, umpan_balik=umpan_balik, nomor_petugas_pilihan=nomor_petugas_pilihan
            )

            return success_response(
                data={
                    "session_id": id_sesi,
                    "status": "perlu_bantuan_hse",
                    "can_contact_hse": True,
                    "assigned_technician": petugas_ditunjuk,
                    "technician_roster": list(DAFTAR_PETUGAS_HSE.values()),
                    "whatsapp_url": tautan_wa,
                    "whatsapp_message": teks_wa_mentah,
                    "context": konteks
                },
                message="Kondisi memerlukan penanganan langsung oleh Tim HSE."
            )

    def reset_percakapan(self, data):
        id_sesi = data.get("session_id") or data.get("id_sesi") if isinstance(data, dict) else None
        if not id_sesi:
            id_sesi = f"SESS-{uuid.uuid4().hex[:8].upper()}"

        conversation_repo.clear_session(id_sesi)
        return success_response(
            data={"session_id": id_sesi},
            message="Riwayat percakapan berhasil dibersihkan."
        )

    def ambil_pertanyaan_awal(self):
        per_kategori = {}
        for entry in knowledge_repo.get_all():
            kategori = entry["kategori"]
            per_kategori.setdefault(kategori, [])
            if len(per_kategori[kategori]) < 3:
                per_kategori[kategori].append(
                    {
                        "kategori": kategori,
                        "pertanyaan": entry["judul"],
                        "judul": entry["judul"],
                        "kb_id": entry["id"],
                        "tingkat_risiko": entry["tingkat_risiko"],
                    }
                )

        starters = [
            starter
            for kategori in sorted(per_kategori, key=str.casefold)
            for starter in per_kategori[kategori]
        ]
        return success_response(
            data={
                "starters": starters,
                "by_category": per_kategori,
                "total_categories": len(per_kategori),
            },
            message="Contoh laporan seluruh kategori berhasil dibentuk dari knowledge.json.",
        )

    def handle_message(self, data):
        return self.tangani_pesan(data)

    def resolve_issue(self, data):
        return self.selesaikan_masalah(data)

    def reset_chat(self, data):
        return self.reset_percakapan(data)

    def get_starter_questions(self):
        return self.ambil_pertanyaan_awal()

pengontrol_chatbot = PengontrolChatbot()
chatbot_controller = pengontrol_chatbot
