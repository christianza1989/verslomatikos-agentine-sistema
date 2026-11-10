import os

path = r"E:\Verslomatika\verslomatika_gui.py"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

tunnel_service = '''    "tunnel": {
        "id": "tunnel",
        "name": "Cloudflare VPS Tunnel",
        "title": "☁️ Cloudflare VPS Tunelis (24/7 Saugi Vieša Prieiga)",
        "desc": "reputacija.verslomatika.lt ir reviveleads.verslomatika.lt tiesioginis saugus tunelis į šį PC.",
        "port": 20241,
        "url": "https://reputacija.verslomatika.lt",
        "health_url": "http://127.0.0.1:20241/ready",
        "cwd": ROOT_DIR,
        "cmd": [os.path.join(ROOT_DIR, "tools", "cloudflared.exe"), "tunnel", "--metrics", "127.0.0.1:20241", "run", "verslomatika-vps"],
    }
'''

if '"tunnel":' not in code:
    # Insert before the closing brace of SERVICES
    idx = code.find('"cwd": os.path.join(ROOT_DIR, "bridge"),')
    if idx != -1:
        end_brace = code.find('}', idx)
        if end_brace != -1:
            code = code[:end_brace+1] + ',\n' + tunnel_service + code[end_brace+2:]
            print("Tunnel service inserted into SERVICES!")

old_start_all = 'for key in ["bridge", "reputationpro", "reviveleads"]:'
new_start_all = 'for key in ["bridge", "reputationpro", "reviveleads", "tunnel"]:'
if old_start_all in code:
    code = code.replace(old_start_all, new_start_all)
    print("start_all_services updated!")

with open(path, "w", encoding="utf-8") as f:
    f.write(code)
print("Finished updating verslomatika_gui.py")
