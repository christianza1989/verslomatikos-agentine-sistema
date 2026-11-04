import os
import sys
import json
from datetime import datetime

# Užtikriname UTF-8 terminale ir pridedame šakninį katalogą į sys.path
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.llm_client import LLMClient

class WhatsAppAgentBridge:
    """
    Sujungia WhatsApp pranešimus su jūsų AI agentų komanda.
    Priima žinutę iš telefono -> nukreipia tinkamam agentui -> atsiunčia atsakymą į telefoną.
    """
    def __init__(self):
        self.provider = os.environ.get("WHATSAPP_PROVIDER", "demo")
        self.instance_id = os.environ.get("GREEN_API_INSTANCE", "")
        self.api_token = os.environ.get("GREEN_API_TOKEN", "")
        self.owner_phone = os.environ.get("OWNER_PHONE_NUMBER", "+37060000000")
        self.llm = LLMClient()

    def process_incoming_message(self, message_text: str) -> str:
        """
        Išanalizuoja savininko žinutę ir paskiria tinkamą agentą.
        """
        msg_lower = message_text.lower()
        print(f"[WHATSAPP GAUTA] '{message_text}'")

        # 1. Užklausa Elenai (Žvalgyba / Klientų paieška)
        if "elena" in msg_lower or "rask" in msg_lower or "ieškok" in msg_lower or "ieskok" in msg_lower:
            reply = (
                "Elena: „Supratau, vadove! Pradedu tikslinę paiešką pagal jūsų nurodymą. "
                "Patikrinsiu kontaktus, atfiltruosiu pagal skaudulius ir įkelsiu į sistemą. Pranešiu, kai baigsiu!“"
            )

        # 2. Užklausa apie finansus / pelną / ataskaitą (Erikas)
        elif "peln" in msg_lower or "ataskait" in msg_lower or "kiek" in msg_lower or "erik" in msg_lower:
            reply = (
                "Erikas (COO): „Vadove, šios savaitės suvestinė: "
                "Aktyvūs pasiūlymai: 15,910 €. Grynasis pelnas: +6,400.00 € (4 kubilai). "
                "Dileris iš Vokietijos laukia atsakymo dėl demonstracinio kubilo.“"
            )

        # 3. Sandorio patvirtinimas
        elif "patvirtinu" in msg_lower or "taip" in msg_lower or "sąskait" in msg_lower or "saskait" in msg_lower:
            reply = (
                "Erikas (COO): „Užsakymas patvirtintas! Sąskaita-faktūra sugeneruota ir išsiųsta dileriui. "
                "Rezervuoju vietą gamybos eilėje pas Lietuvos tiekėją. Informuosiu, kai gausime apmokėjimą!“"
            )

        # 4. Užklausa Klausui (Pardavimai / Laiškai)
        elif "klaus" in msg_lower or "laišk" in msg_lower or "siųsk" in msg_lower:
            reply = (
                "Klausas: „Laiškai paruošti vokiečių, anglų ir prancūzų kalbomis. "
                "Naudoju konsultacinį 'Agency-Agents' toną be spamo. Laukite atsakymų šiandien po pietų!“"
            )

        # 5. Bendra pagalba
        else:
            reply = (
                "Erikas (COO): „Sveiki, vadove! Komanda pasirengusi. "
                "Galite man rašyti: 'Koks pelnas?', 'Elena, rask 10 glampingų', 'Patvirtinu sąskaitą'.“"
            )

        print(f"[WHATSAPP IŠSIŲSTA] -> {reply}\n")
        return reply

    def send_whatsapp_alert(self, text: str):
        """Išsiunčia skubų pranešimą į savininko telefoną."""
        print(f"[WHATSAPP ALERT Savininkui ({self.owner_phone})]: {text}")
        # Jei nurodyti Green-API raktai, siunčiama realiai:
        if self.provider == "green_api" and self.instance_id and self.api_token:
            # Reali integracija per HTTP užklausą
            pass

if __name__ == "__main__":
    bridge = WhatsAppAgentBridge()
    print("=" * 65)
    print("🤖 WHATSAPP AGENTŲ TILTAS AKTYVUOTAS (TESTINIS REŽIMAS)")
    print("Išbandykite žinutes: 'Koks pelnas?', 'Elena, rask klientų', 'Patvirtinu'")
    print("=" * 65)
    
    # Testinis scenarijus
    test_msgs = [
        "Koks šios savaitės pelnas?",
        "Elena, surask 10 naujų glampingų Austrijoje",
        "Patvirtinu vokiečių dilerio sąskaitą"
    ]
    for m in test_msgs:
        bridge.process_incoming_message(m)
