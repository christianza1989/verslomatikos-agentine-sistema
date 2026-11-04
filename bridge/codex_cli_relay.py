import argparse
import json
import os
import sys
from datetime import datetime

# UTF-8 palaikymas Windows terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_PATH = os.path.join(BASE_DIR, "state.json")
MESSAGES_PATH = os.path.join(BASE_DIR, "messages.json")
TASK_PATH = os.path.join(BASE_DIR, "codex_task.md")
REPLY_PATH = os.path.join(BASE_DIR, "codex_reply.md")

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def print_status():
    state = load_json(STATE_PATH)
    messages = load_json(MESSAGES_PATH)
    print("=" * 75)
    print("🌉 ANTIGRAVITY ↔ CODEX DUAL-AGENT CLI BRIDGE")
    print("=" * 75)
    print(f"Statusas: {state.get('status', 'offline').upper()}")
    print(f"Antigravity Sesija: {state.get('antigravity', {}).get('session_id')}")
    print(f"Codex Gija:         {state.get('codex', {}).get('thread_uri')}")
    print(f"Aktyvi Užduotis:    {state.get('current_task', {}).get('title')}")
    print("-" * 75)
    print(f"Iš viso žinučių pokalbyje: {len(messages)}")
    if messages:
        last = messages[-1]
        print(f"Paskutinė žinutė [{last.get('sender')} -> {last.get('recipient')}]:")
        print(f"\"{last.get('title')}\" ({last.get('timestamp')})")
    print("=" * 75)

def send_message(sender, recipient, title, body, msg_type="general"):
    messages = load_json(MESSAGES_PATH)
    if not isinstance(messages, list):
        messages = []

    new_msg = {
        "id": f"msg-{len(messages)+1:03d}",
        "timestamp": datetime.now().isoformat(),
        "sender": sender,
        "recipient": recipient,
        "type": msg_type,
        "title": title,
        "body": body
    }
    messages.append(new_msg)
    save_json(MESSAGES_PATH, messages)
    print(f"[{sender} -> {recipient}] Žinutė sėkmingai išsiųsta: {title}")

def export_prompt_for_codex():
    state = load_json(STATE_PATH)
    task_text = ""
    if os.path.exists(TASK_PATH):
        with open(TASK_PATH, "r", encoding="utf-8") as f:
            task_text = f.read()

    print("\n" + "=" * 80)
    print("📋 KOPIJUOJAMAS PROMPTAS TIESIOGIAI Į CODEX CLI / LANGĄ:")
    print("=" * 80)
    prompt = f"""[ANTIGRAVITY -> CODEX HANDOFF]
Esu prijungtas prie Codex gijos: {state.get('codex', {}).get('thread_uri')}
Mano Antigravity sesijos ID: {state.get('antigravity', {}).get('session_id')}
Darbo katalogas: {state.get('workspace_path')}

UŽDUOTIS:
{task_text}

Prašau atlikti šį programavimo darbą, sukurti reikiamus failus ir paleisti testinį serverį. Kai pabaigsi, parašyk ataskaitą į bridge/codex_reply.md arba iškviesk:
python bridge/codex_cli_relay.py --reply "Užduotis atlikta! Štai rezultatas..."
"""
    print(prompt)
    print("=" * 80 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Antigravity ↔ Codex CLI Relay")
    parser.add_argument("--status", action="store_true", help="Rodyti tilto būseną")
    parser.add_argument("--send", type=str, help="Siųsti žinutę iš Antigravity į Codex")
    parser.add_argument("--reply", type=str, help="Siųsti atsakymą iš Codex į Antigravity")
    parser.add_argument("--title", type=str, default="Pranešimas", help="Žinutės antraštė")
    parser.add_argument("--export-prompt", action="store_true", help="Sugeneruoti paruoštą promptą Codex gijai")

    args = parser.parse_args()

    if args.send:
        send_message("Antigravity", "Codex", args.title, args.send, "task")
    elif args.reply:
        send_message("Codex", "Antigravity", args.title, args.reply, "completion")
    elif args.export_prompt:
        export_prompt_for_codex()
    else:
        print_status()
