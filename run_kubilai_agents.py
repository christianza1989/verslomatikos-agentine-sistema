import argparse
import json
import os
import sys

# Užtikriname UTF-8 spausdinimą Windows terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.llm_client import LLMClient
from core.eu_lead_scout import EULeadScoutAgent
from core.multilingual_outreach import MultilingualOutreachAgent
from core.quote_followup import QuoteFollowUpAgent
from core.eu_logistics_coo import EULogisticsCOOAgent
from core.team_chat import TeamChatSimulator

def load_config(config_id: str) -> dict:
    base_dir = os.path.dirname(__file__)
    path = os.path.join(base_dir, "configs", f"{config_id}.json")
    if not os.path.exists(path):
        print(f"[KLAIDA] Konfigūracija nerasta: {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    parser = argparse.ArgumentParser(description="EUROPEAN HOT TUB EXPORT MULTI-AGENT SWARM")
    parser.add_argument("--business", type=str, default="kubilai_europa", help="Verslo konfigūracijos ID")
    parser.add_argument("--agent", type=str, default="all", choices=["all", "scout", "outreach", "quotes", "report"], help="Kokį agentą paleisti")

    args = parser.parse_args()
    config = load_config(args.business)
    llm = LLMClient()

    print("=" * 75)
    print(f"[START] PALEIDŽIAMI AI AGENTAI KUBILŲ PARDAVIMAMS EUROPOJE")
    print(f"Verslas: {config['business_name']}")
    print(f"Gamybos šalis: {config['origin_country']} | Eksporto rinkos: {', '.join(config['export_regions'][:3])} ir kt.")
    print("=" * 75)

    # 0. Virtualus biuras: Agentų tarpusavio rytinis pasitarimas
    chat = TeamChatSimulator(config)
    chat.run_collaboration_session()
    print("-" * 75)

    # 1. Elena - EU Lead Scout
    scout = EULeadScoutAgent(config, llm)
    leads = []
    if args.agent in ["all", "scout", "outreach", "quotes"]:
        leads = scout.scout_european_leads()

    # 2. Klaus - Multilingual Outreach
    outreach = MultilingualOutreachAgent(config, llm)
    if args.agent in ["all", "outreach"]:
        if leads:
            outreach.generate_campaign_messages(leads)

    # 3. Sophie - Quotes & Follow-Up
    quoter = QuoteFollowUpAgent(config, llm)
    if args.agent in ["all", "quotes", "report"]:
        if leads:
            quoter.generate_quotes_and_followups(leads)

    # 4. Erik - Logistics & Weekly COO Report
    coo = EULogisticsCOOAgent(config, llm)
    if args.agent in ["all", "report"]:
        rep = coo.generate_weekly_executive_report()
        print("\n" + "-" * 75)
        print("SAVAITINĖS EUROPOS EKSPORTO ATASKAITOS SANTRAUKA:")
        print("-" * 75)
        for line in rep.splitlines()[:20]:
            print(line)
        print("... (Pilna ataskaita išsaugota data/reports aplanke)")

    print("\n" + "=" * 75)
    print("[SEKME] VISI KUBILŲ PARDAVIMO AGENTAI SĖKMINGAI ĮVYKDĖ UŽDUOTIS!")
    print("Visi klientai, vokiški/angliški laiškai ir pelno skaičiavimai išsaugoti: data/")
    print("=" * 75)

if __name__ == "__main__":
    main()
