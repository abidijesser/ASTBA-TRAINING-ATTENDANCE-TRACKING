from __future__ import annotations

from pathlib import Path
import threading
from typing import Any
import math

import joblib
import pandas as pd

from ..config import AppConfig


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


def _ensure_artifacts_loaded(cfg: AppConfig):
    global _model, _scaler

    if _model is not None and _scaler is not None:
        return _model, _scaler

    with _model_lock:
        if _model is not None and _scaler is not None:
            return _model, _scaler

        if not cfg.model_path.exists():
            raise FileNotFoundError(f"Model not found: {cfg.model_path}")
        if not cfg.scaler_path.exists():
            raise FileNotFoundError(f"Scaler not found: {cfg.scaler_path}")

        _model = joblib.load(cfg.model_path)
        _scaler = joblib.load(cfg.scaler_path)

        return _model, _scaler


def artifacts_status(cfg: AppConfig) -> dict[str, Any]:
    def _file_info(path: Path) -> dict[str, Any]:
        if not path.exists():
            return {"path": str(path), "exists": False}
        stat = path.stat()
        return {
            "path": str(path),
            "exists": True,
            "size_bytes": stat.st_size,
            "modified": stat.st_mtime,
        }

    return {
        "model": _file_info(cfg.model_path),
        "scaler": _file_info(cfg.scaler_path),
    }


def validate_payload(payload: dict[str, Any]) -> str | None:
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


def _normalize_attendance_rate(value: float, mode: str) -> float:
    if mode == "fraction":
        return value
    if mode == "percent":
        return value / 100.0

    # auto
    if value > 1.5 and value <= 100.0:
        return value / 100.0
    return value


def predict_certification(payload: dict[str, Any], cfg: AppConfig) -> dict[str, Any]:
    model, scaler = _ensure_artifacts_loaded(cfg)

    row = {name: float(payload[name]) for name in FEATURE_NAMES}
    row["attendance_rate"] = _normalize_attendance_rate(row["attendance_rate"], cfg.attendance_rate_mode)

    df = pd.DataFrame([row], columns=FEATURE_NAMES)
    df = df.astype(float)
    x_scaled = scaler.transform(df)

    probability: float
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(x_scaled)
        probability = float(proba[0][1])
    elif hasattr(model, "decision_function"):
        score = float(model.decision_function(x_scaled)[0])
        # logistic transform
        probability = float(1.0 / (1.0 + math.exp(-score)))
    else:
        pred = int(model.predict(x_scaled)[0])
        probability = float(pred)

    prediction = 1 if probability >= cfg.threshold else 0

    return {
        "prediction": {"certified": prediction, "probability": probability, "threshold": cfg.threshold},
        "features": row,
    }
