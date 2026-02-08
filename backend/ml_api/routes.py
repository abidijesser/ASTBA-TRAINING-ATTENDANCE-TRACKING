from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from .services.certification_predictor import (
    FEATURE_NAMES,
    artifacts_status,
    predict_certification,
    validate_payload,
)


api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.get("/health")
def health_check():
    return jsonify({"status": "ok", "ml": artifacts_status(current_app.config["APP_CONFIG"])})


@api_bp.get("/ml/schema")
def ml_schema():
    cfg = current_app.config["APP_CONFIG"]
    return jsonify(
        {
            "model": {
                "type": "logistic_regression",
                "threshold": cfg.threshold,
            },
            "features": FEATURE_NAMES,
            "target": "certified",
        }
    )


@api_bp.post("/ml/predict-certification")
def ml_predict_certification():
    payload = request.get_json(silent=True)
    if payload is None:
        return (
            jsonify(
                {
                    "error": {
                        "type": "bad_request",
                        "message": "Request body must be valid JSON",
                        "status": 400,
                    }
                }
            ),
            400,
        )

    cfg = current_app.config["APP_CONFIG"]
    validation_error = validate_payload(payload)
    if validation_error is not None:
        return (
            jsonify(
                {
                    "error": {
                        "type": "validation_error",
                        "message": validation_error,
                        "status": 400,
                    }
                }
            ),
            400,
        )

    result = predict_certification(payload, cfg)
    return jsonify(result)
