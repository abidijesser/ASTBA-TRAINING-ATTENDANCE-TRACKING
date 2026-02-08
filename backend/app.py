from __future__ import annotations

import math
import os
import threading
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS


FEATURE_NAMES = [
    "attendance_rate",
    "missed_sessions",
    "levels_completed",
    "avg_quiz_score",
    "engagement_score",
]

_model_lock = threading.Lock()
_model = None
_scaler = None


def _parse_list(value: str | None, default: list[str]) -> list[str]:
    if value is None or value.strip() == "":
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _normalize_attendance_rate(value: float, mode: str) -> float:
    mode = (mode or "auto").strip().lower()
    if mode == "fraction":
        return value
    if mode == "percent":
        return value / 100.0

    # auto: treat values like 92 as 92% -> 0.92
    if 1.5 < value <= 100.0:
        return value / 100.0
    return value


def _ensure_artifacts_loaded(model_path: Path, scaler_path: Path):
    global _model, _scaler

    if _model is not None and _scaler is not None:
        return _model, _scaler

    with _model_lock:
        if _model is not None and _scaler is not None:
            return _model, _scaler

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        if not scaler_path.exists():
            raise FileNotFoundError(f"Scaler not found: {scaler_path}")

        _model = joblib.load(model_path)
        _scaler = joblib.load(scaler_path)
        return _model, _scaler


def _validate_payload(payload: Any) -> str | None:
    if not isinstance(payload, dict):
        return "JSON payload must be an object"

    missing = [name for name in FEATURE_NAMES if name not in payload]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"

    for name in FEATURE_NAMES:
        value = payload.get(name)
        if value is None:
            return f"Field '{name}' cannot be null"
        if isinstance(value, bool):
            return f"Field '{name}' must be a number"
        try:
            float(value)
        except Exception:
            return f"Field '{name}' must be a number"

    return None


def create_app() -> Flask:
    app = Flask(__name__)

    backend_dir = Path(__file__).resolve().parent
    model_path = Path(os.getenv("ML_MODEL_PATH", str(backend_dir / "certification_model.pkl")))
    scaler_path = Path(os.getenv("ML_SCALER_PATH", str(backend_dir / "scaler.pkl")))
    attendance_rate_mode = os.getenv("ML_ATTENDANCE_RATE_MODE", "auto")

    cors_origins = _parse_list(
        os.getenv("ML_CORS_ORIGINS"),
        [os.getenv("CLIENT_URL", "http://localhost:5173")],
    )

    CORS(
        app,
        resources={r"/*": {"origins": cors_origins}},
        supports_credentials=True,
    )

    @app.get("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "artifacts": {
                    "model": {"path": str(model_path), "exists": model_path.exists()},
                    "scaler": {"path": str(scaler_path), "exists": scaler_path.exists()},
                },
            }
        )

    @app.post("/predict-certification")
    def predict_certification():
        payload = request.get_json(silent=True)
        if payload is None:
            return (
                jsonify({"error": {"message": "Request body must be valid JSON"}}),
                400,
            )

        validation_error = _validate_payload(payload)
        if validation_error is not None:
            return (
                jsonify({"error": {"message": validation_error}}),
                400,
            )

        model, scaler = _ensure_artifacts_loaded(model_path, scaler_path)

        row = {name: float(payload[name]) for name in FEATURE_NAMES}
        row["attendance_rate"] = _normalize_attendance_rate(float(row["attendance_rate"]), attendance_rate_mode)

        df = pd.DataFrame([row], columns=FEATURE_NAMES).astype(float)
        x_scaled = scaler.transform(df)

        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(x_scaled)[0][1])
        elif hasattr(model, "decision_function"):
            score = float(model.decision_function(x_scaled)[0])
            probability = float(1.0 / (1.0 + math.exp(-score)))
        else:
            probability = float(model.predict(x_scaled)[0])

        certified = 1 if probability >= 0.5 else 0
        return jsonify({"certified": certified, "probability": probability})

    return app


if __name__ == "__main__":
    app = create_app()
    # Default: 5001 (set ML_PORT or PORT to change)
    # This avoids clashing with the existing Node/Express backend (commonly on 5000).
    port = int(os.getenv("ML_PORT", os.getenv("PORT", "5001")))
    app.run(host="0.0.0.0", port=port, debug=False)
