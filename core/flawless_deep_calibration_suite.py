import os
import sys
import uuid
import json
import sqlite3
import csv
import zipfile
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

from core.accounting_responder import classify_and_generate_reply
from core.accounting_pricing import calculate_accounting_price, lithuanian_number_to_words
from core.invoice_generator import generate_invoice_pdf
from core.accounting_pipeline import AccountingPipeline

FLAWLESS_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "flawless_test_files")
os.makedirs(FLAWLESS_DIR, exist_ok=True)

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

# 1. Generatorius: ZIP archyvas su vidiniu XLSX bandomuoju balansu (115k € apyvarta)
def create_test_zip_package(zip_path: str):
    import openpyxl
    xlsx_temp = os.path.join(FLAWLESS_DIR, "temp_didzioji_knyga.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Didžioji_Knyga"
    ws.append(["Sąskaita", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["271", "Bankas Swedbank", 32000.0, 0.0])
    ws.append(["500", "Pardavimo pajamos (Statyba)", 0.0, 115000.0])
    ws.append(["600", "Statybinių medžiagų savikaina", 68000.0, 0.0])
    ws.append(["6114", "Darbo užmokesčio sąnaudos", 22000.0, 0.0])
    wb.save(xlsx_temp)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(xlsx_temp, arcname="balansas_2026.xlsx")
    
    if os.path.exists(xlsx_temp):
        os.remove(xlsx_temp)

# 2. Generatorius: Slaptažodžiu apsaugotas (šifruotas) PDF
def create_encrypted_pdf(pdf_path: str, password: str = "SecretPass123"):
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet
    import pypdf

    temp_unencrypted = os.path.join(FLAWLESS_DIR, "temp_plain.pdf")
    doc = SimpleDocTemplate(temp_unencrypted, pagesize=A4)
    styles = getSampleStyleSheet()
    story = [Paragraph("Konfidencialus banko išrašas", styles['Normal'])]
    doc.build(story)

    reader = pypdf.PdfReader(temp_unencrypted)
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)

    with open(pdf_path, "wb") as f:
        writer.write(f)

    if os.path.exists(temp_unencrypted):
        os.remove(temp_unencrypted)

def run_flawless_deep_suite():
    print("=" * 85)
    print("💎 PRADEDAMAS GILUSIS GRIEŽTOS KALIBRACIJOS IR SPRAGŲ ELIMINAVIMO TESTAS (SCENARIJAI 21-30)")
    print("=" * 85)

    pipe = AccountingPipeline()
    mock_smtp = MockSMTP()
    pipe.smtp = mock_smtp
    results = []

    # -------------------------------------------------------------------------
    # SCENARIJUS 21: Automobilio pirkimas / Lizingas / PVM ir 0.75% Pajamos natūra
    # -------------------------------------------------------------------------
    print("\n[STRESS 21/30] Automobilio pirkimas / PVM atskaita ir Pajamos natūra (0.75%)")
    q_auto = "Planuojame pirkti automobilį įmonės vardu lizingu. Ar galėsime atskaityti PVM, nurašyti kurą ir kaip išvengti pajamų natūra?"
    rep_21, wait_21, meta_21 = classify_and_generate_reply(q_auto, "Dovydas", "MB Auto Logistika", has_documents=False)

    explains_pvm_62 = "pvm įstatymo 62" in rep_21.lower() or "m1 klasės" in rep_21.lower() or "nėra leidžiama" in rep_21.lower()
    explains_natura_075 = "0,75%" in rep_21 or "0.75%" in rep_21 or "gpmį 9" in rep_21.lower()
    explains_fuel_part = "gps sekimo" in rep_21.lower() or "kelionės lapai" in rep_21.lower()
    no_call_21 = meta_21.get("call_requested") != 1

    passed_21 = explains_pvm_62 and explains_natura_075 and explains_fuel_part and no_call_21
    results.append({
        "scenario": "21. Automobilis įmonėje (PVMĮ 62 str. ir 0.75% pajamos natūra)",
        "passed": passed_21,
        "details": f"PVMĮ 62 str. atskaitos taisyklė: {explains_pvm_62}, 0.75% pajamos natūra: {explains_natura_075}, Kuras/GPS: {explains_fuel_part}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_21 else 'FAIL'} | Topic: {meta_21.get('topic')}, PVMĮ 62: {explains_pvm_62}, Pajamos natūra: {explains_natura_075}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 22: Dividendai ir Avansinis pelnas (MB 02 vs 26 kodai)
    # -------------------------------------------------------------------------
    print("\n[STRESS 22/30] Dividendai ir Avansinis pelnas (MB 02 vs 26 kodai)")
    q_div = "Ar galime dabar iki gruodžio 31 d. išsimokėti avansinius dividendus arba lėšas asmeniniams poreikiams? Kokie mokesčiai 02 vs 26 kodais?"
    rep_22, wait_22, meta_22 = classify_and_generate_reply(q_div, "Marius", "MB Finansų Meistrai", has_documents=False)

    explains_02 = "kodas 02" in rep_22.lower() and "sodros" in rep_22.lower()
    explains_26 = "kodas 26" in rep_22.lower() and "tik 15% gpm" in rep_22.lower()
    explains_loss_risk = "nuostol" in rep_22.lower() and "grąžinti" in rep_22.lower()

    passed_22 = explains_02 and explains_26 and explains_loss_risk
    results.append({
        "scenario": "22. Dividendai ir Avansinis pelnas (MB 02 vs 26 kodai)",
        "passed": passed_22,
        "details": f"02 kodas (GPM+Sodra): {explains_02}, 26 kodas (tik 15% GPM): {explains_26}, Grąžinimas nuostolio atveju: {explains_loss_risk}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_22 else 'FAIL'} | Topic: {meta_22.get('topic')}, 02/26 kodai: {explains_02 and explains_26}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 23: Reprezentacinės sąnaudos ir Kalėdinės dovanos (PMĮ 21 str.)
    # -------------------------------------------------------------------------
    print("\n[STRESS 23/30] Reprezentacinės sąnaudos ir Kalėdinės dovanos (PMĮ 21 str.)")
    q_gifts = "Artėja Kalėdos, norime nupirkti dovanas klientams ir surengti vakarėlį. Ar tai leidžiami atskaitymai ir kaip su PVM atskaita?"
    rep_23, wait_23, meta_23 = classify_and_generate_reply(q_gifts, "Laura", "UAB Verslo Dovanos", has_documents=False)

    explains_50_50 = "50% sumos yra leidžiami" in rep_23.lower() or "50/50" in rep_23
    explains_pmi_21 = "pmį 21" in rep_23.lower() or "pelno mokesčio įstatymo 21" in rep_23.lower()
    explains_vat_half = "50% pirkimo pvm atskaitoma" in rep_23.lower() or "50% neatskaitoma" in rep_23.lower()

    passed_23 = explains_50_50 and explains_pmi_21 and explains_vat_half
    results.append({
        "scenario": "23. Reprezentacija ir Kalėdinės dovanos (PMĮ 21 str.)",
        "passed": passed_23,
        "details": f"PMĮ 21 str: {explains_pmi_21}, 50/50 taisyklė: {explains_50_50}, 50% PVM atskaita: {explains_vat_half}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_23 else 'FAIL'} | Topic: {meta_23.get('topic')}, 50/50 taisyklė: {explains_50_50}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 24: Buhalterijos keitimas ir perėmimas nuo sausio 1 d.
    # -------------------------------------------------------------------------
    print("\n[STRESS 24/30] Buhalterijos keitimas ir perėmimas nuo sausio 1 d.")
    q_trans = "Noriu nuo sausio 1 d. pereiti pas jus ir nutraukti sutartį su dabartine buhaltere. Kaip vyksta perėmimo procesas ir kokių dokumentų reikalauti?"
    rep_24, wait_24, meta_24 = classify_and_generate_reply(q_trans, "Vytautas", "UAB Naujas Startas", has_documents=False)

    explains_steps = "perdavimo-priėmimo akt" in rep_24.lower() and "didžiąją knygą" in rep_24.lower()
    explains_free_init = "nemokamai" in rep_24.lower() and "pradinių likučių" in rep_24.lower()
    no_call_24 = meta_24.get("call_requested") != 1

    passed_24 = explains_steps and explains_free_init and no_call_24
    results.append({
        "scenario": "24. Buhalterijos perėmimas nuo Naujųjų metų",
        "passed": passed_24,
        "details": f"Perdavimo aktas ir DK: {explains_steps}, Nemokamas pradinių likučių auditas: {explains_free_init}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_24 else 'FAIL'} | Topic: {meta_24.get('topic')}, 3 žingsnių planas: {explains_steps}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 25: Slaptas patikrinimas / Baimė supykdyti buhalterę
    # -------------------------------------------------------------------------
    print("\n[STRESS 25/30] Slaptas patikrinimas / Baimė supykdyti buhalterę (Second Opinion)")
    q_secret = "Aš noriu pasitikrinti, ar mano buhalterė nedaro klaidų, bet labai bijau, kad ji sužinos ir supyks. Ar buhalterė matys, kad jūs tikrinate?"
    rep_25, wait_25, meta_25 = classify_and_generate_reply(q_secret, "Edita", "MB Saugus Verslas", has_documents=False)

    confirms_secret = "nesužinos" in rep_25.lower() or "nesuzinos" in rep_25.lower()
    explains_no_vmi_login = "nesijungiame prie jūsų" in rep_25.lower() or "mano vmi" in rep_25.lower()
    explains_second_opinion = "antra nuomon" in rep_25.lower() or "vadovas" in rep_25.lower()

    passed_25 = confirms_secret and explains_no_vmi_login and explains_second_opinion
    results.append({
        "scenario": "25. Slaptas patikrinimas (Baimė supykdyti buhalterę)",
        "passed": passed_25,
        "details": f"100% slaptumas patvirtintas: {confirms_secret}, Jokio jungimosi prie VMI: {explains_no_vmi_login}, Vadovo atsakomybės teisė: {explains_second_opinion}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_25 else 'FAIL'} | Topic: {meta_25.get('topic')}, Slaptumas garantuotas: {confirms_secret}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 26: Paskolos tarp vadovo ir įmonės (PMĮ 40 str. / FR0711)
    # -------------------------------------------------------------------------
    print("\n[STRESS 26/30] Paskolos tarp vadovo ir įmonės (PMĮ 40 str. / FR0711)")
    q_loan = "Noriu paskolinti savo įmonei 20 000 € be palūkanų, o kitais metais įmonė skolins man. Ar galima be palūkanų ir ar reikės deklaruoti VMI?"
    rep_26, wait_26, meta_26 = classify_and_generate_reply(q_loan, "Andrius", "MB Projektų Valdymas", has_documents=False)

    explains_pmi_40 = "pmį 40" in rep_26.lower() or "rinkos" in rep_26.lower()
    explains_fr0711_limit = "15 000 €" in rep_26 and "fr0711" in rep_26.lower()
    explains_risk_company_lends = "naudą natūra" in rep_26.lower() or "pajamos natūra" in rep_26.lower()

    passed_26 = explains_pmi_40 and explains_fr0711_limit and explains_risk_company_lends
    results.append({
        "scenario": "26. Paskolos tarp vadovo ir įmonės",
        "passed": passed_26,
        "details": f"PMĮ 40 str. rinkos kaina: {explains_pmi_40}, FR0711 15k limitas: {explains_fr0711_limit}, Nauda natūra skolinant vadovui: {explains_risk_company_lends}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_26 else 'FAIL'} | Topic: {meta_26.get('topic')}, FR0711: {explains_fr0711_limit}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 27: Teisinės garantijos ir materialinė atsakomybė
    # -------------------------------------------------------------------------
    print("\n[STRESS 27/30] Teisinės garantijos ir materialinė atsakomybė")
    q_guar = "Kokias garantijas suteikiate, jei VMI po jūsų patikrinimo skirs baudą? Ar turite civilinę atsakomybę ir kas atsakys už klaidas?"
    rep_27, wait_27, meta_27 = classify_and_generate_reply(q_guar, "Kęstutis", "UAB Garantas", has_documents=False)

    explains_liability = "atsakome" in rep_27.lower() or "kompensuojama" in rep_27.lower() or "žala" in rep_27.lower()
    explains_license = "34566444" in rep_27 and "25 metų" in rep_27.lower()

    passed_27 = explains_liability and explains_license
    results.append({
        "scenario": "27. Teisinės garantijos ir civilinė atsakomybė",
        "passed": passed_27,
        "details": f"Materialinė atsakomybė patvirtinta: {explains_liability}, IV pažyma ir 25 m. patirtis: {explains_license}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_27 else 'FAIL'} | Topic: {meta_27.get('topic')}, Garantijos patvirtintos: {explains_liability}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 28: Kriptovaliutos ir Web3 apskaita (VAS 263 sąskaita)
    # -------------------------------------------------------------------------
    print("\n[STRESS 28/30] Kriptovaliutos ir Web3 apskaita (263 sąskaita)")
    q_crypto = "Mūsų įmonė pirko Bitcoin ir USDT, gavome pelno iš prekybos. Kaip tai deklaruoti ir kaip su PVM bei pelno mokesčiu?"
    rep_28, wait_28, meta_28 = classify_and_generate_reply(q_crypto, "Tomas", "MB Kripto Spindulys", has_documents=False)

    explains_263 = "263" in rep_28 or "trumpalaikiam finansiniam turtui" in rep_28.lower()
    explains_pvm_exempt = "0% pvm" in rep_28.lower() or "neapmokestinama" in rep_28.lower() or "hedqvist" in rep_28.lower()
    explains_fifo = "fifo" in rep_28.lower() or "realizuotas pelnas" in rep_28.lower()

    passed_28 = explains_263 and explains_pvm_exempt and explains_fifo
    results.append({
        "scenario": "28. Kriptovaliutų ir Web3 apskaita",
        "passed": passed_28,
        "details": f"263 finansinis turtas: {explains_263}, 0% PVM finansinėms paslaugoms: {explains_pvm_exempt}, FIFO metodas: {explains_fifo}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_28 else 'FAIL'} | Topic: {meta_28.get('topic')}, 263 sąskaita: {explains_263}, 0% PVM: {explains_pvm_exempt}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 29: ZIP Archyvo automatinis išpakavimas ir analizė
    # -------------------------------------------------------------------------
    print("\n[STRESS 29/30] ZIP Archyvo automatinis išpakavimas ir analizė (MB 'Statybų Korpusas')")
    f_zip = os.path.join(FLAWLESS_DIR, "buhalterija_archyvas.zip")
    create_test_zip_package(f_zip)

    case_id_29 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Simonas', 'simonas@statybukorpusas.lt', 'MB Statybų Korpusas', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_29,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'buhalterija_archyvas.zip', 'document', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_29, f_zip, os.path.getsize(f_zip)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_29)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price, pricing_tier FROM accounting_cases WHERE id = ?", (case_id_29,))
    row29 = c.fetchone()
    conn.close()

    # 115 000 € apyvarta -> Tier 3 Vidutinė įmonė (240 € bazė)
    passed_29 = (row29["annual_turnover"] == 115000.0) and (row29["calculated_price"] == 240.0)
    results.append({
        "scenario": "29. ZIP archyvo automatinis išpakavimas",
        "passed": passed_29,
        "details": f"Išpakuota XLSX apyvarta: {row29['annual_turnover']} € (Tikėtasi: 115 000 €), Tier 3 kaina: {row29['calculated_price']} €"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_29 else 'FAIL'} | Apyvarta iš ZIP: {row29['annual_turnover']} €, Kaina: {row29['calculated_price']} €")

    # -------------------------------------------------------------------------
    # SCENARIJUS 30: Slaptažodžiu apsaugotas (šifruotas) PDF failas
    # -------------------------------------------------------------------------
    print("\n[STRESS 30/30] Slaptažodžiu apsaugoto PDF failo saugumas (UAB 'Koduotas Seifas')")
    f_enc_pdf = os.path.join(FLAWLESS_DIR, "israsas_apsaugotas.pdf")
    create_encrypted_pdf(f_enc_pdf, "Slaptazodis2026")

    case_id_30 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Gediminas', 'gediminas@koduotasseifas.lt', 'UAB Koduotas Seifas', 'UAB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_30,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'israsas_apsaugotas.pdf', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_30, f_enc_pdf, os.path.getsize(f_enc_pdf)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_30)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT summary_notes FROM accounting_cases WHERE id = ?", (case_id_30,))
    row30 = c.fetchone()
    conn.close()

    findings_30 = json.loads(row30["summary_notes"])
    has_enc_finding = any("slaptažodžiu" in f.get("name", "").lower() for f in findings_30)

    passed_30 = has_enc_finding
    results.append({
        "scenario": "30. Slaptažodžiu apsaugoto PDF atpažinimas",
        "passed": passed_30,
        "details": f"Atpažintas užšifruotas PDF: {has_enc_finding}, Nustatyta apsaugos pastaba be lūžio"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_30 else 'FAIL'} | Užšifruoto failo fiksavimas: {has_enc_finding}")

    # -------------------------------------------------------------------------
    # GALUTINĖ GILIOSIOS KALIBRACIJOS SUVESTINĖ
    # -------------------------------------------------------------------------
    print("\n" + "=" * 85)
    print("🏆 GILIOSIOS KALIBRACIJOS IR SPRAGŲ ELIMINAVIMO REZULTATŲ SUVESTINĖ (SCENARIJAI 21-30):")
    print("=" * 85)
    all_flawless_passed = True
    for r in results:
        status_icon = "✅ PASS" if r["passed"] else "❌ FAIL"
        if not r["passed"]:
            all_flawless_passed = False
        print(f"{status_icon} | {r['scenario']}")
        print(f"       Smulkesnė info: {r['details']}")
    print("=" * 85)

    if all_flawless_passed:
        print("🎉 VISI 10 NAUJI GILIEJI SCENARIJAI ĮVEIKTI 100%! VISOS SPRAGOS PILNAI IŠTAISYTOS!")
    else:
        print("⚠️ APTIKTA KLAIDŲ KAI KURIUOSE SCENARIJUOSE.")

    return all_flawless_passed

if __name__ == "__main__":
    run_flawless_deep_suite()
