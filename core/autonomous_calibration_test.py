import os
import sys
import json
import uuid
import sqlite3
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Reconfigure terminal for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

from core.accounting_responder import classify_and_generate_reply
from core.accounting_pricing import calculate_accounting_price, lithuanian_number_to_words
from core.invoice_generator import generate_invoice_pdf
from core.accounting_pipeline import AccountingPipeline

class MockSMTP:
    def __init__(self):
        self.sent_emails = []

    def send_email(self, recipient: str, subject: str, body_text: str, attachment_paths: List[str] = None) -> bool:
        self.sent_emails.append({
            "recipient": recipient,
            "subject": subject,
            "body_text": body_text,
            "attachments": attachment_paths or []
        })
        return True

def run_calibration_suite():
    print("=" * 80)
    print("🚀 PRADEDAMAS AUTONOMINIS BUHALTERIJOS AI AGENTŲ KALIBRAVIMO IR STRESO TESTAS")
    print("=" * 80)

    test_results = []

    # -------------------------------------------------------------------------
    # ARCHETIPAS 1: Visiškai žalias / Pasimetęs pradedantysis ("Ką daryti?")
    # -------------------------------------------------------------------------
    print("\n[TEST 1/6] Archetipas: Visiškai žalias pradedantysis (MB 'Šviesos Idėjos')")
    client_name = "Mantas"
    company_name = "MB Šviesos Idėjos"
    inbound_text = "Laba diena, gavau Jūsų laišką, bet aš visiškai nieko nesuprantu apie buhalteriją, kas tas balansas ir ką man dabar daryti? Ar aš turiu kažką mokėti? Labai bijau VMI baudų."
    
    reply, waiting_for, meta = classify_and_generate_reply(inbound_text, client_name, company_name, has_documents=False)
    
    # Tikrinimai
    has_call_offer = "susisieksime su jumis nurodytu numeriu" in reply.lower() or meta.get("call_requested") == 1
    explains_1_step = "banko sąskaitos išrašą" in reply.lower() or "bandomąjį balansą" in reply.lower()
    explains_free = "100% nemokamas" in reply.lower() or "nemokamai" in reply.lower()
    no_patronizing = "žmonių kalba" not in reply.lower()

    passed_1 = (not has_call_offer) and explains_1_step and explains_free and no_patronizing
    test_results.append({
        "archetype": "1. Visiškai žalias pradedantysis",
        "passed": passed_1,
        "details": f"Nesiūlo skambučio per anksti: {not has_call_offer}, Paaiškina 1 žingsnį: {explains_1_step}, Nemokamas auditas: {explains_free}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_1 else 'FAIL'} | Topic: {meta.get('topic')}")

    # -------------------------------------------------------------------------
    # ARCHETIPAS 2: Skeptikas vadovas ("Iš kur skaičiai? Kodėl nuostolis?")
    # -------------------------------------------------------------------------
    print("\n[TEST 2/6] Archetipas: Skeptikas vadovas (UAB 'Nordic Logistika')")
    client_name = "Robertas"
    company_name = "UAB Nordic Logistika"
    inbound_text = "Iš kur jūs ištraukėte, kad mano įmonė nuostolinga? Mano banko sąskaitoje yra 45 000 eurų, mano buhalterė sakė, kad dirbame pelningai! Ar čia ne klaida jūsų skaičiavimuose?"
    
    reply, waiting_for, meta = classify_and_generate_reply(inbound_text, client_name, company_name, has_documents=True)
    
    cites_vas_accrual = "kaupimo principas" in reply.lower() or "5 klasės" in reply.lower()
    cites_pmi_30 = "pmį 30" in reply.lower() or "mokesčių skydas" in reply.lower()
    has_signature = "lilija zapasnik" in reply.lower() and "25 m. patirtis" in reply.lower()
    no_call_offer = meta.get("call_requested") != 1

    passed_2 = cites_vas_accrual and cites_pmi_30 and has_signature and no_call_offer
    test_results.append({
        "archetype": "2. Skeptikas vadovas dėl skaičių",
        "passed": passed_2,
        "details": f"VAS kaupimo principas: {cites_vas_accrual}, PMĮ 30 mokesčių skydas: {cites_pmi_30}, Parašas: {has_signature}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_2 else 'FAIL'} | Topic: {meta.get('topic')}")

    # -------------------------------------------------------------------------
    # ARCHETIPAS 3: Kainos derybininkas ("Kodėl tokia kaina? Ar galima pigiau?")
    # -------------------------------------------------------------------------
    print("\n[TEST 3/6] Archetipas: Kainos derybininkas (MB 'Kodo Architektai')")
    client_name = "Deividas"
    company_name = "MB Kodo Architektai"
    inbound_text = "Kodėl pas jus kaina yra 190 eurų, o ne 70 eurų? Kodėl vienokia įmonė moka tiek, o kitokia tiek? Kokia čia pas jus kainos logika, paaiškinkite ar galima pigiau?"
    
    reply, waiting_for, meta = classify_and_generate_reply(inbound_text, client_name, company_name, has_documents=False)
    
    explains_tiers = "mikro įmonė" in reply.lower() and "smulki auganti įmonė" in reply.lower()
    explains_free_initial = "100% nemokamas" in reply.lower()
    explains_addons = "tarptautinė prekyba" in reply.lower() or "es sandoriai" in reply.lower()

    passed_3 = explains_tiers and explains_free_initial and explains_addons
    test_results.append({
        "archetype": "3. Kainodaros derybininkas",
        "passed": passed_3,
        "details": f"Pakopų išaiškinimas: {explains_tiers}, Bazinė kaina vs priedai: {explains_addons}, Pirminis nemokamas: {explains_free_initial}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_3 else 'FAIL'} | Topic: {meta.get('topic')}")

    # -------------------------------------------------------------------------
    # ARCHETIPAS 4: Neigiamas kapitalas ("Ar mus likviduos Registrų centras?")
    # -------------------------------------------------------------------------
    print("\n[TEST 4/6] Archetipas: Neigiamo kapitalo krizė (MB 'Ateities Projektai')")
    client_name = "Gintarė"
    company_name = "MB Ateities Projektai"
    inbound_text = "Mano buhalterė pasakė, kad mūsų nuosavas kapitalas yra neigiamas (-12 000 €). Ar mus likviduos Registrų centras? Ką daryti su neigiamu kapitalu iki metų galo?"
    
    reply, waiting_for, meta = classify_and_generate_reply(inbound_text, client_name, company_name, has_documents=True)
    
    explains_inasi = "narių įnašai" in reply.lower() or "įnašai nuostoliams dengti" in reply.lower()
    explains_paskola = "paskolos konvertavimas" in reply.lower() or "paskolą" in reply.lower()
    no_panic = "3 teisėti būdai" in reply.lower()

    passed_4 = explains_inasi and explains_paskola and no_panic
    test_results.append({
        "archetype": "4. Neigiamo kapitalo krizė",
        "passed": passed_4,
        "details": f"Įnašų dengimas: {explains_inasi}, Paskolos konvertavimas: {explains_paskola}, 3 sprendimai: {no_panic}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_4 else 'FAIL'} | Topic: {meta.get('topic')}")

    # -------------------------------------------------------------------------
    # ARCHETIPAS 5: Didelė UAB su tarptautine prekyba ir CSV analize
    # -------------------------------------------------------------------------
    print("\n[TEST 5/6] Archetipas: Didelė UAB e-komercija su CSV (UAB 'Global Baltic Trade')")
    uab_accounts = {
        "500": {"credit": 185000.0, "name": "Pardavimo pajamos"},
        "5003": {"credit": 24500.0, "name": "ES prekyba (Amazon/Shopify)"},
        "24412": {"debit": 3800.0, "name": "Importo PVM"},
        "6114": {"debit": 28400.0, "name": "Darbo užmokestis 4 darbuotojai"},
        "1200": {"debit": 8500.0, "name": "Ilgalaikis turtas"},
        "631204": {"debit": 2100.0, "name": "Neleidžiami atskaitymai"}
    }
    pricing_uab = calculate_accounting_price(turnover=185000.0, parsed_accounts=uab_accounts, company_type="UAB")
    
    is_tier_3 = pricing_uab["tier_code"] == "tier_3_medium"
    base_is_240 = pricing_uab["base_price"] == 240.0
    has_intl_addon = any("tarptautin" in it["title"].lower() for it in pricing_uab["line_items"])
    has_du_addon = any("darbo užmokesčio" in it["title"].lower() for it in pricing_uab["line_items"])
    total_is_expected = pricing_uab["total_price"] == (240.0 + 30.0 + 30.0 + 20.0) # 320 €
    words_correct = "trys šimtai dvidešimt eurų" in pricing_uab["suma_zodziais"].lower()

    # Patikriname sąskaitos-faktūros PDF generavimą lygiai 1 psl.
    inv_pdf = generate_invoice_pdf(
        invoice_number="LZ-2026-CALIB",
        client_name="Karolis",
        client_company="UAB Global Baltic Trade",
        client_email="karolis@globalbaltic.lt",
        amount=pricing_uab["total_price"],
        line_items=pricing_uab["line_items"],
        suma_zodziais=pricing_uab["suma_zodziais"]
    )
    
    import pypdf
    reader = pypdf.PdfReader(inv_pdf)
    is_single_page = len(reader.pages) == 1

    passed_5 = is_tier_3 and base_is_240 and has_intl_addon and has_du_addon and is_single_page and words_correct
    test_results.append({
        "archetype": "5. Didelė UAB e-komercija su dinamine SF",
        "passed": passed_5,
        "details": f"Tier 3: {is_tier_3}, Bazinė 240 €: {base_is_240}, Priedai suderinti (320 €): {total_is_expected}, Suma žodžiais: {words_correct}, SF lygiai 1 psl: {is_single_page}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_5 else 'FAIL'} | Suma: {pricing_uab['total_price']} € ({pricing_uab['suma_zodziais']}), SF psl: {len(reader.pages)}")

    # -------------------------------------------------------------------------
    # ARCHETIPAS 6: Ekstra atvejis – Klientas tiesiogiai reikalauja skambučio
    # -------------------------------------------------------------------------
    print("\n[TEST 6/6] Archetipas: Ekstra atvejis – Tiesioginis skambučio prašymas (UAB 'Statybų Rangovas')")
    client_name = "Saulius"
    company_name = "UAB Statybų Rangovas"
    inbound_text = "Sveiki, man per daug sudėtinga skaityti visus šituos tekstus, prašau būtinai man paskambinkite numeriu +370 655 44332, noriu pasikalbėti gyvai telefonu šiandien."
    
    reply, waiting_for, meta = classify_and_generate_reply(inbound_text, client_name, company_name, has_documents=False)
    
    triggers_call = meta.get("call_requested") == 1
    finds_phone = "65544332" in str(meta.get("phone", ""))
    confirms_time = "kelintą valandą jums būtų patogiausia" in reply.lower()

    passed_6 = triggers_call and finds_phone and confirms_time
    test_results.append({
        "archetype": "6. Ekstra atvejis – Skambučio eskalacija",
        "passed": passed_6,
        "details": f"Aktyvuotas skambutis: {triggers_call}, Atpažintas tel: {finds_phone}, Suderintas laikas: {confirms_time}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_6 else 'FAIL'} | Tel: {meta.get('phone')}, Call requested: {meta.get('call_requested')}")

    # -------------------------------------------------------------------------
    # GALUTINĖ REZULTATŲ SUVESTINĖ
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("🏆 KALIBRAVIMO IR TESTAVIMO REZULTATŲ SUVESTINĖ:")
    print("=" * 80)
    all_passed = True
    for r in test_results:
        status_icon = "✅ PASS" if r["passed"] else "❌ FAIL"
        if not r["passed"]:
            all_passed = False
        print(f"{status_icon} | {r['archetype']}")
        print(f"       Smulkesnė info: {r['details']}")
    print("=" * 80)

    if all_passed:
        print("🎉 VISI 6 ARCHETIPAI PILNAI SUKALIBRUOTI IR IŠTESTUOTI! SISTEMA VEIKIA 100% TIKSLUMU!")
    else:
        print("⚠️ KAI KURIE ARCHETIPAI REIKALAUJA PAPILDOMO TIKSLINIMO.")

    return all_passed

if __name__ == "__main__":
    run_calibration_suite()
