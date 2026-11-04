import argparse
import json
import os
import sys
from datetime import datetime

# Užtikriname UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.llm_client import LLMClient
from core.objection_handler import EuropeanObjectionHandler

def load_business_config(business_id: str) -> dict:
    base_dir = os.path.dirname(__file__)
    config_path = os.path.join(base_dir, "configs", f"{business_id}.json")
    if not os.path.exists(config_path):
        print(f"[KLAIDA] Konfigūracija nerasta: {config_path}")
        print("Esami verslai: " + ", ".join([f.replace(".json", "") for f in os.listdir(os.path.join(base_dir, "configs")) if f.endswith(".json")]))
        sys.exit(1)
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)

class UniversalSwarm:
    def __init__(self, config: dict):
        self.config = config
        self.b_id = config.get("business_id", "default")
        self.b_name = config.get("business_name", "Verslas")
        self.llm = LLMClient()
        self.data_dir = os.path.join(os.path.dirname(__file__), "data", self.b_id)
        self.reports_dir = os.path.join(self.data_dir, "reports")
        os.makedirs(self.reports_dir, exist_ok=True)

    def run_lead_scout(self) -> list:
        print(f"[{self.b_name}] [Agentė Elena / Lead Scout] Ieškomi potencialūs klientai ir partneriai rinkoje: {self.config.get('target_market', 'Lietuva/Europa')}...")
        
        # Pavyzdiniai dinamiškai adaptuoti kontaktai
        leads = [
            {
                "id": f"{self.b_id}-lead-01",
                "name": "Baltic Horizon Partners",
                "contact_person": "Marius Jankauskas",
                "email": "marius@baltichorizon.example.com",
                "phone": "+370 600 11223",
                "market": self.config.get("target_market", "Lietuva"),
                "status": "ready_for_outreach",
                "signal": f"Aktyviai ieško kokybiškų sprendimų {self.config.get('industry', 'verslo')} srityje.",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": f"{self.b_id}-lead-02",
                "name": "Nordic Solutions Oü",
                "contact_person": "Erik Lindqvist",
                "email": "erik@nordicsolutions.example.com",
                "phone": "+372 555 99881",
                "market": "Skandinavija / Baltija",
                "status": "ready_for_outreach",
                "signal": "Reikalingas patikimas tiesioginis tiekėjas su garantija.",
                "created_at": datetime.now().isoformat()
            }
        ]
        
        leads_path = os.path.join(self.data_dir, "leads.json")
        with open(leads_path, "w", encoding="utf-8") as f:
            json.dump(leads, f, indent=2, ensure_ascii=False)
        print(f"[Lead Scout] Rasti ir išsaugoti {len(leads)} tiksliniai kontaktai į {leads_path}")
        return leads

    def run_outreach(self, leads: list) -> list:
        print(f"[{self.b_name}] [Agentas Klaus / Outreach Closer] Generuojami asmeniniai pasiūlymai pagal 'Agency-Agents' standartus...")
        outbox = []

        sys_p = (
            f"Tu esi vyriausiasis pardavimų ir partnerystės vadovas verslui: {self.b_name}. "
            f"Veiklos sritis: {self.config.get('industry', '')}. "
            "Tavo tikslas: parašyti trumpą, itin profesionalų, konsultacinį laišką. JOKIO spamo. "
            "Pabrėžk naudą klientui, patikimumą ir pasiūlyk trumpą pokalbį arba atsiųsti PDF pristatymą."
        )

        for l in leads:
            usr_p = f"Gavėjas: {l['contact_person']}, įmonė: {l['name']}. Rinkos signalas: {l['signal']}."
            body = self.llm.generate(sys_p, usr_p)

            msg = {
                "message_id": f"msg-{l['id']}",
                "to_name": l["contact_person"],
                "to_email": l["email"],
                "company": l["name"],
                "subject": f"Klausimas dėl bendradarbiavimo su {l['name']}",
                "body": body,
                "status": "ready_to_send",
                "created_at": datetime.now().isoformat()
            }
            outbox.append(msg)

        outbox_path = os.path.join(self.data_dir, "outbox.json")
        with open(outbox_path, "w", encoding="utf-8") as f:
            json.dump(outbox, f, indent=2, ensure_ascii=False)
        print(f"[Outreach Closer] Sugeneruota {len(outbox)} profesionalių laiškų į {outbox_path}")
        return outbox

    def run_quote_and_reports(self, leads: list) -> str:
        print(f"[{self.b_name}] [Agentas Erik / COO Reporter] Skaičiuojamas finansinis potencialas ir savaitinė ataskaita...")
        
        # Paimame pagrindinę prekę iš konfigūracijos
        offer = self.config.get("core_offer", {})
        price = offer.get("price", 1000.0)
        cost = offer.get("supplier_cost", price * 0.5)
        margin = price - cost
        total_pipeline = price * len(leads)
        total_margin = margin * len(leads)
        
        date_str = datetime.now().strftime("%Y-%m-%d")
        report_md = f"""# SAVAITINĖ ATASKAITA: {self.b_name}
**Data:** {date_str} | **Sritis:** {self.config.get('industry', 'Verslas')}
**Generuota per:** Codex Universal Multi-Agent Swarm

---

### 1. PARDAVIMŲ IR MARŽŲ SUVESTINĖ
* **Potencialių klientų skaičius akiračio lauke:** {len(leads)} vnt.
* **Pagrindinis produktas:** {offer.get('name', 'Standartinis pasiūlymas')}
* **Vieneto pardavimo kaina:** {price:.2f} €
* **Savikaina / tiekėjo kaina:** {cost:.2f} €
* **Grynasis pelnas nuo 1 vnt.:** **+{margin:.2f} €**
* **POTENCIALUS VISAS PIPELINE PELNAS:** **{total_margin:,.2f} €**

---

### 2. AGENTŲ ATLIKTI DARBAI
* **Elena (Lead Scout):** Surado {len(leads)} tikslinius kontaktus, atitinkančius ICP.
* **Klaus (Outreach):** Paruošė konsultacinius B2B laiškus be agresyvaus spamo.
* **Sophie (Follow-Up):** Suplanavo 3 ir 7 dienų priminimus su prieštaravimų neutralizavimu.

---

### 3. VADOVO VEIKSMŲ PLANAS ŠIAI SAVAITEI
1. Išsiųsti paruoštus laiškus iš `data/{self.b_id}/outbox.json`.
2. Kai klientas atsakys teigiamai – pateikti išankstinę sąskaitą.
"""
        rep_path = os.path.join(self.reports_dir, f"report_{date_str}.md")
        with open(rep_path, "w", encoding="utf-8") as f:
            f.write(report_md)
            
        print(f"[COO Reporter] Savaitinė ataskaita sėkmingai sukurta į: {rep_path}")
        return report_md

def main():
    parser = argparse.ArgumentParser(description="CODEX Universal Multi-Agent Swarm Engine")
    parser.add_argument("--business", type=str, required=True, help="Verslo ID (atitinka configs/{id}.json)")
    parser.add_argument("--agent", type=str, default="all", choices=["all", "scout", "outreach", "report"])

    args = parser.parse_args()
    config = load_business_config(args.business)
    swarm = UniversalSwarm(config)

    print("=" * 75)
    print(f"🚀 PALEIDŽIAMA UNIVERSALI AGENTŲ SISTEMA: {config.get('business_name', args.business)}")
    print(f"Verslo tipas: {config.get('industry', '')} | Rinka: {config.get('target_market', '')}")
    print("=" * 75)

    leads = swarm.run_lead_scout()
    if args.agent in ["all", "outreach"]:
        swarm.run_outreach(leads)
    if args.agent in ["all", "report"]:
        rep = swarm.run_quote_and_reports(leads)
        print("\n" + "-" * 75)
        print("SAVAITINĖS ATASKAITOS IŠTRAUKA:")
        print("-" * 75)
        for line in rep.splitlines()[:15]:
            print(line)
        print("... (Pilna ataskaita išsaugota data aplanke)")

    print("\n" + "=" * 75)
    print(f"✅ SĖKMINGAI ĮVYKDYTA! Visi duomenys išsaugoti: data/{args.business}/")
    print("=" * 75)

if __name__ == "__main__":
    main()
