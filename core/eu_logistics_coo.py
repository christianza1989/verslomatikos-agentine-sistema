import json
import os
from datetime import datetime

class EULogisticsCOOAgent:
    """
    Agentas 5: Erik (European Logistics, Dealer Margin & Weekly COO Reporter)
    Apskaičiuoja bendrą potencialų pelną, logistikos vilkikus ir pateikia savaitinę ataskaitą savininkui.
    """
    def __init__(self, config: dict, llm_client):
        self.config = config
        self.llm = llm_client
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        self.reports_dir = os.path.join(self.data_dir, "reports")
        os.makedirs(self.reports_dir, exist_ok=True)
        self.quotes_file = os.path.join(self.data_dir, "quotes.json")

    def generate_weekly_executive_report(self) -> str:
        print("[Agentas Erik] Generuojama savaitinė Europos eksporto ir pelno ataskaita...")

        quotes = []
        if os.path.exists(self.quotes_file):
            with open(self.quotes_file, "r", encoding="utf-8") as f:
                quotes = json.load(f)

        total_pipeline_val = sum(q.get("total_client_price_eur", 0) for q in quotes)
        total_net_profit = sum(q.get("net_profit_eur", 0) for q in quotes)
        date_str = datetime.now().strftime("%Y-%m-%d")

        report_md = f"""# SAVAITINĖ EUROPOS EKSPORTO ATASKAITA: KUBILAI
**Data:** {date_str} | **Paruošė:** Operacijų ir eksporto direktorius Erik
**Tiekėjas:** Tiesioginė gamyba Lietuvoje (Handcrafted in Lithuania)

---

### 1. PARDAVIMŲ IR PELNO POTENCIALAS ŠIĄ SAVAITĘ
* **Aktyvių dilerių ir glampingų užklausų skaičius:** {len(quotes)} vnt.
* **Bendra sugeneruotų komercinių pasiūlymų vertė:** {total_pipeline_val:,.2f} €
* **JŪSŲ GRYNASIS PELNAS (atskaičius gamybos savikainą Lietuvoje):** **{total_net_profit:,.2f} €**
* **Vidutinis grynasis pelnas nuo 1 kubilo:** {total_net_profit / max(1, len(quotes)):,.2f} €

---

### 2. TIKSLINIŲ KLIENTŲ IR DILERIŲ SANTRAUKA
"""
        for q in quotes:
            report_md += (
                f"- **{q['company_name']}** ({q['country']}) | Tipas: {q['lead_type']}\n"
                f"  • Modelis: *{q['model_name']}*\n"
                f"  • Kaina klientui su pristatymu: **{q['total_client_price_eur']:.2f} €**\n"
                f"  • Tiekėjo kaina Lietuvoje: {q['supplier_cost_eur']:.2f} € | **Jūsų pelnas: +{q['net_profit_eur']:.2f} €**\n\n"
            )

        report_md += """---

### 3. LOGISTIKA IR VILKIKŲ MARŠRUTAI IŠ LIETUVOS
* **Maršrutas A (Centrinė Vokietija & Olandija):** 1 kubilo pristatymo kaina su hidrauliniu liftu prie durų – 350–380 €.
* **Maršrutas B (Pietų Vokietija & Prancūzija/Alpės):** 1 kubilo pristatymas – 390–430 €.
* **Vilkiko (Full Truckload) galimybė dileriams:** 6–8 kubilai viename vilkike, transporto savikaina nukrenta iki ~280 € / kubilui, padidinant jūsų maržą dar +100 € nuo vieneto!

---

### 4. ERIKO VEIKSMŲ PLANAS ŠIAI SAVAITEI
1. Išsiųsti vokiškus ir angliškus pasiūlymus 4 naujiems dileriams/glampingams.
2. Kai vokiečių dileris (*Wellness & Gartenwelt GmbH*) patvirtins pavyzdinio kubilo užsakymą – pateikti savininkui sąskaitos rekvizitus.
3. Rezervuoti 2 vnt. populiariausių *Baltic Premium 200 cm* integruotų kubilų gamybos eilėje pas tiekėją Lietuvoje.
"""

        report_file = os.path.join(self.reports_dir, f"report_export_{date_str}.md")
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report_md)

        print(f"[Agentas Erik] Savaitinė ataskaita sugeneruota į {report_file}")
        return report_md
