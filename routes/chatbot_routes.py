from flask import Blueprint, request
from controllers.chatbot_controller import chatbot_controller

chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/chatbot")

@chatbot_bp.route("/message", methods=["POST"])
def message():
    data = request.json or {}
    return chatbot_controller.handle_message(data)

@chatbot_bp.route("/resolve", methods=["POST"])
def resolve():
    data = request.json or {}
    return chatbot_controller.resolve_issue(data)

@chatbot_bp.route("/reset", methods=["POST"])
def reset():
    data = request.json or {}
    return chatbot_controller.reset_chat(data)

@chatbot_bp.route("/starters", methods=["GET"])
def starters():
    return chatbot_controller.get_starter_questions()
