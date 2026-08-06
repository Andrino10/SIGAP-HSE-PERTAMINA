import uuid
from flask import jsonify

def success_response(data=None, message="Permintaan berhasil diproses.", code=200, meta=None):
    request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    response_meta = {"request_id": request_id}
    if meta:
        response_meta.update(meta)

    payload = {
        "success": True,
        "message": message,
        "data": data or {},
        "meta": response_meta
    }
    return jsonify(payload), code

def error_response(message="Terjadi kesalahan.", errors=None, code=400, meta=None):
    request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    response_meta = {"request_id": request_id}
    if meta:
        response_meta.update(meta)

    payload = {
        "success": False,
        "message": message,
        "errors": errors or [],
        "meta": response_meta
    }
    return jsonify(payload), code
