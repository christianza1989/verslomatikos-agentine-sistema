import json
import os
import sys
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from typing import List

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class SMTPEmailSender:
    def __init__(self, config_path=None):
        if not config_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(base_dir, "..", "configs", "email_credentials.json")
        
        with open(config_path, "r", encoding="utf-8") as f:
            self.cfg = json.load(f)
            
        self.host = self.cfg["smtp_host"]
        self.port = self.cfg["smtp_port"]
        self.user = self.cfg["email"]
        self.password = self.cfg["password"]
        self.display_name = self.cfg.get("display_name", "Tomas | Verslomatika B2B")
        self.reply_to = self.cfg.get("reply_to", self.user)

    def send_email(self, to_email: str, subject: str, body_text: str, body_html: str = None, attachment_paths: List[str] = None) -> bool:
        """
        Išsiunčia el. laišką per verslomatika.lt SMTP serverį, pasirinktinai prisegant PDF ar kitus failus.
        """
        if attachment_paths:
            msg = MIMEMultipart("mixed")
            alt_part = MIMEMultipart("alternative")
            alt_part.attach(MIMEText(body_text, "plain", "utf-8"))
            if body_html:
                alt_part.attach(MIMEText(body_html, "html", "utf-8"))
            msg.attach(alt_part)

            for apath in attachment_paths:
                if os.path.exists(apath):
                    filename = os.path.basename(apath)
                    part = MIMEBase("application", "octet-stream")
                    with open(apath, "rb") as af:
                        part.set_payload(af.read())
                    encoders.encode_base64(part)
                    part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
                    msg.attach(part)
        else:
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
            if body_html:
                msg.attach(MIMEText(body_html, "html", "utf-8"))

        msg["From"] = f"{self.display_name} <{self.user}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Reply-To"] = self.reply_to

        context = ssl.create_default_context()
        try:
            with smtplib.SMTP_SSL(self.host, self.port, context=context, timeout=12) as server:
                server.login(self.user, self.password)
                server.send_message(msg)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [SMTP SUCCESS] Laiškas išsiųstas gavėjui: {to_email} | Prisegtukai: {len(attachment_paths) if attachment_paths else 0}")
            return True
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [SMTP KLAIDA] Nepavyko išsiųsti į {to_email}: {e}")
            return False

if __name__ == "__main__":
    sender = SMTPEmailSender()
    print("Testuojamas ryšys su pašto serveriu...")
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(sender.host, sender.port, context=context) as s:
        s.login(sender.user, sender.password)
        print("✅ SMTP serveris mx.oradomail.com:465 patvirtino autentifikaciją!")
