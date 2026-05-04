from flask import Flask, request, jsonify
from flask_cors import CORS

from rag import rag_system

app = Flask(__name__)
CORS(app)

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json
    laporan = data.get("laporan", "")

    if not laporan:
        return jsonify({"error": "Laporan kosong"}), 400

    level, temuan = rag_system(laporan)

    # Ambil isi detail
    hasil_temuan = []
    rekomendasi = []
    penyebab = []

    for t in temuan:
        hasil_temuan.append(t["kondisi"])
        penyebab.append(t["penjelasan"])
        rekomendasi.append(t["solusi"])

    return jsonify({
        "level": level,
        "temuan": hasil_temuan,
        "penyebab": " ".join(penyebab),
        "rekomendasi": rekomendasi,
        "referensi": "Knowledge SIGAP AI"
    })

if __name__ == "__main__":
    app.run(debug=True)