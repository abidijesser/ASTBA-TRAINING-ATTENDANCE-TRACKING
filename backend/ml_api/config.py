from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class AppConfig:
    model_path: Path
    scaler_path: Path
    threshold: float
    attendance_rate_mode: str
    cors_origins: list[str]
    debug: bool

    @staticmethod
    def _parse_bool(value: str | None, default: bool = False) -> bool:
        if value is None:
            return default
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}

    @staticmethod
    def _parse_float(value: str | None, default: float) -> float:
        if value is None or value.strip() == "":
            return default
        return float(value)

    @staticmethod
    def _parse_list(value: str | None, default: list[str]) -> list[str]:
        if value is None or value.strip() == "":
            return default
        return [item.strip() for item in value.split(",") if item.strip()]

    @classmethod
    def from_env(cls) -> "AppConfig":
        backend_dir = Path(__file__).resolve().parents[1]

        model_path = Path(os.getenv("ML_MODEL_PATH", str(backend_dir / "certification_model.pkl")))
        scaler_path = Path(os.getenv("ML_SCALER_PATH", str(backend_dir / "scaler.pkl")))

        threshold = cls._parse_float(os.getenv("ML_THRESHOLD"), 0.5)
        attendance_rate_mode = (os.getenv("ML_ATTENDANCE_RATE_MODE") or "auto").strip().lower()
        cors_origins = cls._parse_list(os.getenv("ML_CORS_ORIGINS"), [os.getenv("CLIENT_URL", "http://localhost:5173")])
        debug = cls._parse_bool(os.getenv("ML_DEBUG"), default=False)

        if attendance_rate_mode not in {"auto", "fraction", "percent"}:
            raise ValueError("ML_ATTENDANCE_RATE_MODE must be one of: auto, fraction, percent")

        if not (0.0 < threshold < 1.0):
            raise ValueError("ML_THRESHOLD must be between 0 and 1")

        return cls(
            model_path=model_path,
            scaler_path=scaler_path,
            threshold=threshold,
            attendance_rate_mode=attendance_rate_mode,
            cors_origins=cors_origins,
            debug=debug,
        )
