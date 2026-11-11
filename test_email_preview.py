"""Laiško peržiūra be siuntimo (ROADMAP C1, C5). Paleidimas: python test_email_preview.py

Tikrina pagrindinį laišką ir visus temų variantus (atvejis × A/B/C) pagal tas pačias taisykles.
"""
import re
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.dental_lead_pool import get_uncontacted_dental_leads
from core.morning_campaign_runner import build_tracked_email, APP_BASE, SUBJECT_VARIANTS, SUBJECT_CASES

leads = get_uncontacted_dental_leads(5)
print(f"Sample leads loaded: {len(leads)}")
lead = leads[0]
demo_url = f"{APP_BASE}/r/{lead['slug']}?k=PERZIURA"
subj, text, html = build_tracked_email(lead, "preview-lead-123", demo_url, {"rating": 4.6, "count": 87})

print("\n=== EMAIL SUBJECT ===")
print(subj)
print("\n=== TEXT VERSION ===")
print(text)

checks = {
    "Vienas CTA per sekimo nuorodą": html.count("/api/track/click?") == 1,
    "CTA veda į asmeninį demo su tokenu": "%2Fr%2F" in html and "k%3DPERZIURA" in html,
    "Sekimas per aplikacijos domeną": f"{APP_BASE}/api/track/open?id=" in html,
    "Nėra el. pašto URL'e": lead["email"] not in html.split("mailto:")[0],
    "Nėra senų pažadų (100% / NIEKADA)": "100%" not in text and "NIEKADA" not in text,
    "Taisyklingas kreipinys": text.startswith("Laba diena,"),
    "Atsisakymo galimybė": "atsakykite „ne“" in text,
    "Įmonės pavadinimas": lead["business_name"] in text,
}

# --- ROADMAP C5: visi temų variantai ---
CASE_ARGS = {
    "google_stats": dict(google_stats={"rating": 4.6, "count": 395}),
    "google_generic": dict(google_stats={}),
    "no_google": dict(no_google=True, rk_stats={"rating": 8.3, "count": 19}),
    "branches": dict(google_stats={"rating": 4.8, "count": 120}, company_cities=["Vilnius", "Kaunas", "Klaipėda"]),
}
NAMES = ["Vilniaus Denta", "Odontologijos klinika „Šypsena“", "Autoservisas Ratas"]
print("\n=== TEMŲ VARIANTAI ===")
seen = set()
for case, args in CASE_ARGS.items():
    for v in SUBJECT_VARIANTS:
        for n in NAMES:
            l = {**lead, "business_name": n}
            s, t, h, label = build_tracked_email(l, "lead-x", demo_url, variant=v, return_variant=True, **args)
            if n == NAMES[0]:
                print(f"  {SUBJECT_CASES[case]:<26} {v}: {s}  ({len(s)} simb.)")
            seen.add(label)
            low = s.lower()
            problems = [msg for ok, msg in [
                (label == f"{case}:{v}", f"žymė {label}"),
                (n in s, "nėra įmonės pavadinimo"),
                ("100%" not in s and "niekada" not in low, "100% / niekada"),
                ("!" not in s, "šauktukas"),
                (not re.search(r"\b[A-ZĄČĘĖĮŠŲŪŽ]{4,}\b", s.replace(n, "")), "didžiosios raidės"),
                (len(s) - len(n) <= 50, f"per ilga ({len(s) - len(n)} simb. be pavadinimo)"),
                (h.count("/api/track/click?") == 1, "ne vienas CTA"),
                ("verslomatika.lt/r/" not in h.replace("reputacija.verslomatika.lt", ""), "senas domenas"),
            ] if not ok]
            checks[f"Tema {case}:{v} ({n[:18]})"] = not problems
            if problems:
                print(f"  FAIL {case}:{v} „{s}“: {', '.join(problems)}")
checks["Visi 12 variantų sugeneruoti"] = len(seen) == len(CASE_ARGS) * len(SUBJECT_VARIANTS)
_, _, _, lbl1 = build_tracked_email(lead, "lead-stable", demo_url, return_variant=True)
_, _, _, lbl2 = build_tracked_email(lead, "lead-stable", demo_url, return_variant=True)
checks["Variantas stabilus tam pačiam lead'ui"] = lbl1 == lbl2
s1, *_ = build_tracked_email(lead, "x", demo_url, {"rating": 4.6, "count": 21}, variant="A")
checks["Gramatika: „iš 21 atsiliepimo“"] = "iš 21 atsiliepimo Google" in s1

print("\n=== CHECKS ===")
for name, ok in checks.items():
    print(("OK   " if ok else "FAIL ") + name)
sys.exit(0 if all(checks.values()) else 1)
