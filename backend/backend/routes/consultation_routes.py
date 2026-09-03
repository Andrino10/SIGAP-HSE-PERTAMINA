from flask import Blueprint, request
from controllers.consultation_controller import consultation_controller

consultation_bp = Blueprint("consultation", __name__, url_prefix="/api/consultations")

@consultation_bp.route("", methods=["POST"])
def start_consultation():
    data = request.json or {}
    return consultation_controller.create_consultation(data)
