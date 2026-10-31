import http.server
import threading
import urllib.request

from lectrace.server import _make_handler


def test_responses_are_not_cached(tmp_path):
    (tmp_path / "index.html").write_text("<html></html>")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _make_handler(tmp_path))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        url = f"http://127.0.0.1:{server.server_address[1]}/index.html"
        with urllib.request.urlopen(url) as resp:
            assert resp.headers["Cache-Control"] == "no-cache"
    finally:
        server.shutdown()
        server.server_close()
