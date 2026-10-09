#!/usr/bin/env python3
"""Small authenticated reverse proxy for the KUROKURO SearXNG container."""
import hmac
import os
import threading
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

TOKEN = os.environ["KUROKURO_API_TOKEN"]
UPSTREAM = os.environ.get("KUROKURO_UPSTREAM", "http://127.0.0.1:8080")
MAX_BODY = 1_048_576
RATE = 8
BURST = 12
WINDOW = 1.0
rate_lock = threading.Lock()
requests_by_ip = defaultdict(deque)


class ProxyHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "KUROKURO-Proxy"
    sys_version = ""

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.client_address[0], fmt % args), flush=True)

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Kurokuro-Token")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")

    def respond(self, status, body=b"", content_type="text/plain; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_cors()
        self.end_headers()
        if body and self.command != "HEAD":
            self.wfile.write(body)

    def allowed_rate(self):
        now = time.monotonic()
        ip = self.client_address[0]
        with rate_lock:
            bucket = requests_by_ip[ip]
            while bucket and now - bucket[0] >= WINDOW:
                bucket.popleft()
            if len(bucket) >= BURST or (len(bucket) >= RATE and now - bucket[-RATE] < WINDOW):
                return False
            bucket.append(now)
            return True

    def do_OPTIONS(self):
        self.respond(204)

    def do_GET(self):
        self.handle_proxy()

    def do_HEAD(self):
        self.handle_proxy()

    def do_POST(self):
        self.handle_proxy()

    def handle_proxy(self):
        if self.path.split("?", 1)[0] == "/healthz":
            self.respond(200, b"ok\n")
            return

        supplied = self.headers.get("X-Kurokuro-Token", "")
        if not hmac.compare_digest(supplied, TOKEN):
            self.respond(401, b"Unauthorized\n")
            return

        if not self.allowed_rate():
            self.respond(429, b"Too Many Requests\n")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.respond(400, b"Invalid Content-Length\n")
            return
        if length < 0 or length > MAX_BODY:
            self.respond(413, b"Request body too large\n")
            return

        body = self.rfile.read(length) if length else None
        headers = {
            "Accept": self.headers.get("Accept", "*/*"),
            "Accept-Encoding": "identity",
            "User-Agent": "KUROKURO-Search/1.0",
        }
        content_type = self.headers.get("Content-Type")
        if content_type:
            headers["Content-Type"] = content_type

        request = Request(UPSTREAM + self.path, data=body, headers=headers, method=self.command)
        try:
            try:
                upstream = urlopen(request, timeout=15)
            except HTTPError as exc:
                upstream = exc
            with upstream:
                payload = upstream.read(MAX_BODY * 4)
                status = upstream.status
                response_type = upstream.headers.get("Content-Type", "application/octet-stream")
                self.respond(status, payload, response_type)
        except (URLError, TimeoutError, OSError) as exc:
            print("Upstream proxy error: %s" % exc, flush=True)
            self.respond(502, b"Search backend temporarily unavailable\n")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "7860"))), ProxyHandler)
    server.daemon_threads = True
    print("KUROKURO authenticated proxy listening on port 7860", flush=True)
    server.serve_forever()
