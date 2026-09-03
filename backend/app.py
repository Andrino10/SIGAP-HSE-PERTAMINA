import sys
import os
from pathlib import Path

# Reconfigure stdout for Windows unicode support
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass

from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS

from config.settings import SYSTEM_NAME, CATEGORIES
from routes.chatbot_routes import chatbot_bp
from routes.complaint_routes import complaint_bp
from routes.consultation_routes import consultation_bp
from routes.knowledge_routes import knowledge_bp
from routes.admin_routes import admin_bp
from utils.response_formatter import error_response, success_response
from utils.logger import logger
from services.retrieval_service import retrieval_service
from services.ai_service import ai_service
from services.escalation_service import escalation_service

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(chatbot_bp)
app.register_blueprint(complaint_bp)
app.register_blueprint(consultation_bp)
app.register_blueprint(knowledge_bp)
app.register_blueprint(admin_bp)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"


def get_static_dir():
    return DIST_DIR if (DIST_DIR / "index.html").exists() else FRONTEND_DIR


@app.after_request
def add_cache_headers(response):
    """Mencegah browser menyimpan cache file frontend selama sesi pengembangan/live."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/", methods=["GET"])
def frontend_index():
    """Menyajikan SPA dari origin yang sama di lokal dan Vercel."""
    target_dir = get_static_dir()
    return send_from_directory(target_dir, "index.html")


@app.route("/admin", methods=["GET"])
@app.route("/admin/", methods=["GET"])
@app.route("/admin/<path:subpath>", methods=["GET"])
def frontend_admin(subpath=""):
    """Menyajikan SPA Admin Portal dari origin yang sama."""
    target_dir = get_static_dir()
    if (target_dir / "index.html").exists():
        return send_from_directory(target_dir, "index.html")
    return send_from_directory(FRONTEND_DIR, "admin.html")


@app.route("/<path:asset_path>", methods=["GET"])
def frontend_asset(asset_path):
    """Fallback aset frontend; rute /api yang spesifik tetap diprioritaskan Flask."""
    if asset_path.startswith("api/"):
        abort(404)
    target_dir = get_static_dir()
    if (target_dir / asset_path).exists():
        return send_from_directory(target_dir, asset_path)
    if (FRONTEND_DIR / asset_path).exists():
        return send_from_directory(FRONTEND_DIR, asset_path)
    return send_from_directory(target_dir, "index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    return success_response(
        data={"service": "sigap-ai-hsse", "status": "ready"},
        message="Layanan SIGAP-AI HSSE siap digunakan.",
    )

# Legacy compatibility route (/api/analyze)
@app.route("/api/analyze", methods=["POST"])
def analyze_legacy():
    data = request.json or {}
    laporan = data.get("laporan", "").strip()

    if not laporan:
        return error_response(message="Laporan tidak boleh kosong.", errors=[{"field": "laporan", "message": "Field laporan wajib diisi."}], code=400)

    try:
        retrieval_res = retrieval_service.retrieve(laporan, top_k=3)
        top_entry = retrieval_res["top_entry"]
        confidence = retrieval_res["confidence"]
        relevance_level = retrieval_res["relevance_level"]

        context = {
            "category": (
                top_entry.get("kategori") or top_entry.get("category")
                if top_entry else "Umum"
            ),
            "symptoms": [laporan],
        }
        escalation_res = escalation_service.check_escalation(laporan, context, kb_entry=top_entry)
        analysis_text = ai_service.generate_response(
            laporan,
            top_entry,
            relevance_level,
            context,
            escalation_res,
            hasil_pencarian=retrieval_res,
        )

        # Determine risk level from KB entry or escalation detection
        if escalation_res and escalation_res.get("needs_escalation"):
            level = "TINGGI"
        elif top_entry:
            level = (top_entry.get("tingkat_risiko") or top_entry.get("risk_level", "sedang")).upper()
        else:
            level = "RENDAH"

        kondisi = (top_entry.get("judul") or top_entry.get("title", laporan)) if top_entry else laporan
        risiko = (top_entry.get("penjelasan_risiko") or top_entry.get("risk_explanation", "Risiko dalam pemeriksaan.")) if top_entry else "Risiko dalam pemeriksaan."
        solusi = (top_entry.get("solusi") or top_entry.get("solution", "Lakukan evaluasi langsung di lapangan.")) if top_entry else "Lakukan evaluasi langsung di lapangan."

        return jsonify({
            "status": "success",
            "level": level,
            "kondisi": kondisi,
            "risiko": risiko,
            "solusi": solusi,
            "analysis_markdown": analysis_text,
            "referensi": (top_entry.get("judul") or top_entry.get("title", f"Knowledge {SYSTEM_NAME}")) if top_entry else f"Knowledge Base {SYSTEM_NAME}",
            "referensi_regulasi": top_entry.get("referensi", []) if top_entry else [],
            "kb_id": top_entry.get("id") if top_entry else None,
            "knowledge_source": "knowledge.json",
            "similarity": confidence
        })
    except Exception as e:
        logger.error(f"Error processing /api/analyze: {e}", exc_info=True)
        return error_response(message="Terjadi kesalahan internal saat memproses analisis.", code=500)

# Centralized Error Handlers
@app.errorhandler(400)
def bad_request_handler(e):
    return error_response(message="Permintaan tidak valid (Bad Request).", code=400)

@app.errorhandler(404)
def not_found_handler(e):
    return error_response(message="Endpoint atau sumber daya tidak ditemukan (404).", code=404)

@app.errorhandler(422)
def unprocessable_handler(e):
    return error_response(message="Data yang dikirim tidak dapat diproses (422).", code=422)

@app.errorhandler(500)
def server_error_handler(e):
    return error_response(message="Terjadi kesalahan internal pada server (500).", code=500)

if __name__ == "__main__":
    logger.info(f"Starting {SYSTEM_NAME} Backend Service on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
