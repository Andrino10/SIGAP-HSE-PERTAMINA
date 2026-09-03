from repositories.knowledge_repository import knowledge_repo
from config.settings import DAFTAR_PETUGAS_HSSE
from utils.response_formatter import error_response, success_response

class PengontrolKnowledge:
    def ambil_semua(self):
        entri = knowledge_repo.get_all()
        metadata = knowledge_repo.get_metadata()
        return success_response(
            data={
                "knowledge_base": entri,
                "total": len(entri),
                "metadata": metadata,
            },
            message="Knowledge Base HSSE berhasil diambil dari knowledge.json.",
            meta={
                "knowledge_source": metadata["source"],
                "knowledge_valid": metadata["valid"],
            },
        )

    def ambil_kategori(self):
        category_details = knowledge_repo.get_categories()
        category_names = [item["nama"] for item in category_details]
        return success_response(
            data={
                "categories": category_names,
                "kategori": category_names,
                "details": category_details,
                "total": len(category_names),
            },
            message="Daftar kategori HSSE berhasil dibentuk dari knowledge.json.",
        )

    def ambil_metadata(self):
        return success_response(
            data=knowledge_repo.get_metadata(),
            message="Status dan metadata Knowledge Base berhasil diambil.",
        )

    def ambil_berdasarkan_id(self, kb_id):
        entry = knowledge_repo.get_by_id(kb_id)
        if not entry:
            return error_response(
                message=f"Artikel Knowledge Base dengan ID '{kb_id}' tidak ditemukan.",
                code=404,
            )
        return success_response(
            data={"knowledge": entry},
            message="Artikel Knowledge Base berhasil diambil.",
        )

    def ambil_petugas(self):
        return success_response(data={"technicians": list(DAFTAR_PETUGAS_HSSE.values()), "petugas": list(DAFTAR_PETUGAS_HSSE.values())}, message="Daftar roster Tim HSSE berhasil diambil.")

    def get_all(self):
        return self.ambil_semua()

    def get_categories(self):
        return self.ambil_kategori()

    def get_metadata(self):
        return self.ambil_metadata()

    def get_by_id(self, kb_id):
        return self.ambil_berdasarkan_id(kb_id)

    def get_technicians(self):
        return self.ambil_petugas()

pengontrol_knowledge = PengontrolKnowledge()
knowledge_controller = pengontrol_knowledge
