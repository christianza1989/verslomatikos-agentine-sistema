import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import time
import email
from email.header import decode_header
from email.utils import parseaddr
import imaplib
import ssl
import sqlite3
import uuid
import re
from datetime import datetime
from core.reputation_sales_agent import ReputationSalesAgent
from core.accounting_pipeline import AccountingPipeline

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

DB_PATH = os.path.join(BASE_DIR, 'apps', 'reputationpro', 'data', 'reputation.db')

OPT_OUT_PATTERNS = [
    r"^\s*ne[\s.!,]*$", r"^\s*ne[,.!]", r"atsisakau", r"neaktualu", r"nedomina", r"nebesi[uų]sk", r"nera[sš]ykite",
    r"i[sš]braukite", r"nenoriu gauti", r"unsubscribe", r"^\s*stop\b", r"remove me",
]


def is_opt_out(body_text: str) -> bool:
    """ROADMAP C4: „ne“ / „atsisakau“ / „neaktualu“ atsakymai. Tikrinama tik nauja atsakymo dalis (be citatos)."""
    fresh = re.split(r"\n\s*(?:>|On .+ wrote:|.+ ra[sš][eė]:|-----)", body_text or "", maxsplit=1)[0]
    fresh = fresh.strip().lower()[:400]
    return any(re.search(p, fresh, flags=re.MULTILINE) for p in OPT_OUT_PATTERNS)


def record_opt_out(sender_email: str, body_text: str):
    try:
        from core.claim_tokens import ensure_schema, suppress
        conn = sqlite3.connect(DB_PATH, timeout=5.0)
        ensure_schema(conn)
        suppress(conn, sender_email, "opt_out", (body_text or "")[:300])
        conn.close()
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚫 [OPT-OUT] {sender_email} daugiau nebus kontaktuojamas.")
    except Exception as e:
        print(f"[DB Opt-out Error] {e}")


def record_inbound_reply(sender_email: str, body_text: str):
    try:
        if not os.path.exists(DB_PATH):
            return
        conn = sqlite3.connect(DB_PATH, timeout=5.0)
        c = conn.cursor()
        c.execute("SELECT id, business_name FROM campaign_leads WHERE LOWER(email) = LOWER(?)", (sender_email.strip(),))
        row = c.fetchone()
        now = datetime.now().isoformat()
        if row:
            lead_id, b_name = row
            c.execute("""UPDATE campaign_leads SET 
                status = CASE WHEN status != 'converted' THEN 'replied' ELSE status END,
                replied_at = ?,
                last_reply_text = ?,
                updated_at = ?
                WHERE id = ?""", (now, body_text, now, lead_id))
            event_id = str(uuid.uuid4())
            c.execute("INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'reply', ?)",
                      (event_id, lead_id, body_text[:500]))
            conn.commit()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 [Tracking] Atnaujintas leadas {b_name} ({sender_email}) reputacija.db: status='replied'!")
        conn.close()
    except Exception as e:
        print(f"[DB Reply Record Error] {e}")

def get_campaign_lead_emails():
    try:
        if not os.path.exists(DB_PATH):
            return set()
        conn = sqlite3.connect(DB_PATH, timeout=5.0)
        c = conn.cursor()
        c.execute("SELECT LOWER(email) FROM campaign_leads")
        emails = {r[0] for r in c.fetchall()}
        conn.close()
        return emails
    except Exception:
        return set()

def get_accounting_emails():
    try:
        if not os.path.exists(DB_PATH):
            return set()
        conn = sqlite3.connect(DB_PATH, timeout=5.0)
        c = conn.cursor()
        c.execute("SELECT LOWER(client_email) FROM accounting_cases")
        emails = {r[0] for r in c.fetchall()}
        conn.close()
        return emails
    except Exception:
        return set()

def run_listener(target_sender: str = "lilijazap@gmail.com", poll_interval: int = 5):
    agent = ReputationSalesAgent()
    accounting_pipe = AccountingPipeline()
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎧 Pradedamas IMAP klausymasis dėžutėje {agent.email_user}...")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Stebimi gavėjai: {target_sender}, apskaitos klientai ir B2B kampanijos.")
    
    seen_ids = set()
    
    # Pradžioje pažymime esamus laiškus
    context = ssl.create_default_context()
    try:
        with imaplib.IMAP4_SSL(agent.imap_host, agent.imap_port, ssl_context=context) as mail:
            mail.login(agent.email_user, agent.email_pass)
            mail.select("INBOX")
            status, msgs = mail.search(None, "ALL")
            if status == "OK" and msgs[0]:
                for mid in msgs[0].split():
                    seen_ids.add(mid.decode())
    except Exception as e:
        print(f"[IMAP Init Warning] {e}")

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Pasiruošęs! Esami laiškai: {len(seen_ids)}. Laukiami nauji laiškai...")

    while True:
        try:
            with imaplib.IMAP4_SSL(agent.imap_host, agent.imap_port, ssl_context=context) as mail:
                mail.login(agent.email_user, agent.email_pass)
                mail.select("INBOX")
                status, msgs = mail.search(None, "ALL")
                if status == "OK" and msgs[0]:
                    current_ids = [m.decode() for m in msgs[0].split()]
                    for mid in current_ids:
                        if mid not in seen_ids:
                            seen_ids.add(mid)
                            # Parsisiunčiame naują laišką
                            status, data = mail.fetch(mid.encode(), "(RFC822)")
                            raw_email = data[0][1]
                            parsed_msg = email.message_from_bytes(raw_email)
                            
                            from_hdr = parsed_msg.get("From", "")
                            subject, enc = decode_header(parsed_msg.get("Subject", ""))[0]
                            if isinstance(subject, bytes):
                                subject = subject.decode(enc or "utf-8", errors="ignore")
                                
                            body = ""
                            attachments = []
                            if parsed_msg.is_multipart():
                                for part in parsed_msg.walk():
                                    ctype = part.get_content_type()
                                    disposition = str(part.get("Content-Disposition", ""))
                                    filename = part.get_filename()
                                    
                                    if filename or "attachment" in disposition:
                                        # Decode filename
                                        fname_decoded = ""
                                        for s, e in decode_header(filename or "file"):
                                            if isinstance(s, bytes):
                                                fname_decoded += s.decode(e or "utf-8", errors="ignore")
                                            else:
                                                fname_decoded += str(s)
                                        payload_bytes = part.get_payload(decode=True)
                                        if payload_bytes:
                                            attachments.append({
                                                "filename": fname_decoded,
                                                "data": payload_bytes
                                            })
                                    elif ctype == "text/plain" and not body:
                                        payload = part.get_payload(decode=True)
                                        if payload:
                                            body = payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                                    elif ctype == "text/html" and not body:
                                        payload = part.get_payload(decode=True)
                                        if payload:
                                            raw_html = payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                                            body = re.sub(r'<[^>]+>', ' ', raw_html).strip()
                            else:
                                payload = parsed_msg.get_payload(decode=True)
                                if payload:
                                    body = payload.decode(parsed_msg.get_content_charset() or "utf-8", errors="ignore")
                            
                            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 📬 GAUTAS NAUJAS LAIŠKAS!")
                            print(f"Nuo: {from_hdr}")
                            print(f"Tema: {subject}")
                            print(f"Prikabinti failai: {[a['filename'] for a in attachments]}")
                            print(f"Tekstas:\n{body.strip()[:200]}...\n")
                            
                            sender_email = parseaddr(from_hdr)[1].lower()
                            subj_low = (subject or "").lower()
                            body_low = (body or "").lower()

                            # 0. Apsauga nuo automatinių atostogų pranešimų (Out of Office / Auto-reply loop guard)
                            is_auto_reply = any(k in subj_low or k in body_low for k in [
                                "automatinis atsakymas", "out of office", "auto-reply", "autoreply",
                                "nedirbu iki", "atostogauju", "esu atostogose", "šiuo metu atostogauju",
                                "automated response", "delivery status notification", "mail delivery subsystem"
                            ])
                            if is_auto_reply:
                                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🛑 [AUTO-REPLY / VACATION] Praleidžiamas automatinis atsakymas iš {sender_email}.")
                                continue
                            
                            # 1. Pirmiausia ReputationPro kampanijos leadai: jų atsakymai su žodžiais
                            #    „kaina“, „UAB“ ir pan. anksčiau klaidingai keliaudavo į buhalterijos srautą.
                            campaign_emails = get_campaign_lead_emails()
                            if sender_email in campaign_emails and sender_email != agent.email_user.lower():
                                record_inbound_reply(sender_email, body.strip())
                                if is_opt_out(body):
                                    record_opt_out(sender_email, body.strip())
                                else:
                                    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔥 [HOT REPUTATION LEAD] Gautas atsakymas iš {sender_email}! Atsakykite asmeniškai.")
                                continue

                            # 2. Tikriname ar tai Apskaitos klientas arba nauja buhalterinė užklausa / dokumentai
                            accounting_leads = get_accounting_emails() | {"lilijazap@gmail.com"}
                            is_accounting_query = (
                                sender_email in accounting_leads
                                or any(k in (subj_low + " " + body_low) for k in [
                                    "apskait", "buhalter", "deklarac", "balans", "vmi", "mokesč", "mokest",
                                    "pln204", "sąskait", "saskait", "audit", "mb ", "uab ", "kaina", "įkain",
                                    "accounting", "tax return", "financial statements", "cit", "vat"
                                ])
                                or any(a["filename"].lower().endswith(ext) for a in attachments for ext in [".xlsx", ".xls", ".csv", ".xml", ".pdf", ".zip"])
                            )

                            if is_accounting_query and sender_email != agent.email_user.lower():
                                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎯 [BUHALTERIJOS UŽKLAUSA / KLIENTAS] Apdorojamas atsakymas iš {sender_email}!")
                                accounting_pipe.process_inbound_reply(sender_email, subject, body.strip(), attachments)
                                continue

                            # 3. Kiti leidžiami siuntėjai (testai)
                            allowed_senders = {target_sender.lower(), "phengwey5@gmail.com", "memocasting.lt@gmail.com"}
                            
                            if sender_email in allowed_senders and sender_email != agent.email_user.lower():
                                record_inbound_reply(sender_email, body.strip())
                                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔥 [HOT REPUTATION LEAD] Gautas atsakymas iš {sender_email}!")
                            else:
                                print(f"[{datetime.now().strftime('%H:%M:%S')}] Laiškas iš {sender_email} praleidžiamas.")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [Klaida cikle] {e}")

        time.sleep(poll_interval)

def _plain_body(msg) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain" and not part.get_filename():
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    return re.sub(r"<[^>]+>", " ", payload.decode(part.get_content_charset() or "utf-8", errors="ignore"))
        return ""
    payload = msg.get_payload(decode=True)
    return payload.decode(msg.get_content_charset() or "utf-8", errors="ignore") if payload else ""


def run_campaign_inbox(cfg_path: str, poll_interval: int = 30):
    """Other agents' mailboxes (2026-11-11: Marius). Only campaign replies: opt-out ("ne") or reply -> follow-ups stop.
    Accounting and the sales agent stay on Tomas' mailbox (run_listener)."""
    import json
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    user, host, port = cfg["email"], cfg.get("imap_host", "imap.hostinger.com"), int(cfg.get("imap_port", 993))
    context = ssl.create_default_context()
    seen = None
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎧 Kampanijos atsakymai dėžutėje {user}...")
    while True:
        try:
            with imaplib.IMAP4_SSL(host, port, ssl_context=context) as mail:
                mail.login(user, cfg["password"])
                mail.select("INBOX")
                status, msgs = mail.search(None, "ALL")
                ids = [m.decode() for m in msgs[0].split()] if status == "OK" and msgs[0] else []
                if seen is None:
                    seen = set(ids)
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {user}: esami laiškai {len(seen)}, laukiami nauji.")
                for mid in ids:
                    if mid in seen:
                        continue
                    seen.add(mid)
                    _, data = mail.fetch(mid.encode(), "(RFC822)")
                    msg = email.message_from_bytes(data[0][1])
                    sender_email = parseaddr(msg.get("From", ""))[1].lower()
                    subject, enc = decode_header(msg.get("Subject", ""))[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(enc or "utf-8", errors="ignore")
                    body = _plain_body(msg)
                    low = f"{subject} {body}".lower()
                    if any(k in low for k in ["automatinis atsakymas", "out of office", "auto-reply", "autoreply", "atostog",
                                               "delivery status notification", "mail delivery subsystem"]):
                        continue
                    if sender_email in get_campaign_lead_emails() and sender_email != user.lower():
                        record_inbound_reply(sender_email, body.strip())
                        if is_opt_out(body):
                            record_opt_out(sender_email, body.strip())
                        else:
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔥 [{user}] Atsakė {sender_email}: atsakykite asmeniškai.")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [{user} klaida] {e}")
        time.sleep(poll_interval)


if __name__ == "__main__":
    import threading
    target = sys.argv[1] if len(sys.argv) > 1 else "lilijazap@gmail.com"
    # Every other active campaign agent with a real mailbox config gets its own reply watcher.
    from core.morning_campaign_runner import AGENT_PROFILES
    for a in AGENT_PROFILES:
        cfg = a.get("config_path") or ""
        if a.get("is_active") and a["email"] != "tomas@verslomatika.lt" and cfg.endswith(".json") and not cfg.endswith(".example.json"):
            threading.Thread(target=run_campaign_inbox, args=(cfg,), daemon=True).start()
    run_listener(target)
