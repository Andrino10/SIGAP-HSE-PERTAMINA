import os
import sys
import pandas as pd
from datasets import Dataset

# ==================================================
# PATH SETUP
# ==================================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

sys.path.append(BACKEND_DIR)

# ==================================================
# IMPORT RAG
# ==================================================
from rag import rag_for_eval

# ==================================================
# LOAD TEST DATASET
# ==================================================
CSV_PATH = os.path.join(CURRENT_DIR, "test_dataset.csv")

df = pd.read_csv(CSV_PATH)

required_columns = [
    "question",
    "expected_level",
    "expected_hazard",
    "expected_solution"
]

for col in required_columns:
    if col not in df.columns:
        raise ValueError(
            f"Kolom '{col}' tidak ditemukan pada test_dataset.csv"
        )

# ==================================================
# BUILD EVALUATION DATASET
# ==================================================
questions = []
answers = []
contexts = []
ground_truths = []

print("\nMembangun dataset evaluasi...\n")

for idx, row in df.iterrows():

    question = str(row["question"])

    ground_truth = (
        f"Risiko: {row['expected_level']}. "
        f"Bahaya: {row['expected_hazard']}. "
        f"Solusi: {row['expected_solution']}."
    )

    result = rag_for_eval(question)

    questions.append(question)
    answers.append(result["answer"])
    contexts.append(result["contexts"])
    ground_truths.append(ground_truth)

# ==================================================
# HUGGINGFACE DATASET
# ==================================================
evaluation_dataset = Dataset.from_dict({
    "question": questions,
    "answer": answers,
    "contexts": contexts,
    "ground_truth": ground_truths
})

# ==================================================
# DISPLAY INFO
# ==================================================
print("=" * 60)
print("DATASET EVALUASI BERHASIL DIBUAT")
print("=" * 60)

print(evaluation_dataset)

print("\nJumlah Data:")
print(len(evaluation_dataset))

print("\nContoh Data Pertama:")
print("-" * 60)

sample = evaluation_dataset[0]

print("Question :")
print(sample["question"])

print("\nAnswer :")
print(sample["answer"])

print("\nContexts :")
for c in sample["contexts"]:
    print("-", c)

print("\nGround Truth :")
print(sample["ground_truth"])

print("-" * 60)

# ==================================================
# EXPORT UNTUK RAGAS
# ==================================================