"""Daugianišis lead'ų rezervuaras 5 ReputationPro agentams.
Sujungia odontologijos katalogą, e-komercijos katalogą ir b2b_leads_master.json,
kad kiekvienas agentas (Laura, Kamilė, Marius, Justas, Tomas) gautų tik savo industrijos nekontaktuotus kontaktus.
"""
import os
import json
import sqlite3
from typing import List, Dict, Any
from core.dental_lead_pool import DENTAL_CLINICS_CATALOG, slugify, get_already_contacted_emails
from core.ecommerce_lead_pool import ECOMMERCE_LEADS_CATALOG

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")
MASTER_LEADS_PATH = os.path.join(BASE_DIR, "data", "b2b_leads_master.json")

def load_master_leads() -> List[Dict[str, Any]]:
    if not os.path.exists(MASTER_LEADS_PATH):
        return []
    try:
        with open(MASTER_LEADS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Lead Pool Load Error] {e}")
        return []

def get_uncontacted_leads_for_agent(target_industry: str, limit: int = 25, agent_id: str = "") -> List[Dict[str, Any]]:
    """
    Grąžina paruoštus, dar nekontaktuotus kontaktus pagal agento industriją.
    Kai keli agentai (pvz., Tomas ir Marius) dirba toje pačioje industrijose (klinikos),
    sąrašas padalijamas tolygiai pagal agent_id, kad jie nesikirstų tarpusavyje.
    """
    already_contacted = get_already_contacted_emails()
    raw_pool = []
    ind = target_industry.lower()
    master = load_master_leads()

    if ind in ("clinic", "dental"):
        raw_pool.extend(DENTAL_CLINICS_CATALOG)
        raw_pool.extend([l for l in master if l.get("niche") in ("odontologija", "veterinarija")])
    elif ind in ("ecommerce", "ecom"):
        raw_pool.extend(ECOMMERCE_LEADS_CATALOG)
        raw_pool.extend([l for l in master if l.get("niche") in ("baldai", "dovanos")])
    elif ind in ("beauty", "grozis", "estetika"):
        raw_pool.extend([l for l in master if l.get("niche") in ("estetika", "spa_viesbuciai")])
    elif ind in ("auto", "autoservisai"):
        raw_pool.extend([l for l in master if l.get("niche") == "autoservisai"])
    elif ind in ("horeca", "restoranai"):
        raw_pool.extend([l for l in master if l.get("niche") in ("spa_viesbuciai", "restoranai", "horeca")])
    else:
        # mixed / bendras
        raw_pool.extend(master)
        raw_pool.extend(DENTAL_CLINICS_CATALOG[:20])
        raw_pool.extend(ECOMMERCE_LEADS_CATALOG[:20])

    fresh = []
    seen_in_batch = set()

    for item in raw_pool:
        email = (item.get("email") or "").strip().lower()
        if not email or "@" not in email:
            continue
        # Etapas N: one address may serve several branches (info@ in Kaunas and Vilnius) – keep each branch.
        batch_key = (email, (item.get("city") or "").strip().lower())
        if email in already_contacted or batch_key in seen_in_batch:
            continue

        b_name = item.get("business_name") or "Įmonė"
        city = item.get("city") or "Vilnius"
        slug = item.get("slug") or slugify(b_name)

        lead_obj = {
            "id": f"lead-{slug}",
            "business_name": b_name,
            "city": city,
            "email": email,
            "website": item.get("website", ""),
            "role": item.get("role", "Vadovui"),
            "pain_point": item.get("pain_point", "klientų atsiliepimai"),
            "hook": item.get("hook", "kaip padidinti 5.0★ Google reitingą"),
            "niche": item.get("niche") or ind,
            "industry": ind,
            "slug": slug,
            "preview_url": f"https://reputacija.verslomatika.lt/r/{slug}",
            "qr_url": f"https://reputacija.verslomatika.lt/api/qr?slug={slug}",
            "claim_url": f"https://reputacija.verslomatika.lt/checkout?slug={slug}"
        }
        fresh.append(lead_obj)
        seen_in_batch.add(batch_key)

    # Padalijimas tarp aktyvių agentų toje pačioje nišoje
    if agent_id == "agent-tomas":
        selected = [x for i, x in enumerate(fresh) if i % 2 == 0]
    elif agent_id == "agent-marius":
        selected = [x for i, x in enumerate(fresh) if i % 2 == 1]
    else:
        selected = fresh

    return selected[:limit]


def all_catalog_leads() -> List[Dict[str, Any]]:
    """Every lead from every catalog (Etapas N): a company's branches may sit in different
    niche lists (e.g. Melga Kaunas in the e-commerce catalog, Vilnius in auto services)."""
    out, seen = [], set()
    for item in list(DENTAL_CLINICS_CATALOG) + list(ECOMMERCE_LEADS_CATALOG) + load_master_leads():
        email = (item.get("email") or "").strip().lower()
        if "@" not in email:
            continue
        b_name = item.get("business_name") or "Įmonė"
        city = item.get("city") or "Vilnius"
        key = (email, city.strip().lower(), b_name.strip().lower())
        if key in seen:
            continue
        seen.add(key)
        out.append({"business_name": b_name, "city": city, "email": email, "website": item.get("website", ""),
                    "phone": item.get("phone", ""), "slug": item.get("slug") or slugify(b_name),
                    "industry": item.get("niche") or "", "niche": item.get("niche") or ""})
    return out
