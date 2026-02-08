from __future__ import annotations

import os

from ml_api import create_app


def main() -> None:
    app = create_app()

    host = os.getenv("ML_HOST", "0.0.0.0")
    port = int(os.getenv("ML_PORT", "8000"))
    debug = bool(app.config["APP_CONFIG"].debug)

    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
