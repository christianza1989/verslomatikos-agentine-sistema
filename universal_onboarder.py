import argparse
import json
import os
import sys

# Užtikriname UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.llm_client import LLMClient

def generate_business_profile(name: str, niche: str, product: str, price: float, target_market: str, b2b_or_b2c: str) -> dict:
    """
    Automatiškai sukuria pilną verslo konfigūraciją bet kokiam naujam verslui.
    """
    llm = LLMClient()
    business_id = name.lower().replace(" ", "_").replace("ą", "a").replace("č", "c").replace("ę", "e").replace("ė", "e").replace("į", "i").replace("š", "s").replace("ų", "u").replace("ū", "u").replace("ž", "z")

    sys_prompt = (
        "Tu esi Universalaus Verslo Automatizavimo Architektas (Codex Multi-Agent Architect). "
        "Tavo užduotis: iš vartotojo pateiktų duomenų sugeneruoti išsamų, profesionalų verslo JSON profilį agentams. "
        "Atsakyk TIK švariu JSON be jokių papildomų komentarų."
    )
    
    usr_prompt = f"""
    Verslo pavadinimas: {name}
    Niša / veikla: {niche}
    Pagrindinė prekė ar paslauga: {product}
    Kaina (EUR): {price}
    Tikslinė rinka / šalys: {target_market}
    Modelis: {b2b_or_b2c}

    Sukonfigūruok JSON su šiais laukais:
    - business_id (string)
    - business_name (string)
    - industry (string)
    - business_type (b2b arba b2c arba hybrid)
    - target_market (string)
    - brand_voice (string)
    - core_offer (objektas su name, price, specs, supplier_or_delivery_cost)
    - target_audiences (masyvas su 2-3 tikslinėmis grupėmis ir jų skauduliais)
    - objections_and_answers (2 pagrindinės pirkėjo baimės ir atsakymai į jas)
    """

    print(f"[UNIVERSALUS ONBOARDER] Analizuojamas verslas: '{name}' ({niche})...")
    raw_response = llm.generate(sys_prompt, usr_prompt)

    try:
        # Išvalome galimas markdown žymes ```json ... ```
        clean_json_str = raw_response.strip()
        if clean_json_str.startswith("```json"):
            clean_json_str = clean_json_str[7:]
        if clean_json_str.startswith("```"):
            clean_json_str = clean_json_str[3:]
        if clean_json_str.endswith("```"):
            clean_json_str = clean_json_str[:-3]
        clean_json_str = clean_json_str.strip()
        
        profile = json.loads(clean_json_str)
    except Exception:
        # Atsarginis stabilus profilis, jei LLM offline režime
        profile = {
            "business_id": business_id,
            "business_name": name,
            "industry": niche,
            "business_type": b2b_or_b2c,
            "target_market": target_market,
            "brand_voice": "Profesionalus, patikimas, orientuotas į kliento vertę",
            "core_offer": {
                "name": product,
                "price": price,
                "specs": f"Pagrindinis {product} sprendimas {niche} srityje.",
                "supplier_cost": round(price * 0.5, 2)
            },
            "target_audiences": [
                {
                    "name": "Pagrindiniai B2B ar B2C pirkėjai",
                    "pain_point": f"Ieško kokybiško {product} už konkurencingą kainą tiesiai iš patikimo šaltinio."
                }
            ],
            "objections_and_answers": {
                "trust": f"Kodėl verta pasitikėti? Teikiame kokybės garantiją ir pilną palaikymą.",
                "price": f"Kodėl verta investuoti? {product} greitai atsiperka ir padeda pasiekti geresnių rezultatų."
            }
        }

    # Išsaugome į configs/
    base_dir = os.path.dirname(__file__)
    config_path = os.path.join(base_dir, "configs", f"{business_id}.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)

    print(f"[SEKMĖ] Verslo profilis sugeneruotas ir išsaugotas į: {config_path}")
    print(f"Dabar galite paleisti agentus šiam verslui komanda:\npython universal_orchestrator.py --business {business_id} --agent all")
    return profile

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Universalaus Naujo Verslo Onboarderis")
    parser.add_argument("--name", type=str, required=True, help="Verslo pavadinimas (pvz. 'Modernūs Baldai')")
    parser.add_argument("--niche", type=str, required=True, help="Niša (pvz. 'Ąžuoliniai valgomojo stalai')")
    parser.add_argument("--product", type=str, required=True, help="Pagrindinis produktas ar paslauga")
    parser.add_argument("--price", type=float, default=100.0, help="Kaina eurais")
    parser.add_argument("--market", type=str, default="Lietuva ir Europa", help="Rinka / Šalys")
    parser.add_argument("--type", type=str, default="B2B ir B2C", help="B2B, B2C arba Hybrid")

    args = parser.parse_args()
    generate_business_profile(args.name, args.niche, args.product, args.price, args.market, args.type)
