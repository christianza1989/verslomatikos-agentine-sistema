import os
import sys
import uuid
import json
import sqlite3
import csv
import pypdf
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

from core.accounting_pipeline import AccountingPipeline
from core.accounting_pricing import calculate_accounting_price
from core.invoice_generator import generate_invoice_pdf

# Sukuriame laikiną katalogą testiniams failams
TEST_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "test_calibration_files")
os.makedirs(TEST_DIR, exist_ok=True)

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

def create_synthetic_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Bandomasis"
    ws.append(["Sąskaita", "Pavadinimas", "Pradinis Debetas", "Pradinis Kreditas", "Apyvarta Debetas", "Apyvarta Kreditas", "Likutis Debetas", "Likutis Kreditas"])
    ws.append(["1200", "Ilgalaikis turtas", 5000, 0, 0, 0, 5000, 0])
    ws.append(["2441", "Gautinas PVM", 1200, 0, 800, 0, 2000, 0])
    ws.append(["271", "Bankas Swedbank", 300, 0, 25000, 24800, 500, 0])
    ws.append(["308", "Narių įnašai", 0, 1000, 0, 0, 0, 1000])
    ws.append(["3411", "Sukauptas nuostolis", 4500, 0, 0, 0, 4500, 0])
    ws.append(["4420", "Pirkėjų avansai", 0, 15000, 0, 5000, 0, 20000])
    ws.append(["500", "Pardavimo pajamos", 0, 0, 0, 65000, 0, 65000])
    ws.append(["5003", "ES prekyba", 0, 0, 0, 3200, 0, 3200])
    ws.append(["600", "Prekių savikaina", 0, 0, 24000, 0, 24000, 0])
    ws.append(["6114", "Darbo užmokestis", 0, 0, 16000, 0, 16000, 0])
    ws.append(["631204", "Neleidžiami atskaitymai", 0, 0, 1500, 0, 1500, 0])
    wb.save(filepath)

def create_synthetic_csv(filepath: str):
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["Sąskaitos Nr.", "Pavadinimas", "Debetas", "Kreditas"])
        writer.writerow(["2710", "Banko sąskaita", "4500.50", "0.00"])
        writer.writerow(["5000", "Pardavimo pajamos", "0.00", "32000.00"])
        writer.writerow(["6000", "Paslaugų sąnaudos", "18400.00", "0.00"])
        writer.writerow(["3411", "Ataskaitinis nuostolis", "2100.00", "0.00"])

def create_dummy_receipt_image(filepath: str):
    # Sukuriame nedidelį binarinį failą imituojantį atsiųstą čekio nuotrauką
    with open(filepath, "wb") as f:
        f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00FakeReceiptPhotoDataBytes1234567890")

def run_e2e_stress_test():
    print("=" * 80)
    print("🔬 PRADEDAMAS GILUSIS E2E DOKUMENTŲ IR KLAIDŲ APDOROJIMO STRESO TESTAS")
    print("=" * 80)

    pipe = AccountingPipeline()
    mock_smtp = MockSMTP()
    pipe.smtp = mock_smtp

    e2e_results = []

    # 1. TESTAS: Pilnas XLSX bandomasis balansas su ES prekyba ir neleidžiamais
    print("\n[E2E 1/4] Testuojamas XLSX bandomasis balansas (UAB 'Baltic Solutions')")
    xlsx_path = os.path.join(TEST_DIR, "balansas_baltic_solutions.xlsx")
    create_synthetic_xlsx(xlsx_path)

    case_id_1 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Laimonas', 'laimonas@balticsolutions.lt', 'UAB Baltic Solutions', 'UAB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_1,))
    
    with open(xlsx_path, "rb") as f:
        data_bytes = f.read()
    
    doc_id = str(uuid.uuid4())
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'balansas_baltic_solutions.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (doc_id, case_id_1, xlsx_path, len(data_bytes)))
    conn.commit()
    conn.close()

    # Vykdome analizę
    analysis_res = pipe.analyze_case_documents(case_id_1)
    
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price, pricing_tier, issues_found FROM accounting_cases WHERE id = ?", (case_id_1,))
    row = c.fetchone()
    conn.close()

    turnover = row["annual_turnover"]
    price = row["calculated_price"]
    tier = row["pricing_tier"]
    issues = row["issues_found"]

    passed_xlsx = (turnover in (65000.0, 68200.0)) and (price == 220.0) and (issues >= 3)
    e2e_results.append({
        "test": "1. XLSX Bandomojo balanso E2E analizė",
        "passed": passed_xlsx,
        "details": f"Apyvarta: {turnover} € (Tikėtasi: 65 000 – 68 200 €), Kaina: {price} € (Tikėtasi 220 €: 160 € bazė + 30 € ES + 30 € DU UAB), Rasta anomalijų: {issues}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_xlsx else 'FAIL'} | Apyvarta: {turnover} €, Kaina: {price} €, Rasta punktų: {issues}")

    # 2. TESTAS: CSV failo analizė (MB 'Greitas Startas')
    print("\n[E2E 2/4] Testuojamas CSV failas (MB 'Greitas Startas')")
    csv_path = os.path.join(TEST_DIR, "israsas_greitas_startas.csv")
    create_synthetic_csv(csv_path)

    case_id_2 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Simas', 'simas@greitasstartas.lt', 'MB Greitas Startas', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_2,))
    
    with open(csv_path, "rb") as f:
        csv_bytes = f.read()
    
    doc_id_2 = str(uuid.uuid4())
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'israsas_greitas_startas.csv', 'trial_balance', ?, ?, datetime('now'))
    """, (doc_id_2, case_id_2, csv_path, len(csv_bytes)))
    conn.commit()
    conn.close()

    analysis_res_2 = pipe.analyze_case_documents(case_id_2)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price, pricing_tier FROM accounting_cases WHERE id = ?", (case_id_2,))
    row2 = c.fetchone()
    conn.close()

    passed_csv = (row2["annual_turnover"] == 32000.0) and (row2["calculated_price"] == 160.0)
    e2e_results.append({
        "test": "2. CSV failo automatinis atpažinimas",
        "passed": passed_csv,
        "details": f"Apyvarta: {row2['annual_turnover']} € (Tikėtasi: 32000 €), Kaina: {row2['calculated_price']} € (Smulki MB bazė 160 €)"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_csv else 'FAIL'} | Apyvarta: {row2['annual_turnover']} €, Kaina: {row2['calculated_price']} €")

    # 3. TESTAS: Čekio nuotrauka be sąskaitų (Fallback be klaidų ar netikrų skaičių)
    print("\n[E2E 3/4] Testuojamas netinkamas/nuotraukos failas (Čekis / Kvitas JPG)")
    jpg_path = os.path.join(TEST_DIR, "revolut_kvitas.jpg")
    create_dummy_receipt_image(jpg_path)

    case_id_3 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Darius', 'darius@kvitas.lt', 'MB Kvitukas', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_3,))
    
    with open(jpg_path, "rb") as f:
        jpg_bytes = f.read()
    
    doc_id_3 = str(uuid.uuid4())
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'revolut_kvitas.jpg', 'scanned_image', ?, ?, datetime('now'))
    """, (doc_id_3, case_id_3, jpg_path, len(jpg_bytes)))
    conn.commit()
    conn.close()

    analysis_res_3 = pipe.analyze_case_documents(case_id_3)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT issues_found, accountant_feedback FROM accounting_cases WHERE id = ?", (case_id_3,))
    row3 = c.fetchone()
    conn.close()

    no_fake_zeros = "dirba pelningai (pelnas: 0.00 €)" not in row3["accountant_feedback"]
    has_polite_guidance = "pirminiai failai" in row3["accountant_feedback"].lower() or "dokumentai sėkmingai gauti" in row3["accountant_feedback"].lower()

    passed_img = no_fake_zeros and has_polite_guidance
    e2e_results.append({
        "test": "3. Nuotraukos / Netinkamo failo saugus apdorojimas",
        "passed": passed_img,
        "details": f"Jokių išgalvotų 0.00 € pelno frazių: {no_fake_zeros}, Mandagus paaiškinimas: {has_polite_guidance}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_img else 'FAIL'} | Feedback saugumas: {passed_img}")

    # 4. TESTAS: Pilnas 2-etapų išsiuntimas (1 etapas: SF nesiunčiama -> 2 etapas: SF atsiunčiama)
    print("\n[E2E 4/4] Testuojamas 2 etapų išsiuntimas ir SF prisegimo laikas")
    # 1 Etapas: approve_case_and_dispatch
    pipe.approve_case_and_dispatch(case_id_1)
    
    # Tikriname ar 1 etapo laiške NĖRA sąskaitos-faktūros
    last_sent_1 = mock_smtp.sent_emails[-1]
    has_invoice_in_stage_1 = any("LZ-2026" in att for att in last_sent_1["attachments"])
    has_audit_pdf_1 = any("aud" in att.lower() for att in last_sent_1["attachments"])
    
    # 2 Etapas: deliver_final_package_and_invoice
    pipe.deliver_final_package_and_invoice(case_id_1)
    last_sent_2 = mock_smtp.sent_emails[-1]
    has_invoice_in_stage_2 = any("LZ-2026" in att for att in last_sent_2["attachments"])
    has_statements_pdf_2 = any("Finansines_Atskaitomybes" in att for att in last_sent_2["attachments"])
    
    passed_timing = (not has_invoice_in_stage_1) and has_audit_pdf_1 and has_invoice_in_stage_2 and has_statements_pdf_2
    e2e_results.append({
        "test": "4. Sąskaitos-faktūros prisegimas TIK 2 etape",
        "passed": passed_timing,
        "details": f"1 Etapas be SF: {not has_invoice_in_stage_1}, 1 Etapas turi auditą: {has_audit_pdf_1}, 2 Etapas turi SF: {has_invoice_in_stage_2}, 2 Etapas turi 4 psl. paketą: {has_statements_pdf_2}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_timing else 'FAIL'} | 1 Etapas SF: {has_invoice_in_stage_1} (turi būti False), 2 Etapas SF: {has_invoice_in_stage_2} (turi būti True)")

    # SUVESTINĖ
    print("\n" + "=" * 80)
    print("🏁 E2E DOKUMENTŲ IR KALIBRAVIMO STRESO TESTŲ REZULTATAI:")
    print("=" * 80)
    all_e2e_passed = True
    for r in e2e_results:
        icon = "✅ PASS" if r["passed"] else "❌ FAIL"
        if not r["passed"]:
            all_e2e_passed = False
        print(f"{icon} | {r['test']}")
        print(f"       Info: {r['details']}")
    print("=" * 80)

    if all_e2e_passed:
        print("🎉 VISI E2E DOKUMENTŲ STRESO TESTAI SĖKMINGAI ĮVEIKTI! SISTEMA YRA 100% PARUOŠTA!")
    else:
        print("⚠️ APTIKTA KLAIDŲ E2E CIKLE.")

    return all_e2e_passed

if __name__ == "__main__":
    run_e2e_stress_test()
