import json
import logging
import time
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def configure_debug_logging() -> None:
    root = logging.getLogger()
    if getattr(root, "_tapsure_configured", False):
        return

    level_name = ("DEBUG").upper()
    level = getattr(logging, level_name, logging.DEBUG)

    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(funcName)s:%(lineno)d | %(message)s"
    )
    handler.setFormatter(formatter)

    root.setLevel(level)
    root.addHandler(handler)
    root._tapsure_configured = True  # type: ignore[attr-defined]


def _safe_json_loads(raw: bytes) -> Any:
    try:
        return json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        return None


def _summarize(value: Any, limit: int = 1500) -> str:
    try:
        s = json.dumps(value, ensure_ascii=False, default=str)
    except Exception:
        s = str(value)
    if len(s) > limit:
        return s[:limit] + f"...(+{len(s) - limit} chars)"
    return s


class APIDebugLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, enabled: bool = False):
        super().__init__(app)
        self.enabled = enabled
        self.log = logging.getLogger("tapsure.http")

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        start = time.perf_counter()
        method = request.method
        path = request.url.path
        query = str(request.url.query)

        body_summary = None
        content_type = (request.headers.get("content-type") or "").lower()

        try:
            raw = await request.body()
            if raw:
                if "application/json" in content_type:
                    body_summary = _summarize(_safe_json_loads(raw))
                elif "multipart/form-data" in content_type:
                    # Don't log raw file bytes
                    body_summary = "<multipart/form-data>"
                else:
                    body_summary = f"<{content_type or 'body'} {len(raw)} bytes>"
        except Exception:
            body_summary = "<unreadable>"

        self.log.debug(
            "REQUEST %s %s%s%s body=%s",
            method,
            path,
            "?" if query else "",
            query,
            body_summary,
        )

        response: Response
        try:
            response = await call_next(request)
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000.0

        # Try to peek JSON responses (bounded)
        resp_ct = (response.headers.get("content-type") or "").lower()
        resp_summary = None
        if "application/json" in resp_ct:
            try:
                # Starlette responses may not expose body; this is best-effort.
                body = getattr(response, "body", None)
                if isinstance(body, (bytes, bytearray)) and body:
                    resp_summary = _summarize(_safe_json_loads(bytes(body)))
            except Exception:
                resp_summary = None

        self.log.debug(
            "RESPONSE %s %s status=%s time_ms=%.1f body=%s",
            method,
            path,
            getattr(response, "status_code", "?"),
            elapsed_ms,
            resp_summary,
        )

        return response
