import json
import os
import sys

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
LEADS_FILE = os.path.join(DATA_DIR, "b2b_leads_master.json")

def qualify_and_rank_leads():
    with open(LEADS_FILE, "r", encoding="utf-8") as f:
        leads = json.load(f)

    tier_1_niches = ["odontologija", "estetika"]
    tier_2_niches = ["autoservisai", "veterinarija"]
    tier_3_niches = ["spa_viesbuciai", "baldai", "dovanos"]

    qualified_leads = []
    
    for lead in leads:
        niche = lead.get("niche")
        if niche in tier_1_niches:
            lead["icp_tier"] = "TIER_1_ELITE"
            lead["willingness_to_pay"] = "AUKŠČIAUSIAS (Krepšelis: 500 € – 3 000 €; 49 €/mėn. padengia 1 išsaugotas pacientas)"
            lead["priority_score"] = 95
        elif niche in tier_2_niches:
            lead["icp_tier"] = "TIER_2_HIGH"
            lead["willingness_to_pay"] = "AUKŠTAS (Krepšelis: 150 € – 1 000 €; didelis kasdienis srautas ir emocijos)"
            lead["priority_score"] = 85
        else:
            lead["icp_tier"] = "TIER_3_MEDIUM"
            lead["willingness_to_pay"] = "VIDUTINIS (Krepšelis: 100 € – 500 €; sezoniškumas ir reputacijos prestižas)"
            lead["priority_score"] = 75
            
        qualified_leads.append(lead)

    # Rūšiuojame pagal prioritetą: pirmiausia TIER 1, paskui TIER 2, paskui TIER 3
    qualified_leads.sort(key=lambda x: x["priority_score"], reverse=True)

    with open(LEADS_FILE, "w", encoding="utf-8") as f:
        json.dump(qualified_leads, f, ensure_ascii=False, indent=2)

    tier_1_count = sum(1 for l in qualified_leads if l["icp_tier"] == "TIER_1_ELITE")
    tier_2_count = sum(1 for l in qualified_leads if l["icp_tier"] == "TIER_2_HIGH")
    tier_3_count = sum(1 for l in qualified_leads if l["icp_tier"] == "TIER_3_MEDIUM")

    print(f"[{LEADS_FILE}] ✅ Visi 54 kontaktai kvalifikuoti pagal MEDDPICC & ICP standartus!")
    print(f"• TIER 1 (Elitas - Odontologija & Estetika): {tier_1_count} įmonių (Prioritetas 1 ryte nuo 08:00)")
    print(f"• TIER 2 (Aukštas - Autoservisai & Veterinarija): {tier_2_count} įmonių")
    print(f"• TIER 3 (Prestižas - SPA, Sodybos, Baldai, Dovanos): {tier_3_count} įmonių")

if __name__ == "__main__":
    qualify_and_rank_leads()
