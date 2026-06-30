from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)

from ragas_eval import evaluation_dataset

print("\nMemulai Evaluasi RAGAS...\n")

result = evaluate(
    evaluation_dataset,
    metrics=[
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
    ]
)

print("\nHASIL EVALUASI RAGAS")
print("=" * 50)
print(result)

# Simpan hasil
result.to_pandas().to_csv(
    "hasil_ragas.csv",
    index=False
)

print("\nHasil evaluasi berhasil disimpan ke:")
print("hasil_ragas.csv")