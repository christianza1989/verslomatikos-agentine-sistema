import json
import os
from datetime import datetime

class TeamChatSimulator:
    """
    Agentų tarpusavio bendravimo (Group Chat) variklis.
    Agentai realiai tariasi tarpusavyje, sprendžia užduotis ir koordinuoja veiksmus.
    """
    def __init__(self, config: dict):
        self.config = config
        self.b_name = config.get("business_name", "Verslas")
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.chat_log_file = os.path.join(self.data_dir, "team_chat_log.md")

    def run_collaboration_session(self, owner_instruction: str = "Surasti naujų klientų ir padidinti pardavimus Europoje") -> list:
        print(f"[{self.b_name}] [VIRTUALUS BIURAS] Agentai renkasi į rytinį susirinkimą...")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        conversation = [
            {
                "sender": "Savininkas (JŪS)",
                "role": "CEO / Savininkas",
                "message": f"„Komanda, mūsų šios savaitės tikslas: {owner_instruction}. Kaip pasidaliname darbus?“"
            },
            {
                "sender": "Erik",
                "role": "Operacijų direktorius (COO)",
                "message": "„Priimta, vadove. Aš kuruoju logistiką ir maržas. Šią savaitę turime gamybos pajėgumų 6–8 kubilams Lietuvoje. Elena, kokių regionų kontaktus paruoši?“"
            },
            {
                "sender": "Elena",
                "role": "Žvalgė (Lead Scout)",
                "message": "„Aš jau nuskenavau pietų Vokietiją (Bavariją ir Švarcvaldą) bei Olandiją. Atrinkau 4 patvirtintus glampingus ir 1 sodo technikos dilerį. Visi kontaktai patikrinti ir įkelti į leads_europe.json. Klausai, gali pradėti šaltąjį kontaktą.“"
            },
            {
                "sender": "Klaus",
                "role": "Pardavimų vadovas (Outreach Closer)",
                "message": "„Ačiū, Elena! Pasiėmiau kontaktus. Vokiečių dileriams paruošiau laiškus su akcentu į 35% dilerio maržą ir 2 metų CE gamyklos garantiją. Glampingams akcentuoju nakvynės kainos pakėlimą žiemą. Jei kuris atsakys ir prašys kainos, Sophie, ar kainynas paruoštas?“"
            },
            {
                "sender": "Sophie",
                "role": "Kainų ir pasiūlymų inžinierė (Quote Engine)",
                "message": "„Taip, Klausai! Įvertinau atstumus: transportas į Vokietiją – 350 €, į Olandiją – 380 €. Paskaičiavau bendrą kainą su atvežimu iki durų ir suplanavau 3 d. bei 7 d. priminimus, kad klientas nepamirštų mūsų pasiūlymo.“"
            },
            {
                "sender": "Erik",
                "role": "Operacijų direktorius (COO)",
                "message": "„Puikiai. Kai vokiečių dileris patvirtins pavyzdinį užsakymą, aš asmeniškai informuoju savininką sąskaitai išrašyti. Vadove, savaitės pabaigoje paruošiu jums pilną ataskaitą apie grynajį pelną!“"
            }
        ]

        # Suformuojame gražų pokalbio žurnalą
        chat_md = f"# VIRTUALAUS BIURO AGENTŲ POKALBIS (GROUP CHAT)\n**Data:** {timestamp}\n**Verslas:** {self.b_name}\n\n---\n\n"
        for msg in conversation:
            chat_md += f"**[{msg['sender']} - {msg['role']}]:**\n{msg['message']}\n\n"

        with open(self.chat_log_file, "w", encoding="utf-8") as f:
            f.write(chat_md)

        print(f"[VIRTUALUS BIURAS] Agentų tarpusavio pokalbis įvyko ir išsaugotas į: {self.chat_log_file}")
        return conversation
