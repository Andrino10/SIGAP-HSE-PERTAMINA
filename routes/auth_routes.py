from flask import Blueprint
from utils.response_formatter import success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/profile", methods=["GET"])
def get_profile():
    profile_data = {
        "user_id": "USR-88219",
        "name": "Andrino Syaddani",
        "role": "IT & K3 Staff",
        "unit": "Pertamina EP — Asset 2 Lirik Field",
        "email": "andrino@pertamina.com",
        "status": "Active"
    }
    return success_response(data=profile_data, message="Profil pengguna berhasil dimuat.")
