import http.server
import json
import os
import sys
import urllib.parse
from datetime import datetime

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PORT = 5050
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GUI_DIR = os.path.join(BASE_DIR, "gui")
STATE_PATH = os.path.join(BASE_DIR, "state.json")
MESSAGES_PATH = os.path.join(BASE_DIR, "messages.json")
TASK_PATH = os.path.join(BASE_DIR, "codex_task.md")
REPLY_PATH = os.path.join(BASE_DIR, "codex_reply.md")

def read_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def read_text(path, default=""):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_text(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

class BridgeRequestHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        if path == "/api/state":
            state = read_json(STATE_PATH, {})
            data = json.dumps(state, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        elif path == "/api/messages":
            msgs = read_json(MESSAGES_PATH, [])
            data = json.dumps(msgs, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        elif path == "/api/task":
            content = read_text(TASK_PATH, "")
            data = content.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        elif path == "/api/reply":
            content = read_text(REPLY_PATH, "")
            data = content.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        elif path == "/" or path == "/index.html":
            html_file = os.path.join(GUI_DIR, "index.html")
            if os.path.exists(html_file):
                with open(html_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        # 404 fallback
        msg = b"404 Not Found"
        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(msg)))
        self.end_headers()
        self.wfile.write(msg)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        payload = {}
        if post_data:
            try:
                payload = json.loads(post_data)
            except Exception:
                pass

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/send":
            messages = read_json(MESSAGES_PATH, [])
            new_msg = {
                "id": f"msg-{len(messages)+1:03d}",
                "timestamp": datetime.now().isoformat(),
                "sender": payload.get("sender", "Antigravity"),
                "recipient": payload.get("recipient", "Codex"),
                "type": payload.get("type", "general"),
                "title": payload.get("title", "Nauja žinutė"),
                "body": payload.get("body", "")
            }
            messages.append(new_msg)
            write_json(MESSAGES_PATH, messages)

            data = json.dumps({"status": "ok", "message": new_msg}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        elif path == "/api/update_sessions":
            state = read_json(STATE_PATH, {})
            if "codex_thread_uri" in payload:
                state.setdefault("codex", {})["thread_uri"] = payload["codex_thread_uri"]
                state["codex"]["thread_id"] = payload["codex_thread_uri"].replace("codex://threads/", "")
            if "antigravity_session_id" in payload:
                state.setdefault("antigravity", {})["session_id"] = payload["antigravity_session_id"]
            state["status"] = "connected"
            write_json(STATE_PATH, state)

            data = json.dumps({"status": "ok", "state": state}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        elif path == "/api/set_task":
            state = read_json(STATE_PATH, {})
            task_title = payload.get("title", "Nauja Užduotis")
            task_desc = payload.get("description", "")
            
            state["current_task"] = {
                "task_id": f"TASK-{int(datetime.now().timestamp()) % 1000:03d}",
                "title": task_title,
                "assigned_by": "Antigravity",
                "assigned_to": "Codex",
                "priority": payload.get("priority", "HIGH"),
                "status": "in_progress"
            }
            write_json(STATE_PATH, state)

            md_content = f"# AKTYVI UŽDUOTIS CODEX: {task_title}\n\n"
            md_content += f"* **Priskirta iš:** Antigravity\n* **Statusas:** IN_PROGRESS\n* **Laikas:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
            md_content += f"## Užduoties Aprašymas:\n{task_desc}\n"
            write_text(TASK_PATH, md_content)

            messages = read_json(MESSAGES_PATH, [])
            messages.append({
                "id": f"msg-{len(messages)+1:03d}",
                "timestamp": datetime.now().isoformat(),
                "sender": "Antigravity",
                "recipient": "Codex",
                "type": "task_assignment",
                "title": f"📋 Nauja Užduotis: {task_title}",
                "body": task_desc
            })
            write_json(MESSAGES_PATH, messages)

            data = json.dumps({"status": "ok", "task": state["current_task"]}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    server_address = ('0.0.0.0', PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, BridgeRequestHandler)
    print("=" * 70)
    print(f"🚀 ANTIGRAVITY ↔ CODEX THREADING SERVERIS PALEISTAS:")
    print(f"🌐 GUI: http://localhost:{PORT} arba http://127.0.0.1:{PORT}")
    print("=" * 70)
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
