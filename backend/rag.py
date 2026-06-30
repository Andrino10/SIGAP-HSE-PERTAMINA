from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import os
from sklearn.metrics.pairwise import cosine_similarity

print("Loading models...")

# =========================
# 1. Load Embedding Model
# =========================
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# =========================
# 2. Load Knowledge Base
# =========================
docs = []
structured_data = []

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

KNOWLEDGE_PATH = os.path.join(
    BASE_DIR,
    "knowledge.txt"
)

with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()

        if not line:
            continue

        docs.append(line)

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

index.add(
    np.array(doc_embeddings)
)

print("Sistem siap!\n")

# =========================
# 4. Analisis Risiko
# =========================
def analisis_risiko(query, retrieved_indexes):

    hasil_temuan = []
    risiko_tertinggi = "RENDAH"

    for idx in retrieved_indexes:

        data = structured_data[idx]

        hasil_temuan.append(data)

        if data["risiko"] == "TINGGI":
            risiko_tertinggi = "TINGGI"

        elif (
            data["risiko"] == "SEDANG"
            and risiko_tertinggi != "TINGGI"
        ):
            risiko_tertinggi = "SEDANG"

    return risiko_tertinggi, hasil_temuan

# =========================
# 5. RAG SYSTEM
# =========================
def rag_system(query):

    query_vec = embed_model.encode([query])

    # Ambil knowledge paling relevan
    D, I = index.search(
        np.array(query_vec),
        k=1
    )

    retrieved_indexes = I[0]

    level, temuan = analisis_risiko(
        query,
        retrieved_indexes
    )

    # Knowledge terbaik hasil retrieval
    best_doc = docs[retrieved_indexes[0]]

    # Embedding knowledge
    doc_vec = embed_model.encode([best_doc])

    # Similarity query ↔ knowledge
    similarity_score = cosine_similarity(
        query_vec,
        doc_vec
    )[0][0]

    return (
        level,
        temuan,
        float(similarity_score)
    )

# =========================
# 6. RAG FOR EVALUATION
# =========================
def rag_for_eval(query):

    query_vec = embed_model.encode([query])

    # Ambil 3 knowledge terbaik
    D, I = index.search(
        np.array(query_vec),
        k=3
    )

    retrieved_indexes = I[0]

    level, temuan = analisis_risiko(
        query,
        retrieved_indexes
    )

    retrieved_docs = [
        docs[i]
        for i in retrieved_indexes
    ]

    # DEBUG RETRIEVAL
    print("\n" + "=" * 60)
    print("QUERY:")
    print(query)

    print("\nRETRIEVED DOCS:")
    for doc in retrieved_docs:
        print("-", doc)

    print("=" * 60)

    answer = f"Level Risiko: {level}. "

    for t in temuan:

        answer += (
            f"Kondisi: {t['kondisi']}. "
            f"Risiko: {t['risiko']}. "
            f"Penjelasan: {t['penjelasan']}. "
            f"Solusi: {t['solusi']}. "
        )

    return {
        "question": query,
        "answer": answer,
        "contexts": retrieved_docs
    }

# =========================
# 7. TEST MANUAL
# =========================
if __name__ == "__main__":

    while True:

        query = input(
            "Masukkan laporan kerja (ketik 'exit' untuk keluar): "
        )

        if query.lower() == "exit":
            print("Program selesai.")
            break

        level, temuan = rag_system(query)

        print("\n" + "=" * 60)
        print("HASIL ANALISIS RISIKO")
        print("=" * 60)

        print(f"\nLevel Risiko : {level}")

        for i, t in enumerate(temuan, start=1):

            print(f"\nTemuan {i}")
            print(f"Kondisi    : {t['kondisi']}")
            print(f"Risiko     : {t['risiko']}")
            print(f"Penjelasan : {t['penjelasan']}")
            print(f"Solusi     : {t['solusi']}")

        print("\n" + "=" * 60)
        