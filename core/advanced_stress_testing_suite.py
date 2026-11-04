import os
import sys
import uuid
import json
import sqlite3
import csv
import xml.etree.ElementTree as ET
import pypdf
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

STRESS_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "stress_test_files")
os.makedirs(STRESS_DIR, exist_ok=True)

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

# 1. Generatorius: Stambi UAB (680k € apyvarta)
def create_corporate_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Didzioji_Knyga"
    ws.append(["Kodas", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["1200", "Ilgalaikis turtas ir įranga", 42000.0, 0.0])
    ws.append(["2040", "Prekės skirtos perparduoti (Sandėlis)", 68000.0, 0.0])
    ws.append(["2441", "Gautinas PVM iš VMI", 12500.0, 0.0])
    ws.append(["2710", "Swedbank atsiskaitomoji sąskaita", 85000.0, 0.0])
    ws.append(["2711", "SEB atsiskaitomoji sąskaita", 34000.0, 0.0])
    ws.append(["301", "Įstatinis kapitalas", 0.0, 50000.0])
    ws.append(["341", "Sukauptas ataskaitinis pelnas", 0.0, 48000.0])
    ws.append(["441", "Finansiniai įsipareigojimai (Lizingas)", 0.0, 28000.0])
    ws.append(["4430", "Skolos tiekėjams", 0.0, 75000.0])
    ws.append(["4461", "Mokėtinas darbo užmokestis", 0.0, 18500.0])
    ws.append(["500", "Pardavimo pajamos (Lietuva)", 0.0, 610000.0])
    ws.append(["5003", "Pardavimo pajamos (ES OSS / eksportas)", 0.0, 70000.0])
    ws.append(["600", "Parduotų prekių savikaina", 480000.0, 0.0])
    ws.append(["6114", "Darbo užmokesčio sąnaudos (12 darbuotojų)", 110000.0, 0.0])
    ws.append(["631204", "Neleidžiami atskaitymai (VMI kodas 08)", 4500.0, 0.0])
    wb.save(filepath)

# 2. Generatorius: Kasos anomalija (272 = 28 500 €)
def create_cash_anomaly_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Kasa_Balansas"
    ws.append(["Sąskaita", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["272", "Kasa (Grynieji pinigai)", 28500.0, 0.0])
    ws.append(["271", "Banko sąskaita", 1200.0, 0.0])
    ws.append(["500", "Pardavimo pajamos", 0.0, 42000.0])
    ws.append(["600", "Veiklos sąnaudos", 38000.0, 0.0])
    ws.append(["308", "Narių įnašai", 0.0, 500.0])
    wb.save(filepath)

# 3. Generatorius: Nulinė MB
def create_dormant_csv(filepath: str):
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["Kodas", "Pavadinimas", "Debetas", "Kreditas"])
        writer.writerow(["2710", "Bankas", "185.00", "0.00"])
        writer.writerow(["3080", "Narių įnašai", "0.00", "200.00"])
        writer.writerow(["6118", "Banko komisiniai", "15.00", "0.00"])
        writer.writerow(["3411", "Nuostolis", "15.00", "0.00"])

# 4. Generatorius: Atskaitingi asmenys 2435 = 34 000 €
def create_accountable_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Sąskaita", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["2435", "Atskaitingi asmenys (Direktoriaus skola)", 34000.0, 0.0])
    ws.append(["271", "Bankas", 450.0, 0.0])
    ws.append(["500", "Pardavimo pajamos", 0.0, 55000.0])
    ws.append(["600", "Sąnaudos", 48000.0, 0.0])
    wb.save(filepath)

# 5. Generatorius: XML ISO 20022 CAMT.053
def create_camt053_xml(filepath: str):
    xml_content = """<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Id>STMT-2026-10-29-001</Id>
      <Ntry>
        <Amt Ccy="EUR">24500.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>BOOK</Sts>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">27900.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>BOOK</Sts>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(xml_content)

# 6. Generatorius: Sugadintas 0 baitų failas
def create_corrupted_file(filepath: str):
    with open(filepath, "wb") as f:
        f.write(b"") # 0 bytes

def run_advanced_stress_suite():
    print("=" * 85)
    print("⚡ PRADEDAMAS IŠPLĖSTINIS BUHALTERIJOS AI AGENTŲ STRESO TESTAS (7 NAUJI SCENARIJAI)")
    print("=" * 85)

    pipe = AccountingPipeline()
    mock_smtp = MockSMTP()
    pipe.smtp = mock_smtp
    results = []

    # -------------------------------------------------------------------------
    # SCENARIJUS 7: Stambi įmonė (Apyvarta 680k €, Tier 5) - UAB „Agro Baltija“
    # -------------------------------------------------------------------------
    print("\n[STRESS 1/7] Stambi įmonė (Apyvarta 680k €, Tier 5) - UAB 'Agro Baltija'")
    f_corp = os.path.join(STRESS_DIR, "agro_baltija_680k.xlsx")
    create_corporate_xlsx(f_corp)

    case_id_7 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Mindaugas', 'mindaugas@agrobaltija.lt', 'UAB Agro Baltija', 'UAB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_7,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'agro_baltija_680k.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_7, f_corp, os.path.getsize(f_corp)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_7)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price, pricing_tier FROM accounting_cases WHERE id = ?", (case_id_7,))
    row7 = c.fetchone()
    conn.close()

    turnover_7 = row7["annual_turnover"]
    price_7 = row7["calculated_price"]
    tier_7 = row7["pricing_tier"]
    
    # Tikriname: 680 000 apyvarta -> Tier 5 (520 € bazė + 30 € ES + 30 € DU + 20 € IT = 600 €)
    passed_7 = (turnover_7 == 680000.0) and (price_7 == 600.0) and ("Stambi" in tier_7)
    results.append({
        "scenario": "7. Stambi įmonė (Tier 5: 680k €)",
        "passed": passed_7,
        "details": f"Apyvarta: {turnover_7:,.2f} €, Kaina: {price_7} € (Tikėtasi: 600 €: bazė 520 € + 30 € ES + 30 € DU + 20 € IT), Pakopa: {tier_7}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_7 else 'FAIL'} | Apyvarta: {turnover_7:,.2f} €, Kaina: {price_7} €")

    # -------------------------------------------------------------------------
    # SCENARIJUS 8: Kasos operacijų anomalija (272 = 28 500 €) - MB „Miesto Kavinė“
    # -------------------------------------------------------------------------
    print("\n[STRESS 2/7] Kasos operacijų anomalija (28 500 € kasoje) - MB 'Miesto Kavinė'")
    f_cash = os.path.join(STRESS_DIR, "kasa_28k.xlsx")
    create_cash_anomaly_xlsx(f_cash)

    case_id_8 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Jurgita', 'jurgita@miestokavine.lt', 'MB Miesto Kavinė', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_8,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'kasa_28k.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_8, f_cash, os.path.getsize(f_cash)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_8)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT summary_notes FROM accounting_cases WHERE id = ?", (case_id_8,))
    row8 = c.fetchone()
    conn.close()

    findings_8 = json.loads(row8["summary_notes"])
    has_cash_risk = any(f.get("account") == "272" and "Didelis grynųjų" in f.get("name") for f in findings_8)

    # Tikriname atsakymo generavimą į kliento klausimą apie kasą
    q_cash = "Pas mus kasoje rodo 28 500 €, ar VMI gali prisikabinti? Kaip saugiai išimti pinigus savininkui?"
    rep_8, wait_8, meta_8 = classify_and_generate_reply(q_cash, "Jurgita", "MB Miesto Kavinė", has_documents=True)
    
    explains_5k = "5 000 €" in rep_8
    explains_solution = "įnešimas į įmonės banko sąskaitą" in rep_8 or "02 kodu" in rep_8
    no_call_8 = meta_8.get("call_requested") != 1

    passed_8 = has_cash_risk and explains_5k and explains_solution and no_call_8
    results.append({
        "scenario": "8. Kasos anomalija (272 sąskaita > 5 000 €)",
        "passed": passed_8,
        "details": f"Rasta 272 rizika registre: {has_cash_risk}, Paaiškinta 5 000 € riba: {explains_5k}, Sprendimo būdai pateikti: {explains_solution}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_8 else 'FAIL'} | 272 rizika: {has_cash_risk}, 5000 € taisyklė: {explains_5k}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 9: VMI Patikrinimo / Paklausimo Panika - UAB „Apex IT“
    # -------------------------------------------------------------------------
    print("\n[STRESS 3/7] VMI Patikrinimo panika - UAB 'Apex IT'")
    q_vmi = "GAVAU PRANEŠIMĄ IŠ VMI! Reikalauja paaiškinti PVM atskaitą ir 2026 m. PLN204 iki lapkričio 15 d.! Man šokas, padėkite, ką daryti?!"
    rep_9, wait_9, meta_9 = classify_and_generate_reply(q_vmi, "Tomas", "UAB Apex IT", has_documents=False)

    calms_down = "prašau nusiraminti" in rep_9.lower() or "standartinė procedūra" in rep_9.lower()
    explains_vmi_reconcile = "fr0600" in rep_9.lower() and "i.saf" in rep_9.lower() and "pln204" in rep_9.lower()
    gives_deadline = "10–14" in rep_9 or "dienų termin" in rep_9.lower()
    no_call_9 = meta_9.get("call_requested") != 1

    passed_9 = calms_down and explains_vmi_reconcile and gives_deadline and no_call_9
    results.append({
        "scenario": "9. VMI patikrinimo panika",
        "passed": passed_9,
        "details": f"Nuraminimas: {calms_down}, Deklaracijų (FR0600/i.SAF/PLN204) sutikrinimas: {explains_vmi_reconcile}, Terminas: {gives_deadline}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_9 else 'FAIL'} | Topic: {meta_9.get('topic')}, Procedūra pateikta: {explains_vmi_reconcile}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 10: Mieganti įmonė / Nulinė apyvarta - MB „Startas Nulis“
    # -------------------------------------------------------------------------
    print("\n[STRESS 4/7] Mieganti įmonė su 0 € apyvarta - MB 'Startas Nulis'")
    f_dormant = os.path.join(STRESS_DIR, "mieganti_mb.csv")
    create_dormant_csv(f_dormant)

    case_id_10 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Agnė', 'agne@startasnulis.lt', 'MB Startas Nulis', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_10,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'mieganti_mb.csv', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_10, f_dormant, os.path.getsize(f_dormant)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_10)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price FROM accounting_cases WHERE id = ?", (case_id_10,))
    row10 = c.fetchone()
    conn.close()

    q_dormant = "Mes šiais metais nieko nepardavėme, apyvarta 0 €. Ar mums apskritai reikia teikti PLN204 ir balansą? Ir kiek tai kainuotų, jei apyvarta nulinė?"
    rep_10, wait_10, meta_10 = classify_and_generate_reply(q_dormant, "Agnė", "MB Startas Nulis", has_documents=True)

    explains_rc_fine = "200 € iki 3 000 €" in rep_10 or "administracinė bauda" in rep_10.lower()
    explains_minimal_120 = "120,00 €" in rep_10
    passed_10 = (row10["calculated_price"] == 120.0) and explains_rc_fine and explains_minimal_120
    results.append({
        "scenario": "10. Mieganti įmonė (0 € apyvarta)",
        "passed": passed_10,
        "details": f"Minimalus tarifas 120 €: {row10['calculated_price'] == 120.0}, RC baudos paaiškinimas: {explains_rc_fine}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_10 else 'FAIL'} | Kaina: {row10['calculated_price']} €, RC atsakomybė išaiškinta: {explains_rc_fine}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 11: Atskaitingi asmenys (2435 = 34 000 € / FR0711) - MB „Statybos Vizija“
    # -------------------------------------------------------------------------
    print("\n[STRESS 5/7] Atskaitingi asmenys (34 000 € / FR0711 grėsmė) - MB 'Statybos Vizija'")
    f_acc = os.path.join(STRESS_DIR, "atskaitingi_34k.xlsx")
    create_accountable_xlsx(f_acc)

    case_id_11 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Edgaras', 'edgaras@statybosvizija.lt', 'MB Statybos Vizija', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_11,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'atskaitingi_34k.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_11, f_acc, os.path.getsize(f_acc)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_11)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT summary_notes FROM accounting_cases WHERE id = ?", (case_id_11,))
    row11 = c.fetchone()
    conn.close()

    findings_11 = json.loads(row11["summary_notes"])
    has_fr0711_finding = any("FR0711" in f.get("name") and f.get("value") == 34000.0 for f in findings_11)

    q_acc = "Mano buhalterė įmetė visus pirkimus į 2435 sąskaitą ir ten kabo 34 000 €. Ar čia blogai?"
    rep_11, wait_11, meta_11 = classify_and_generate_reply(q_acc, "Edgaras", "MB Statybos Vizija", has_documents=True)

    explains_15k_limit = "15 000 €" in rep_11
    explains_20_gpm = "20% gpm" in rep_11.lower()
    explains_avansine = "avansinė apyskaita" in rep_11.lower()

    passed_11 = has_fr0711_finding and explains_15k_limit and explains_20_gpm and explains_avansine
    results.append({
        "scenario": "11. Atskaitingi asmenys (FR0711 rizika)",
        "passed": passed_11,
        "details": f"FR0711 anomalija rasta: {has_fr0711_finding}, 15k limitas: {explains_15k_limit}, 20% GPM rizika: {explains_20_gpm}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_11 else 'FAIL'} | 15k € taisyklė: {explains_15k_limit}, 20% GPM: {explains_20_gpm}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 12: XML ISO 20022 CAMT.053 banko išrašas - MB „E-Shop Pro“
    # -------------------------------------------------------------------------
    print("\n[STRESS 6/7] XML ISO 20022 CAMT.053 banko išrašas - MB 'E-Shop Pro'")
    f_xml = os.path.join(STRESS_DIR, "israsas_camt053.xml")
    create_camt053_xml(f_xml)

    case_id_12 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Lukas', 'lukas@eshoppro.lt', 'MB E-Shop Pro', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_12,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'israsas_camt053.xml', 'bank_statement', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_12, f_xml, os.path.getsize(f_xml)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_12)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price FROM accounting_cases WHERE id = ?", (case_id_12,))
    row12 = c.fetchone()
    conn.close()

    # 24 500 + 27 900 = 52 400 € apyvarta -> Tier 2 Smulki MB (160 €)
    passed_12 = (row12["annual_turnover"] == 52400.0) and (row12["calculated_price"] == 160.0)
    results.append({
        "scenario": "12. XML CAMT.053 banko išrašo atpažinimas",
        "passed": passed_12,
        "details": f"XML įplaukos (apyvarta): {row12['annual_turnover']} € (Tikėtasi: 52400.0 €), Kaina: {row12['calculated_price']} €"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_12 else 'FAIL'} | XML Apyvarta: {row12['annual_turnover']} €, Kaina: {row12['calculated_price']} €")

    # -------------------------------------------------------------------------
    # SCENARIJUS 13: Sugadintas / Tuščias 0 baitų failas - UAB „Defektas“
    # -------------------------------------------------------------------------
    print("\n[STRESS 7/7] Sugadintas 0 baitų failas - UAB 'Defektas'")
    f_empty = os.path.join(STRESS_DIR, "corrupted_empty_file.xls")
    create_corrupted_file(f_empty)

    case_id_13 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Vytautas', 'vytautas@defektas.lt', 'UAB Defektas', 'UAB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_13,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'corrupted_empty_file.xls', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_13, f_empty, os.path.getsize(f_empty)))
    conn.commit()
    conn.close()

    # Neturi mesti jokios kritinės klaidos / išimties
    try:
        pipe.analyze_case_documents(case_id_13)
        conn = pipe.get_db()
        c = conn.cursor()
        c.execute("SELECT issues_found, accountant_feedback FROM accounting_cases WHERE id = ?", (case_id_13,))
        row13 = c.fetchone()
        conn.close()
        survived_crash = True
        has_polite_response = "asmeniškai peržiūrėjau" in row13["accountant_feedback"].lower()
    except Exception as e:
        survived_crash = False
        has_polite_response = False

    passed_13 = survived_crash and has_polite_response
    results.append({
        "scenario": "13. Sugadinto 0 baitų failo atsparumas",
        "passed": passed_13,
        "details": f"Neįvyko sistemos lūžis: {survived_crash}, Mandagus atsakymas: {has_polite_response}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_13 else 'FAIL'} | Apsauga nuo lūžio: {survived_crash}")

    # -------------------------------------------------------------------------
    # GALUTINĖ IŠPLĖSTINIO STRESO TESTO SUVESTINĖ
    # -------------------------------------------------------------------------
    print("\n" + "=" * 85)
    print("🏆 IŠPLĖSTINIO STRESO IR DOKUMENTŲ KALIBRAVIMO REZULTATŲ SUVESTINĖ:")
    print("=" * 85)
    all_advanced_passed = True
    for r in results:
        status_icon = "✅ PASS" if r["passed"] else "❌ FAIL"
        if not r["passed"]:
            all_advanced_passed = False
        print(f"{status_icon} | {r['scenario']}")
        print(f"       Smulkesnė info: {r['details']}")
    print("=" * 85)

    if all_advanced_passed:
        print("🎉 VISI 7 NAUJI SUDĖTINGI SCENARIJAI ĮVEIKTI 100%! AGENTAI PILNAI SUKALIBRUOTI!")
    else:
        print("⚠️ APTIKTA KLAIDŲ KAI KURIUOSE SCENARIJUOSE.")

    return all_advanced_passed

if __name__ == "__main__":
    run_advanced_stress_suite()
