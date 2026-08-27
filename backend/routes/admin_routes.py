from flask import Blueprint, request
from controllers.admin_controller import admin_controller

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    return admin_controller.login(data)

@admin_bp.route("/logout", methods=["POST"])
def logout():
    return admin_controller.logout()

@admin_bp.route("/me", methods=["GET"])
def get_current_user():
    return admin_controller.get_current_user()

@admin_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    return admin_controller.get_dashboard()

@admin_bp.route("/reports", methods=["GET"])
def get_reports():
    return admin_controller.get_reports()

@admin_bp.route("/reports/<ticket_no>", methods=["GET"])
def get_report_detail(ticket_no):
    return admin_controller.get_report_detail(ticket_no)

@admin_bp.route("/reports/<ticket_no>", methods=["PATCH", "PUT"])
def update_report(ticket_no):
    data = request.json or {}
    return admin_controller.update_report(ticket_no, data)

@admin_bp.route("/recap", methods=["GET"])
def get_recap():
    return admin_controller.get_recap()
