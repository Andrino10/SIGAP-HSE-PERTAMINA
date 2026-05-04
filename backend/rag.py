from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

print("Loading models...")

# =========================
# 1. Load Embedding Model
# =========================
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# =========================
# 2. Load Knowledge Base
# =========================
docs = []
structured_data = []

with open("knowledge.txt", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            docs.append(line)

            # Split struktur
            parts = line.split("|")
            if len(parts) == 4:
                kondisi = parts[0].strip()
                risiko = parts[1].strip()
                penjelasan = parts[2].strip()
                solusi = parts[3].strip()

                structured_data.append({
                    "kondisi": kondisi,
                    "risiko": risiko,
                    "penjelasan": penjelasan,
                    "solusi": solusi
                })

# =========================
# 3. Embedding Knowledge
# =========================
doc_embeddings = embed_model.encode(docs)

dimension = doc_embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(doc_embeddings))

print("Sistem siap!\n")


# =========================
# 4. Analisis Risiko (Hybrid)
# =========================
def analisis_risiko(query, retrieved_indexes):
    teks = query.lower()

    hasil_temuan = []
    risiko_tertinggi = "RENDAH"

    for idx in retrieved_indexes:
        data = structured_data[idx]
        hasil_temuan.append(data)

        # Tentukan level tertinggi
        if data["risiko"] == "TINGGI":
            risiko_tertinggi = "TINGGI"
        elif data["risiko"] == "SEDANG" and risiko_tertinggi != "TINGGI":
            risiko_tertinggi = "SEDANG"

    return risiko_tertinggi, hasil_temuan


# =========================
# 5. RAG SYSTEM
# =========================
def rag_system(query):
    query_vec = embed_model.encode([query])

    # Ambil 2 referensi terbaik
    D, I = index.search(np.array(query_vec), k=2)

    retrieved_indexes = I[0]

    level, temuan = analisis_risiko(query, retrieved_indexes)

    return level, temuan
