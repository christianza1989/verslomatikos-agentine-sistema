import os
import sys
import json
from datetime import datetime

# Užtikriname UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def get_holding_summary():
    base_dir = os.path.dirname(__file__)
    configs_dir = os.path.join(base_dir, "configs")
    data_dir = os.path.join(base_dir, "data")

    businesses = []
    total_pipeline_val = 0.0
    total_margin_val = 0.0

    print("=" * 80)
    print("🏢 CENTRAL AI HOLDING REPORT | VISŲ VERSLŲ BENDRA SUVESTINĖ")
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 80)

    config_files = [f for f in os.listdir(configs_dir) if f.endswith(".json") and not f.startswith("template")]

    for cfg_f in config_files:
        path = os.path.join(configs_dir, cfg_f)
        with open(path, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        b_id = cfg.get("business_id", cfg_f.replace(".json", ""))
        b_name = cfg.get("business_name", b_id)
        industry = cfg.get("industry", "Veikla")

        # Tikriname ar yra sugeneruotų duomenų
        b_data_dir = os.path.join(data_dir, b_id)
        leads_count = 0
        if os.path.exists(os.path.join(b_data_dir, "leads.json")):
            with open(os.path.join(b_data_dir, "leads.json"), "r", encoding="utf-8") as lf:
                leads_count = len(json.load(lf))
        elif b_id == "kubilai_europa" and os.path.exists(os.path.join(data_dir, "leads_europe.json")):
            with open(os.path.join(data_dir, "leads_europe.json"), "r", encoding="utf-8") as lf:
                leads_count = len(json.load(lf))

        # Skaičiuojame apytiksles vertes
        if b_id == "kubilai_europa":
            pipe = 15910.0
            margin = 6400.0
        elif b_id == "memocasting":
            pipe = 1980.5
            margin = 1200.0
        elif "core_offer" in cfg:
            price = cfg["core_offer"].get("price", 100.0)
            cost = cfg["core_offer"].get("supplier_cost", price * 0.5)
            pipe = price * max(1, leads_count)
            margin = (price - cost) * max(1, leads_count)
        else:
            pipe = 1000.0
            margin = 500.0

        total_pipeline_val += pipe
        total_margin_val += margin

        businesses.append({
            "name": b_name,
            "id": b_id,
            "industry": industry,
            "leads": leads_count,
            "pipeline": pipe,
            "margin": margin
        })

    # Spausdiname lentelę
    print(f"{'Verslo Pavadinimas':<32} | {'Sritis':<28} | {'Pasiūlymai':<12} | {'Grynasis Pelnas'}")
    print("-" * 95)
    for b in businesses:
        print(f"{b['name'][:30]:<32} | {b['industry'][:26]:<28} | {b['pipeline']:>9.2f} € | \033[92m+{b['margin']:>9.2f} €\033[0m")

    print("=" * 95)
    print(f"💰 BENDRAS VISŲ VERSLŲ AKTYVUS PIPELINE: {total_pipeline_val:,.2f} €")
    print(f"🎯 BENDRAS PROJEKTUOJAMAS GRYNASIS PELNAS: +{total_margin_val:,.2f} €")
    print("=" * 95)

if __name__ == "__main__":
    get_holding_summary()
