from flask import Blueprint, request
from controllers.complaint_controller import complaint_controller

complaint_bp = Blueprint("complaint", __name__, url_prefix="/api/complaints")

@complaint_bp.route("", methods=["POST"])
def create_complaint():
    data = request.json or {}
    return complaint_controller.create(data)

@complaint_bp.route("", methods=["GET"])
def list_complaints():
    return complaint_controller.get_all()

@complaint_bp.route("/<ticket_no>", methods=["GET"])
def get_complaint(ticket_no):
    return complaint_controller.get_by_ticket(ticket_no)
