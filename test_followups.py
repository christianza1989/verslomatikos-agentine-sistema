"""Follow-up agento logikos testai (ROADMAP C3). Paleidimas: python test_followups.py"""
import datetime as dt
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from core.followup_runner import build_followup, business_days_between, in_send_window, next_step, render

D = dt.datetime
mon = D(2026, 11, 2, 9, 0)  # pirmadienis
checks = []


def check(name, cond):
    checks.append((name, bool(cond)))


# Darbo dienos
check("Pn→Pr = 1 darbo diena", business_days_between(D(2026, 11, 6, 10), D(2026, 11, 9, 10)) == 1)
check("Šeštadienį nesiunčiame", not in_send_window(D(2026, 11, 7, 10)))
check("Pirmadienį 09:00 siunčiame", in_send_window(mon))
check("Vakare nesiunčiame", not in_send_window(D(2026, 11, 2, 18)))

# Šaltas kelias: B1 po 3 darbo dienų, F po 7 darbo dienų nuo B1
check("Šaltas: per anksti", next_step(mon, None, {}, D(2026, 11, 4, 9)) is None)
check("Šaltas: B1 ketvirtadienį", next_step(mon, None, {}, D(2026, 11, 5, 9)) == "B1")
check("Šaltas: F po 7 d.d. nuo B1", next_step(mon, None, {"B1": D(2026, 11, 5, 9)}, D(2026, 11, 16, 9)) == "F")
check("Šaltas: F ne anksčiau", next_step(mon, None, {"B1": D(2026, 11, 5, 9)}, D(2026, 11, 13, 9)) is None)

# Karštas kelias: H1 ≥20 val. po peržiūros ir kitą darbo dieną
view = D(2026, 11, 2, 15, 0)
check("Karštas: ne tą pačią dieną", next_step(mon, view, {}, D(2026, 11, 2, 16)) is None)
check("Karštas: H1 po 20 val.", next_step(mon, view, {}, D(2026, 11, 3, 11)) == "H1")
check("Karštas: H2 po 3 d.d. nuo H1", next_step(mon, view, {"H1": D(2026, 11, 3, 11)}, D(2026, 11, 6, 9)) == "H2")
check("Karštas: F po 5 d.d. nuo H2", next_step(mon, view, {"H1": D(2026, 11, 3), "H2": D(2026, 11, 6)}, D(2026, 11, 13, 9)) == "F")

# Šaltas → karštas: B1, H1, tada F (H2 praleidžiamas dėl 3 follow-up'ų ribos)
check("B1→karštas→H1", next_step(mon, D(2026, 11, 6, 10), {"B1": D(2026, 11, 5, 9)}, D(2026, 11, 9, 10)) == "H1")
check("B1+H1→F (ne H2)", next_step(mon, D(2026, 11, 6, 10), {"B1": D(2026, 11, 5), "H1": D(2026, 11, 9)}, D(2026, 11, 20, 9)) == "F")

# Po F nieko
check("Po F – stop", next_step(mon, view, {"H1": D(2026, 11, 3), "H2": D(2026, 11, 6), "F": D(2026, 11, 13)}, D(2026, 12, 30)) is None)

# Turinys
links = {"activate": "https://x/aktyvuoti/T", "demo": "https://x/r/s?k=T"}
for industry in ("clinic", "ecommerce", "services"):
    lead = {"business_name": "Testas", "slug": "testas", "industry": industry}
    for step in ("B1", "H1", "H2", "F"):
        p, label, url = build_followup(step, lead, links, D(2026, 12, 5))
        text, html = render(p, label, url)
        check(f"{industry}/{step}: be '100%'/'niekada'", "100%" not in text and "niekada" not in text.lower())
        check(f"{industry}/{step}: vienas CTA", html.count("<a href=") == 1)
        check(f"{industry}/{step}: trumpas (<130 žodžių)", len(text.split()) < 130)
p, _, _ = build_followup("F", {"business_name": "T", "slug": "t", "industry": "clinic"}, links, D(2026, 12, 5))
check("F rodo tikrą galiojimo datą", any("gruodžio 5 d." in x for x in p if isinstance(x, str)))
p, _, url = build_followup("B1", {"business_name": "T", "slug": "t", "industry": "clinic"}, links, D(2026, 12, 5))
check("B1 veda į demo, ne į aktyvavimą", url == links["demo"])

bad = [n for n, ok in checks if not ok]
for n, ok in checks:
    print(("OK   " if ok else "FAIL ") + n)
print(f"\n{len(checks) - len(bad)}/{len(checks)} OK")
sys.exit(1 if bad else 0)
