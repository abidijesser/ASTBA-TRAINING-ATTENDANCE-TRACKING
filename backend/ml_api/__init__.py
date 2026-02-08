from __future__ import annotations

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .config import AppConfig
from .routes import api_bp


def create_app(config: AppConfig | None = None) -> Flask:
    app = Flask(__name__)

    cfg = config or AppConfig.from_env()
    app.config["APP_CONFIG"] = cfg

    CORS(
        app,
        resources={r"/api/*": {"origins": cfg.cors_origins}},
        supports_credentials=True,
    )

    app.register_blueprint(api_bp)

    app.config["PROPAGATE_EXCEPTIONS"] = cfg.debug

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        return (
            jsonify(
                {
                    "error": {
                        "type": "http_error",
                        "message": exc.description,
                        "status": exc.code,
                    }
                }
            ),
            exc.code,
        )

    if not cfg.debug:
        @app.errorhandler(Exception)
        def handle_unexpected_exception(exc: Exception):
            return (
                jsonify(
                    {
                        "error": {
                            "type": "internal_error",
                            "message": "Unexpected server error",
                            "status": 500,
                        }
                    }
                ),
                500,
            )

    return app
