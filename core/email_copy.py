"""First-email copy by segment (ROADMAP C6, owner decision 2026-11-12).

Every email: 1) a concrete fact about THEM, 2) an honest calculated projection, 3) a 3-step
"how it works" anyone understands (4–5★ → public review; 1–3★ → first to the team),
4) one CTA with their name, 5) "14 days free, no card, no obligations, choose a plan only if
you like it" + free QR/NFC stand. Never: guarantees, invented numbers, competitor bashing,
quotes of negative reviews, "vadovui". Optional research facts (competitor, praise theme) are
used only when present; otherwise the sentence is skipped.
"""
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Same monthly pace as the owner demo projection (apps/reputationpro/src/components/owner-demo.tsx)
def monthly_pace(count: int) -> int:
    return 15 if count >= 150 else 8 if count >= 40 else 5


def projected_rating(rating: float, count: int, per_month: int, months: int) -> float:
    added = per_month * months
    return (rating * count + 5 * added) / (count + added)


def segment(rating, count) -> str:
    """top (≥4,8) | mid (4,5–4,79) | low (<4,5); 'few' = under 30 reviews (any rating)."""
    if count is not None and count < 30:
        return "few"
    if rating >= 4.8:
        return "top"
    if rating >= 4.5:
        return "mid"
    return "low"


GEN_PL = {"pacientai": "pacientų", "klientės": "klienčių", "vairuotojai": "vairuotojų", "svečiai": "svečių",
          "pirkėjai": "pirkėjų", "klientai": "klientų"}


def _genitive_number(n: int) -> bool:
    """Lithuanian: 10–20 and round tens take the genitive plural („15 pacientų“)."""
    return n % 10 == 0 or 11 <= n % 100 <= 19


def satisfied(n: int, many: str) -> str:
    """„5 patenkinti pacientai“ / „15 patenkintų pacientų“ / „1 patenkintas …“ (1 not used: pace ≥ 5)."""
    if _genitive_number(n):
        return f"{n} patenkintų {GEN_PL.get(many, many)}"
    return f"{n} patenkintos {many}" if many.endswith("ės") else f"{n} patenkinti {many}"


def reviews_acc(n: int) -> str:
    """Accusative after „turėtumėte“: 1 atsiliepimą, 2–9 atsiliepimus, 10–20/x0 atsiliepimų."""
    if _genitive_number(n):
        return f"{n} atsiliepimų"
    return f"{n} atsiliepimą" if n % 10 == 1 else f"{n} atsiliepimus"


NICHE = {
    #           who (one)     who (many)    where the QR goes
    "clinic":    ("pacientas", "pacientai", "registratūroje"),
    "beauty":    ("klientė", "klientės", "prie registratūros"),
    "auto":      ("vairuotojas", "vairuotojai", "prie kasos ar atsiėmus automobilį"),
    "horeca":    ("svečias", "svečiai", "ant sąskaitos ar staliuko"),
    "ecommerce": ("pirkėjas", "pirkėjai", "siuntinyje ar pristatymo laiške"),
    "services":  ("klientas", "klientai", "prie kasos ar SMS žinute"),
}


def _r(x: float) -> str:
    return f"{x:.1f}".replace(".", ",")


def _period(months: int) -> str:
    return {3: "per 3 mėnesius", 6: "per pusmetį", 12: "per metus"}[months]


def google_paragraphs(name: str, industry: str, rating: float, count: int, research: dict = None) -> list:
    """Paragraphs before the 'how it works' block for a business WITH a Google profile."""
    one, many, _where = NICHE.get(industry, NICHE["services"])
    research = research or {}
    seg = segment(rating, count)
    if seg == "top":
        p1 = (f"{name} turi puikų {_r(rating)}★ iš {count} atsiliepimų Google: tai jau lyderių lygis. "
              f"Dabar žmonės renkasi tarp kelių 4,8–5★ vietų, ir dažniausiai laimi ta, kurios atsiliepimų daugiau ir jie šviežesni.")
    elif seg == "mid":
        p1 = (f"{name} turi {_r(rating)}★ iš {count} atsiliepimų Google. Tai geras rezultatas, bet renkantis tarp kelių vietų "
              f"žmonės dažniausiai spaudžia tą, kuri turi 4,8★ ir daugiau.")
    elif seg == "low":
        p1 = (f"{name} turi {_r(rating)}★ iš {count} atsiliepimų Google. Dažniausiai taip nutinka ne dėl prasto darbo: "
              f"patenkinti {many} tyli, o nepatenkinti parašo pirmi.")
    elif rating >= 4.8:  # few, but excellent
        p1 = (f"{name} turi puikų {_r(rating)}★ iš {count} atsiliepimų Google. Įvertinimas puikus, bet atsiliepimų dar nedaug, "
              f"o žmonės labiau pasitiki vietomis, kurios jų turi dešimtis ar šimtus.")
    else:  # few
        p1 = (f"{name} turi {_r(rating)}★ iš {count} atsiliepimų Google. Kai atsiliepimų nedaug, "
              f"kiekvienas naujas stipriai keičia vaizdą, todėl rezultatą galima pakeisti greitai.")
    if research.get("praise_theme"):
        p1 += f" Atsiliepimuose klientai ypač mini: {research['praise_theme']}."
    comp = research.get("competitor")
    if comp and comp.get("name") and comp.get("rating") and comp.get("count"):
        p1 += f" Netoliese {comp['name']} turi {_r(comp['rating'])}★ iš {comp['count']}."

    pace = monthly_pace(count)
    months = 12
    for m in (3, 6, 12):  # shortest period that visibly moves the rating (≥ +0,1) or count
        if projected_rating(rating, count, pace, m) - rating >= 0.1:
            months = m
            break
    target = projected_rating(rating, count, pace, months)
    total = count + pace * months
    growth = round((total - count) / count * 100) if count else 0
    if target - rating >= 0.05:
        p2 = (f"Paskaičiavome: jei kas mėnesį atsiliepimą paliktų {satisfied(pace, many)}, "
              f"{_period(months)} turėtumėte apie {_r(target)}★ ir {reviews_acc(total)} (+{growth} %).")
    elif total >= count * 1.8:
        ratio = total / count
        times = ("beveik dvigubai daugiau" if ratio < 2 else "dvigubai daugiau" if ratio < 2.3
                 else "daugiau nei dvigubai" if ratio < 2.8 else f"apie {round(ratio)} kartus daugiau")
        p2 = (f"Paskaičiavome: jei kas mėnesį atsiliepimą paliktų {satisfied(pace, many)}, "
              f"{_period(months)} atsiliepimų būtų {times}: {total} vietoj {count}, o {_r(rating)}★ išliktų.")
    else:
        p2 = (f"Paskaičiavome: jei kas mėnesį atsiliepimą paliktų {satisfied(pace, many)}, "
              f"{_period(months)} atsiliepimų padaugėtų {growth} %: {total} vietoj {count}, o {_r(rating)}★ išliktų.")
    return [p1, p2]


def no_google_paragraphs(name: str, industry: str, rk_rating=None, rk_count=None) -> list:
    """Paragraphs for a business WITHOUT a Google profile (reviews go to Rekvizitai.lt for now)."""
    if rk_rating and rk_count:
        good = "puikų " if float(rk_rating) >= 8 else ""
        p1 = f"Rekvizitai.lt {name} turi {good}{_r(rk_rating)}/10 iš {rk_count} įvertinimų, bet Google žemėlapiuose Jūsų profilio neradome."
    else:
        p1 = f"Google žemėlapiuose {name} profilio neradome."
    p1 += " Ten ieškantys mato tik tas įmones, kurios turi žvaigždučių ir atsiliepimų."
    p2 = ("Gera žinia: pradėti galima jau šiandien. Kol susikursite Google profilį (nemokamai, apie 15 min.), "
          "patenkinti klientai bus nukreipiami į Jūsų Rekvizitai.lt, o vėliau tas pats QR kodas ims vesti į Google.")
    return [p1, p2]


def how_it_works(industry: str, platform: str = "Google") -> tuple:
    """(title, [3 steps]) – the value in plain words, so nobody closes the email without understanding it."""
    one, _many, where = NICHE.get(industry, NICHE["services"])
    return ("Kaip tai veikia (viskas jau paruošta, nieko diegti nereikia):", [
        f"{one.capitalize()} nuskenuoja QR kodą {where} arba gauna nuorodą SMS žinute.",
        f"Įvertina 4–5★ – vienu paspaudimu palieka atsiliepimą {platform}.",
        f"Įvertina 1–3★ – pastaba pirmiausia ateina Jūsų komandai, kad galėtumėte išspręsti, kol {one} neparašė viešai.",
    ])


OFFER = ("Išbandykite 14 dienų nemokamai: be banko kortelės ir be jokių įsipareigojimų. Jei patiks, planą pasirinksite patys. "
         "Aktyvavus atsiųsime ir nemokamą QR + NFC stovelį.")
