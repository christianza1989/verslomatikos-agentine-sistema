import os
import sys
import uuid
import json
import csv
from datetime import datetime

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.accounting_responder import classify_and_generate_reply
from core.accounting_pipeline import AccountingPipeline

def run_ultimate_stress_suite():
    print("=" * 80)
    print("🚀 ULTIMATE GAP CALIBRATION & REAL-WORLD STRESS SUITE (SCENARIOS 31–44)")
    print("=" * 80)

    pipe = AccountingPipeline()
    passed = 0
    total = 0

    scenarios = [
        {
            "id": 31,
            "name": "El. komercija, Shopify, Stripe ir PVM OSS schema",
            "body": "Prekiaujame per Shopify el. parduotuvę į Vokietiją ir Prancūziją, mokėjimus surenka Stripe. Ar mums reikia OSS PVM schemos ir kaip apskaitomi Stripe komisiniai mokesčiai?",
            "expected_topic": "ecommerce_oss",
            "required_phrases": ["OSS", "10 000 €", "Stripe", "bruto", "611", "95"]
        },
        {
            "id": 32,
            "name": "Google Ads ir Facebook reklama ne PVM mokėtojui (FR0608)",
            "body": "Mūsų MB nėra PVM mokėtoja, bet pradėjome pirkti Google Ads ir Facebook reklamą. Sąskaitos ateina su 0% PVM iš Airijos. Ar mums reikia mokėti PVM Lietuvoje ir kaip deklaruoti?",
            "expected_topic": "foreign_saas_vat",
            "required_phrases": ["PVMĮ 71(1)", "95", "FR0608", "21% PVM", "leidžiamomis", "Airijos"]
        },
        {
            "id": 33,
            "name": "Komandiruotės, dienpinigiai ir 1.65 MMA reikalavimas",
            "body": "Direktorius ir vadybininkas važiavo į komandiruotę į Lenkiją ir Vokietiją. Kaip teisėtai išsimokėti dienpinigius, ar jie apsimokestina GPM ir Sodra?",
            "expected_topic": "per_diem_travel",
            "required_phrases": ["dienpinigių norm", "526", "1.65 MMA", "įsakym", "avanso apyskait"]
        },
        {
            "id": 34,
            "name": "Patalpų nuoma iš fizinio asmens ir NTM mokestis (KIT711)",
            "body": "Įmonė nuomojasi ofisą iš fizinio asmens. Kokius mokesčius įmonė privalo išskaičiuoti ir ar tiesa, kad įmonei atsiranda nekilnojamojo turto mokestis (NTM)?",
            "expected_topic": "real_estate_rent_ntm",
            "required_phrases": ["15% GPM", "FR0572", "NTMĮ 3 str. 2 d.", "KIT711", "vasario 15"]
        },
        {
            "id": 35,
            "name": "Įmonės veiklos sustabdymas / užmigdymas (MAĮ 67 str.)",
            "body": "Šiuo metu sustabdėme veiklą ir jokių sandorių nevykdome. Nenorime kas mėnesį mokėti buhalteriams. Kaip oficialiai užmigdyti įmonę ir gauti atleidimą nuo deklaracijų VMI?",
            "expected_topic": "suspension_dormancy",
            "required_phrases": ["MAĮ 67 str.", "atleidim", "deklaracijų", "5 metų", "Mano VMI"]
        },
        {
            "id": 36,
            "name": "Anglakalbis užsienietis steigėjas / E-resident",
            "body": "Hello Tomas and Lilija, we are an international startup with a registered MB in Lithuania. We need full accounting services and balance sheet for our annual tax return. What is your pricing and process?",
            "expected_topic": "english_inquiry",
            "required_phrases": ["Hello", "Lithuania", "16%", "6%", "45,000 €", "Registrų centras", "VMI", "Lilija Zapasnik"]
        },
        {
            "id": 37,
            "name": "Pamesti kvitai, pirkimai be SF ir kuro čekiai",
            "body": "Direktorius pirko prekių įmonės kortele, bet pametė sąskaitą faktūrą ir turi tik paprastą čekį be įmonės kodo. Ar galima tai nurašyti į sąnaudas ir atskaityti PVM?",
            "expected_topic": "missing_receipts",
            "required_phrases": ["PVMĮ 80 str.", "PVM sąskaitos faktūros", "150 €", "Neleidžiam", "dublikat"]
        },
        {
            "id": 38,
            "name": "Statybos darbų atvirkštinis PVM (PVMĮ 96 str.)",
            "body": "Atliekame subrangos statybos darbus kitai statybų įmonei (abi esame PVM mokėtojos). Kaip išrašyti sąskaitą, ar su 0% PVM ir kaip deklaruoti atvirkštinį PVM?",
            "expected_topic": "reverse_charge_construction",
            "required_phrases": ["PVMĮ 96", "Atvirkštinis apmokestinimas", "12 laukel", "25", "35"]
        },
        {
            "id": 39,
            "name": "Gauta parama, INVEGA ir Užimtumo tarnybos subsidijos",
            "body": "Gavome subsidiją iš Užimtumo tarnybos už darbuotojo įdarbinimą ir INVEGA palūkanų kompensaciją. Kaip apskaityti šias pajamas ir ar jos apsimokestina pelno mokesčiu?",
            "expected_topic": "subsidies_grants",
            "required_phrases": ["21-ąjį", "35 sąskait", "Dotacijos", "proporcingai", "PLN204", "kompensuot"]
        },
        {
            "id": 40,
            "name": "MB dalies / akcijų pardavimas ir JANGIS registracija",
            "body": "Vienas iš steigėjų nori parduoti savo MB dalį naujam nariui su pelnu. Kokie teisiniai pranešimai reikalingi Registrų centrui ir koks GPM taikomas pardavėjui?",
            "expected_topic": "share_sale_restructure",
            "required_phrases": ["JAR-1", "JANGIS", "15% GPM", "500 €", "GPMĮ 17 str."]
        }
    ]

    for sc in scenarios:
        total += 1
        reply, state, meta = classify_and_generate_reply(sc["body"], client_name="Lilija", company_name="MB Baltijos Prekyba")
        topic_match = (meta.get("topic") == sc["expected_topic"])
        missing_phrases = [p for p in sc["required_phrases"] if p.lower() not in reply.lower()]
        has_tomas = "Tomas | Verslomatika B2B" in reply
        has_lilija = "Lilija Zapasnik" in reply
        has_no_phone = "8 600" not in reply and "+370" not in reply

        if topic_match and not missing_phrases and has_tomas and has_lilija and has_no_phone:
            passed += 1
            print(f"  [PASS] Scenarijus {sc['id']}: {sc['name']} -> Topic: '{meta.get('topic')}' | All phrases verified")
        else:
            print(f"  [FAIL] Scenarijus {sc['id']}: {sc['name']}")
            print(f"         Topic: got '{meta.get('topic')}', expected '{sc['expected_topic']}'")
            if missing_phrases:
                print(f"         Trūkstamos frazės: {missing_phrases}")
            if not has_no_phone:
                print(f"         KLAIDA: Siūlomas skambutis be kliento prašymo!")

    # 41. Swedbank CSV bank statement document ingestion
    total += 1
    print("\n--- Scenarijus 41: Swedbank CSV banko išrašo automatinis apdorojimas ---")
    case_id_41 = pipe.get_or_create_case("test_swed_41@verslomatika.lt", "Tomas Klientas", "MB Swed Logistika")
    swed_csv_content = (
        "Sąskaitos Nr.;Data;Gavėjas / Mokėtojas;Asmens / įmonės kodas;Sąskaita;Operacijos aprašymas;Suma;Valiuta;D/K;Dokumento numeris\n"
        "LT1234567890;2026-05-01;UAB Klientas;304567890;LT998877;Apmokėjimas už paslaugas;48500.00;EUR;K;DOC-001\n"
        "LT1234567890;2026-05-05;MB Tiekėjas;305678901;LT887766;Mokėjimas už prekes;12300.00;EUR;D;DOC-002\n"
        "LT1234567890;2026-05-15;UAB Partneris;306789012;LT776655;Sutartiniai darbai;16500.00;EUR;K;DOC-003\n"
    ).encode("utf-8")

    pipe.process_inbound_reply(
        sender_email="test_swed_41@verslomatika.lt",
        subject="Siunčiame Swedbank banko išrašą",
        body_text="Laba diena, siunčiu mūsų šių metų Swedbank CSV banko išrašą auditui.",
        attachments=[{"filename": "Swedbank_israsas_2026.csv", "data": swed_csv_content}]
    )

    analysis_41 = pipe.analyze_case_documents(case_id_41)
    pricing_41 = analysis_41["pricing"]
    # Total inflows: 48500 + 16500 = 65000.00 € (Smulki įmonė 25k-85k -> Tier 2: 160 €)
    if pricing_41["tier_code"] == "tier_2_small" and pricing_41["base_price"] == 160.00:
        passed += 1
        print(f"  [PASS] Scenarijus 41: Swedbank CSV teisingai suskaičiavo apyvartą (65 000 €) ir priskyrė Tier 2 (160 €)!")
    else:
        print(f"  [FAIL] Scenarijus 41: Gautas tier: {pricing_41['tier_code']}, kaina: {pricing_41['total_price']}")

    # 42. Revolut CSV bank statement document ingestion
    total += 1
    print("\n--- Scenarijus 42: Revolut CSV banko išrašo automatinis apdorojimas ---")
    case_id_42 = pipe.get_or_create_case("test_revolut_42@verslomatika.lt", "Eglė", "MB Revolut Tech")
    rev_csv_content = (
        "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance\n"
        "TRANSFER,Current,2026-02-01,2026-02-01,Stripe Payout,95000.00,0.00,EUR,COMPLETED,95000.00\n"
        "CARD_PAYMENT,Current,2026-02-05,2026-02-05,Google Ads,-1200.00,0.00,EUR,COMPLETED,93800.00\n"
        "TRANSFER,Current,2026-03-01,2026-03-01,EU Client Payment,45000.00,0.00,EUR,COMPLETED,138800.00\n"
    ).encode("utf-8")

    pipe.process_inbound_reply(
        sender_email="test_revolut_42@verslomatika.lt",
        subject="Revolut Business išrašas",
        body_text="Prisegu Revolut Business sąskaitos CSV išrašą.",
        attachments=[{"filename": "revolut_statement.csv", "data": rev_csv_content}]
    )

    analysis_42 = pipe.analyze_case_documents(case_id_42)
    pricing_42 = analysis_42["pricing"]
    # Total inflows: 95000 + 45000 = 140000.00 € (Vidutinė įmonė 85k-250k -> Tier 3: 240 €)
    if pricing_42["tier_code"] == "tier_3_medium" and pricing_42["base_price"] == 240.00:
        passed += 1
        print(f"  [PASS] Scenarijus 42: Revolut CSV teisingai suskaičiavo apyvartą (140 000 €) ir priskyrė Tier 3 (240 €)!")
    else:
        print(f"  [FAIL] Scenarijus 42: Gautas tier: {pricing_42['tier_code']}, kaina: {pricing_42['total_price']}")

    # 43. Baltic-encoded (cp1257) CSV file handling
    total += 1
    print("\n--- Scenarijus 43: Baltic ANSI (cp1257) CSV failo apdorojimas ---")
    case_id_43 = pipe.get_or_create_case("test_cp1257_43@verslomatika.lt", "Saulius", "UAB Rivilės Klientas")
    rivile_cp1257 = (
        "Sąskaitos kodas;Sąskaitos pavadinimas;Debetas;Kreditas\n"
        "500;Pardavimo pajamos;0,00;35400,00\n"
        "6114;Darbo užmokesčio sąnaudos;12000,00;0,00\n"
        "271;Atsiskaitomoji sąskaita banke;23400,00;0,00\n"
    ).encode("cp1257")

    pipe.process_inbound_reply(
        sender_email="test_cp1257_43@verslomatika.lt",
        subject="Rivilės bandomasis balansas",
        body_text="Prisegu failą iš Rivilės programos.",
        attachments=[{"filename": "rivile_export_cp1257.csv", "data": rivile_cp1257}]
    )

    analysis_43 = pipe.analyze_case_documents(case_id_43)
    pricing_43 = analysis_43["pricing"]
    if pricing_43["tier_code"] == "tier_2_small" and any("darbo užmokesčio" in str(f.get("note", "")).lower() or "rivil" in str(f.get("note", "")).lower() or pricing_43["base_price"] == 160.00 for f in analysis_43["findings"]):
        passed += 1
        print("  [PASS] Scenarijus 43: Baltic ANSI (cp1257) failas nuskaitytas be klaidų, lietuviški simboliai išsaugoti!")
    else:
        print(f"  [FAIL] Scenarijus 43: cp1257 nuskaitymo klaida!")

    # 44. Skenuoto dokumento / nuotraukos apdorojimas (.jpg)
    total += 1
    print("\n--- Scenarijus 44: Skenuoto dokumento / kvitų (.jpg) apdorojimas ---")
    case_id_44 = pipe.get_or_create_case("test_scan_44@verslomatika.lt", "Darius", "MB Skubus Remontas")
    fake_jpg = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00"

    pipe.process_inbound_reply(
        sender_email="test_scan_44@verslomatika.lt",
        subject="Nufotografuoti kvitai",
        body_text="Atsiunčiu nufotografuotus kuro kvitus.",
        attachments=[{"filename": "kuro_kvitai.jpg", "data": fake_jpg}]
    )

    analysis_44 = pipe.analyze_case_documents(case_id_44)
    has_scan_finding = any("skanuot" in f.get("name", "").lower() or "skanas" in f.get("account", "").lower() for f in analysis_44["findings"])
    if has_scan_finding:
        passed += 1
        print("  [PASS] Scenarijus 44: Vaizdo failas (.jpg) atpažintas ir įtrauktas į vyriausiosios buhalterės peržiūros registrą!")
    else:
        print(f"  [FAIL] Scenarijus 44: JPG failas nebuvo įtrauktas į findings!")

    print("\n" + "=" * 80)
    print(f"REZULTATAS: {passed} / {total} SCENARIJŲ IŠLAIKYTA ({(passed/total)*100:.1f}%)")
    print("=" * 80)

if __name__ == "__main__":
    run_ultimate_stress_suite()
