import os
import sys
import pandas as pd

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ==========================
# Path Setup
# ==========================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(
    os.path.join(CURRENT_DIR, "..")
)

sys.path.append(BACKEND_DIR)

from rag import rag_for_eval

# ==========================
# Load Model
# ==========================
print("Loading all-MiniLM-L6-v2...")

embed_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

# ==========================
# Load Dataset
# ==========================
df = pd.read_csv(
    os.path.join(
        CURRENT_DIR,
        "test_dataset.csv"
    )
)

results = []

# ==========================
# Evaluation Loop
# ==========================
for idx, row in df.iterrows():

    question = row["question"]

    ground_truth = (
        f"Risiko: {row['expected_level']}. "
        f"Bahaya: {row['expected_hazard']}. "
        f"Solusi: {row['expected_solution']}."
    )

    result = rag_for_eval(question)

    answer = result["answer"]

    gt_vec = embed_model.encode(
        ground_truth
    )

    ans_vec = embed_model.encode(
        answer
    )

    similarity = cosine_similarity(
        [gt_vec],
        [ans_vec]
    )[0][0]

    results.append({
        "question": question,
        "similarity": round(float(similarity), 4)
    })

# ==========================
# Save Result
# ==========================
result_df = pd.DataFrame(results)

result_df.to_csv(
    "hasil_similarity.csv",
    index=False
)

# ==========================
# Statistics
# ==========================
avg_score = result_df["similarity"].mean()
max_score = result_df["similarity"].max()
min_score = result_df["similarity"].min()

print("\n===== HASIL EVALUASI =====")

print(
    f"Average Similarity : {avg_score:.4f}"
)

print(
    f"Maximum Similarity : {max_score:.4f}"
)

print(
    f"Minimum Similarity : {min_score:.4f}"
)

print(
    "\nHasil disimpan ke: hasil_similarity.csv"
)