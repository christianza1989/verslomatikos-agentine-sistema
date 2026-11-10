"""Multi-Agent SMTP ryšio patikra (Hostinger / verslomatika.eu).

Paleidimas:
    python test_multi_agent_smtp.py                  # Patikrina visų 5 agentų ryšį ir autorizaciją
    python test_multi_agent_smtp.py --send-test jusu_el_pastas@gmail.com   # Išsiunčia 1 bandomąjį laišką iš kiekvieno
"""
import os
import sys
import json
import smtplib
import ssl

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIGS_DIR = os.path.join(BASE_DIR, "configs", "reputation_agents")

AGENTS = [
    ("Tomas (Klinikos)", os.path.join(BASE_DIR, "configs", "email_credentials.json")),
    ("Marius (Klinikos)", os.path.join(CONFIGS_DIR, "agent_marius.json")),
]

def check_agent(name: str, config_path: str, send_test_to: str = None) -> dict:
    path = config_path
    if not os.path.exists(path):
        example_path = path.replace(".json", ".example.json")
        if os.path.exists(example_path):
            filename = os.path.basename(path)
            return {
                "name": name,
                "email": filename.replace("agent_", "").replace(".json", "") + "@verslomatika.eu",
                "status": "PENDING",
                "msg": f"Sukurkite failą '{path}' ir įveskite Hostinger slaptažodį."
            }
        return {"name": name, "status": "FAIL", "msg": f"Failas nerastas: {path}"}

    try:
        with open(path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        return {"name": name, "status": "FAIL", "msg": f"Klaida skaitant JSON: {e}"}

    email = cfg.get("email", "")
    password = cfg.get("password", "")
    host = cfg.get("smtp_host", "smtp.hostinger.com")
    port = cfg.get("smtp_port", 465)

    if not password or password == "HOSTINGER_PASSWORD_HERE":
        filename = os.path.basename(path)
        return {
            "name": name,
            "email": email,
            "status": "PENDING",
            "msg": f"Laukia slaptažodžio įvedimo faile: configs/reputation_agents/{filename}"
        }

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(host, port, context=context, timeout=12) as server:
            server.login(email, password)
            if send_test_to:
                from email.mime.text import MIMEText
                msg = MIMEText(f"Sveiki,\n\nTai bandomasis laiškas iš ReputationPro agento: {name} ({email}).\nHostinger SMTP veikia sklandžiai!", "plain", "utf-8")
                msg["Subject"] = f"Testinis ryšio patikrinimas: {name}"
                msg["From"] = f"{cfg.get('display_name', name)} <{email}>"
                msg["To"] = send_test_to
                server.sendmail(email, [send_test_to], msg.as_string())
                return {"name": name, "email": email, "status": "OK", "msg": f"Prisijungta ir išsiųstas testinis laiškas į {send_test_to}!"}

            return {"name": name, "email": email, "status": "OK", "msg": "Autentifikacija sėkminga (Hostinger SMTP 465 SSL)!"}
    except smtplib.SMTPAuthenticationError:
        return {"name": name, "email": email, "status": "AUTH_ERROR", "msg": "Neteisingas slaptažodis arba el. paštas!"}
    except Exception as e:
        return {"name": name, "email": email, "status": "ERROR", "msg": f"Ryšio klaida: {e}"}

def main():
    send_to = None
    if "--send-test" in sys.argv:
        idx = sys.argv.index("--send-test")
        if idx + 1 < len(sys.argv):
            send_to = sys.argv[idx + 1]

    print("=" * 75)
    print("📬 REPUTATIONPRO MULTI-AGENT HOSTINGER SMTP TIKRINIMAS (verslomatika.eu)")
    print("=" * 75)

    all_ok = True
    for name, filename in AGENTS:
        res = check_agent(name, filename, send_test_to=send_to)
        status = res["status"]
        email_str = f"[{res.get('email', filename)}]"
        if status == "OK":
            icon = "🟢 OK"
        elif status == "PENDING":
            icon = "🟡 LAUKIA"
            all_ok = False
        else:
            icon = f"🔴 {status}"
            all_ok = False
        print(f"{icon:<12} | {res['name']:<22} {email_str:<26} | {res['msg']}")

    print("=" * 75)
    if all_ok:
        print("✅ Visi 5 agentai sėkmingai prisijungė prie Hostinger SMTP!")
    else:
        print("ℹ️ Įveskite trūkstamus slaptažodžius 'configs/reputation_agents/*.json' failuose.")
    print("=" * 75)

if __name__ == "__main__":
    main()
