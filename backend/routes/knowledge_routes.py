from flask import Blueprint
from controllers.knowledge_controller import knowledge_controller

knowledge_bp = Blueprint("knowledge", __name__, url_prefix="/api/knowledge")

@knowledge_bp.route("", methods=["GET"])
def get_knowledge():
    return knowledge_controller.get_all()

@knowledge_bp.route("/categories", methods=["GET"])
def get_categories():
    return knowledge_controller.get_categories()

@knowledge_bp.route("/metadata", methods=["GET"])
def get_metadata():
    return knowledge_controller.get_metadata()

@knowledge_bp.route("/technicians", methods=["GET"])
def get_technicians():
    return knowledge_controller.get_technicians()

@knowledge_bp.route("/<string:kb_id>", methods=["GET"])
def get_knowledge_by_id(kb_id):
    return knowledge_controller.get_by_id(kb_id)
