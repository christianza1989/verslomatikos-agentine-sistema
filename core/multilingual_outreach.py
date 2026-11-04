import json
import os
from datetime import datetime
from core.objection_handler import EuropeanObjectionHandler

class MultilingualOutreachAgent:
    """
    Agentas 2: Klaus (Multilingual B2B Outreach & Dealer Closer)
    Patobulintas pagal msitarzewski/agency-agents 'sales-outreach' ir 'outbound-strategist' standartus:
    - Konsultacinis tonas, jokio pigaus spamo.
    - Aiškus skaudulio adresavimas (Signal-based outreach).
    - Iš anksto neutralizuojamos vokiečių ir skandinavų baimės (kodėl Lietuva, garantija, transportas).
    """
    def __init__(self, config: dict, llm_client):
        self.config = config
        self.llm = llm_client
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.outbox_file = os.path.join(self.data_dir, "outbox_multilingual.json")

    def generate_campaign_messages(self, leads: list) -> list:
        print("[Agentas Klaus] Generuojami asmeniniai pasiūlymai pagal 'Agency-Agents' konsultacinę metodiką...")
        messages = []

        for lead in leads:
            lang = lead.get("language", "EN")
            country = lead.get("country", "")
            is_dealer = "Dileris" in lead.get("category", "") or "Händler" in lead.get("category", "")
            
            if lang == "DE":
                if is_dealer:
                    subject = f"Händlerkonditionen ab Werk Litauen: Premium GFK-Badefässer für {lead['company_name']}"
                else:
                    subject = f"Auslastung steigern im Winter: Handgefertigte Badefässer für {lead['company_name']}"
            elif lang == "FR":
                subject = f"Bains nordiques directs d'usine pour {lead['company_name']} - Offre Pro"
            else:
                subject = f"Direct Manufacturer Hot Tubs for {lead['company_name']} (Lithuania)"

            sys_p = (
                f"Tu esi Klaus – vyriausiasis eksporto vadybininkas iš Lietuvos kubilų gamyklos. "
                "Tavo filosofija: 'Geriausi pardavėjai nebruka per prievartą – jie padeda klientui pirkti.' "
                f"Rašyk itin mandagų, profesionalų, konsultacinį B2B laišką {lang} kalba be jokių pigių marketingo šūkių. "
                "Pabrėžk: tiesioginė gamykla Lietuvoje, CE sertifikatai, 2 metų garantija, saugus atvežimas su liftu prie durų."
            )
            usr_p = (
                f"Klientas: {lead['contact_name']}, įmonė: {lead['company_name']}, šalis: {country}. "
                f"Kategorija: {lead['category']}. Nustatytas poreikis/signalas: {lead['pain_point']}."
            )

            body = self.llm.generate(sys_p, usr_p)

            msg = {
                "message_id": f"msg-{lead['id']}",
                "lead_id": lead["id"],
                "company_name": lead["company_name"],
                "recipient_name": lead["contact_name"],
                "recipient_email": lead["email"],
                "country": country,
                "language": lang,
                "subject": subject,
                "body": body,
                "objection_framework_ready": True,
                "delivery_status": "ready_to_send",
                "created_at": datetime.now().isoformat()
            }
            messages.append(msg)

        with open(self.outbox_file, "w", encoding="utf-8") as f:
            json.dump(messages, f, indent=2, ensure_ascii=False)

        print(f"[Agentas Klaus] Paruošta {len(messages)} aukštos konversijos laiškų į {self.outbox_file}")
        return messages
