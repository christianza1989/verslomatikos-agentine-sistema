import os
import sys
import uuid
import json
import sqlite3
import csv
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

ULTRA_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "ultra_stress_files")
os.makedirs(ULTRA_DIR, exist_ok=True)

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

# 1. Generatorius: VšĮ projektinės pajamos ir parama
def create_vsi_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "VSI_Didzioji_Knyga"
    ws.append(["Sąskaita", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["2710", "Bankas Swedbank", 14500.0, 0.0])
    ws.append(["342", "Tikslinis finansavimas (Parama / Projektai)", 0.0, 34000.0])
    ws.append(["500", "Ūkinės komercinės veiklos pajamos (Bilietai)", 0.0, 8500.0])
    ws.append(["6114", "Autoriniai atlyginimai ir DU", 18000.0, 0.0])
    ws.append(["6118", "Projektų vykdymo sąnaudos", 12000.0, 0.0])
    wb.save(filepath)

# 2. Generatorius: Individuali veikla CSV
def create_iv_csv(filepath: str):
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["Data", "Dokumento Nr.", "Klientas", "Pajamos", "Sąnaudos"])
        writer.writerow(["2026-03-15", "SF-001", "UAB Klientas A", "14000.00", "0.00"])
        writer.writerow(["2026-06-20", "SF-002", "UAB Klientas B", "18000.00", "0.00"])
        writer.writerow(["2026-09-10", "SF-003", "MB Klientas C", "10000.00", "0.00"])
        writer.writerow(["2026-04-01", "KVT-101", "Apple Store kompiuteris", "0.00", "2800.00"])

# 3. Generatorius: PVM 45k slenksčio XLSX (44 200 €)
def create_vat_threshold_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Pardavimai_12men"
    ws.append(["Kodas", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["271", "Banko sąskaita", 8500.0, 0.0])
    ws.append(["500", "Pardavimo pajamos Lietuvoje (12 mėn. suma)", 0.0, 44200.0])
    ws.append(["600", "Paslaugų savikaina", 26000.0, 0.0])
    ws.append(["308", "Narių įnašai", 0.0, 500.0])
    wb.save(filepath)

# 4. Generatorius: Multi-valiutinis Wise CSV su 636 sąskaita
def create_wise_fx_csv(filepath: str):
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["Sąskaitos Nr.", "Pavadinimas", "Debetas", "Kreditas"])
        writer.writerow(["2711", "Wise USD sąskaita ($28,000)", "25400.00", "0.00"])
        writer.writerow(["5003", "Pardavimo pajamos JAV / ES (USD)", "0.00", "78000.00"])
        writer.writerow(["636", "Valiutų kursų pasikeitimo neigiama įtaka", "3200.00", "0.00"])
        writer.writerow(["600", "Veiklos sąnaudos", "42000.00", "0.00"])

# 5. Generatorius: Beviltiškos skolos XLSX (2411 = 18 000 €)
def create_bad_debt_xlsx(filepath: str):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Skolininkai"
    ws.append(["Sąskaita", "Pavadinimas", "Debetas", "Kreditas"])
    ws.append(["2411", "Pirkėjų įsiskolinimai (Bankrutavęs UAB Statyba)", 18000.0, 0.0])
    ws.append(["271", "Bankas", 4500.0, 0.0])
    ws.append(["500", "Pardavimo pajamos", 0.0, 62000.0])
    ws.append(["600", "Veiklos išlaidos", 38000.0, 0.0])
    wb.save(filepath)

# 6. Generatorius: Tikras PDF Bandomasis balansas per ReportLab
def create_trial_balance_pdf(filepath: str):
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    doc = SimpleDocTemplate(filepath, pagesize=A4, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('Title', parent=styles['Normal'], fontSize=14, leading=18, fontName='Helvetica-Bold')
    story.append(Paragraph("UAB 'Skuba Trans' - Bandomasis sąskaitų žiniaraštis (2026 m.)", title_style))
    story.append(Spacer(1, 15))

    data = [
        ["Sąskaitos Nr.", "Sąskaitos pavadinimas", "Debetas (€)", "Kreditas (€)"],
        ["1200", "Ilgalaikis transporto turtas (Vilkikai)", "85000.00", "0.00"],
        ["2411", "Pirkėjų skolos", "32000.00", "0.00"],
        ["2441", "Gautinas PVM iš biudžeto", "8500.00", "0.00"],
        ["2710", "Banko sąskaita (SEB)", "41000.00", "0.00"],
        ["301", "Įstatinis kapitalas", "0.00", "25000.00"],
        ["4430", "Skolos tiekėjams (Kuras)", "0.00", "48000.00"],
        ["500", "Pervežimų pardavimo pajamos", "0.00", "310000.00"],
        ["600", "Kuro ir transporto savikaina", "220000.00", "0.00"],
        ["6114", "Vairuotojų darbo užmokestis", "75000.00", "0.00"]
    ]

    t = Table(data, colWidths=[90, 240, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t)
    doc.build(story)

def run_ultra_stress_suite():
    print("=" * 85)
    print("⚡ PRADEDAMAS ULTRA-LYGIO BUHALTERIJOS AI AGENTŲ STRESO IR KALIBRAVIMO TESTAS (SCENARIJAI 14-20)")
    print("=" * 85)

    pipe = AccountingPipeline()
    mock_smtp = MockSMTP()
    pipe.smtp = mock_smtp
    results = []

    # -------------------------------------------------------------------------
    # SCENARIJUS 14: VšĮ / Ne pelno siekianti organizacija - VšĮ „Laisvas Teatras“
    # -------------------------------------------------------------------------
    print("\n[STRESS 14/20] VšĮ ne pelno organizacijos specifika (VšĮ 'Laisvas Teatras')")
    f_vsi = os.path.join(ULTRA_DIR, "vsi_teatras.xlsx")
    create_vsi_xlsx(f_vsi)

    case_id_14 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Rasa', 'rasa@laisvasteatras.lt', 'VšĮ Laisvas Teatras', 'VšĮ', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_14,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'vsi_teatras.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_14, f_vsi, os.path.getsize(f_vsi)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_14)

    q_vsi = "Mes esame VšĮ, gavome paramą ir projektinį finansavimą. Ar mums reikia teikti PLN204, jei esame ne pelno organizacija ir kaip su pelno mokesčiu?"
    rep_14, wait_14, meta_14 = classify_and_generate_reply(q_vsi, "Rasa", "VšĮ Laisvas Teatras", has_documents=True)

    explains_pln204n = "pln204n" in rep_14.lower()
    explains_support_0 = "pmį 5 str. 6" in rep_14 or "nėra apmokestinamos" in rep_14.lower() or "0,00 € mokestis" in rep_14
    no_call_14 = meta_14.get("call_requested") != 1

    passed_14 = explains_pln204n and explains_support_0 and no_call_14
    results.append({
        "scenario": "14. VšĮ ne pelno organizacijos specifika",
        "passed": passed_14,
        "details": f"PLN204N paaiškinta: {explains_pln204n}, Paramos 0% PM paaiškinta: {explains_support_0}, Be skambučio eskalacijos: {no_call_14}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_14 else 'FAIL'} | Topic: {meta_14.get('topic')}, PLN204N: {explains_pln204n}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 15: Individuali veikla (IV) vs MB / Turto perkėlimas - Jonas
    # -------------------------------------------------------------------------
    print("\n[STRESS 15/20] Individuali veikla (IV) pereinanti į MB - Jonas")
    f_iv = os.path.join(ULTRA_DIR, "iv_pajamos.csv")
    create_iv_csv(f_iv)

    q_iv = "Dirbau su individualia veikla, dabar atsidariau MB. Kaip teisiškai perkelti įrangą iš IV į MB ir ar verta 30% prezumpcija?"
    rep_15, wait_15, meta_15 = classify_and_generate_reply(q_iv, "Jonas", "MB Kodo Sprendimai", has_documents=False)

    explains_transfer = "nepiniginis įnašas" in rep_15.lower() or "pirkimo-pardavimo sutartis" in rep_15.lower()
    explains_diff = "gpm" in rep_15.lower() and "sodros" in rep_15.lower() and "02" in rep_15
    no_call_15 = meta_15.get("call_requested") != 1

    passed_15 = explains_transfer and explains_diff and no_call_15
    results.append({
        "scenario": "15. Individuali veikla (IV) vs MB perkėlimas",
        "passed": passed_15,
        "details": f"Turto įnešimas (įnašas/pirkimas): {explains_transfer}, Mokesčių optimizavimas (GPM/02 kodas): {explains_diff}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_15 else 'FAIL'} | Topic: {meta_15.get('topic')}, Teisėtas perkėlimas: {explains_transfer}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 16: PVM registracijos 45 000 € riba - MB „Vilniaus Siuntiniai“
    # -------------------------------------------------------------------------
    print("\n[STRESS 16/20] PVM registracijos 45 000 € riba - MB 'Vilniaus Siuntiniai'")
    f_vat = os.path.join(ULTRA_DIR, "pvm_44k.xlsx")
    create_vat_threshold_xlsx(f_vat)

    case_id_16 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Arūnas', 'arunas@vilniaussiuntiniai.lt', 'MB Vilniaus Siuntiniai', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_16,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'pvm_44k.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_16, f_vat, os.path.getsize(f_vat)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_16)

    q_vat = "Mūsų pajamos per 12 mėn. jau siekia 44 200 €. Labai bijau peržengti 45 000 € PVM ribą! Kas bus jei peržengsiu, ar privaloma registruotis pvm mokėtoju ir ar baus VMI?"
    rep_16, wait_16, meta_16 = classify_and_generate_reply(q_vat, "Arūnas", "MB Vilniaus Siuntiniai", has_documents=True)

    explains_71_str = "pvm įstatymo 71" in rep_16.lower() or "71 straipsn" in rep_16.lower()
    explains_12_rolling = "12 slenkančių mėnesių" in rep_16.lower() or "12 mėnes" in rep_16.lower()
    explains_fr0388 = "fr0388" in rep_16.lower()
    explains_excess_only = "tik nuo tos sumos, kuria buvo viršyta" in rep_16.lower() or "viršijančios dalies" in rep_16.lower()
    no_call_16 = meta_16.get("call_requested") != 1

    passed_16 = explains_71_str and explains_12_rolling and explains_fr0388 and explains_excess_only and no_call_16
    results.append({
        "scenario": "16. 45 000 € PVM ribos krizė",
        "passed": passed_16,
        "details": f"PVMĮ 71 str: {explains_71_str}, Slenkantis 12 mėn: {explains_12_rolling}, FR0388: {explains_fr0388}, Tik viršijanti dalis: {explains_excess_only}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_16 else 'FAIL'} | Topic: {meta_16.get('topic')}, FR0388: {explains_fr0388}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 17: Multi-valiutinis išrašas su 636 FX nuostoliu - UAB „Baltic Import“
    # -------------------------------------------------------------------------
    print("\n[STRESS 17/20] Multi-valiutinis išrašas ir 636 sąskaita - UAB 'Baltic Import'")
    f_wise = os.path.join(ULTRA_DIR, "wise_usd_fx.csv")
    create_wise_fx_csv(f_wise)

    case_id_17 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Darius', 'darius@balticimport.lt', 'UAB Baltic Import', 'UAB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_17,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'wise_usd_fx.csv', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_17, f_wise, os.path.getsize(f_wise)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_17)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price, pricing_tier FROM accounting_cases WHERE id = ?", (case_id_17,))
    row17 = c.fetchone()
    conn.close()

    # 78 000 € apyvarta -> Tier 2 (160 € bazė) + Tarptautinis priedas (30 €) = 190.00 €
    correct_price_17 = (row17["annual_turnover"] == 78000.0) and (row17["calculated_price"] == 190.0)

    q_fx = "Mūsų sąskaitoje Wise konvertavome USD ir bankas rodo valiutos kurso pasikeitimo nuostolį 636 sąskaitoje 3 200 €. Ar čia leidžiami atskaitymai pelno mokesčiui?"
    rep_17, wait_17, meta_17 = classify_and_generate_reply(q_fx, "Darius", "UAB Baltic Import", has_documents=True)

    explains_636_allowed = "636" in rep_17 and "leidžiami atskaitymai" in rep_17.lower()
    explains_ecb = "ecb" in rep_17.lower() or "europos centrinio banko" in rep_17.lower()

    passed_17 = correct_price_17 and explains_636_allowed and explains_ecb
    results.append({
        "scenario": "17. Multi-valiutos ir 636 valiutų kursų nuostoliai",
        "passed": passed_17,
        "details": f"Apyvarta 78k € ir kaina 190 €: {correct_price_17}, 636 leidžiami atskaitymai: {explains_636_allowed}, ECB kursas: {explains_ecb}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_17 else 'FAIL'} | Apyvarta: {row17['annual_turnover']} €, Kaina: {row17['calculated_price']} €, 636 statusas: {explains_636_allowed}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 18: Pykstantis klientas / BDAR teisė būti pamirštam - Romas
    # -------------------------------------------------------------------------
    print("\n[STRESS 18/20] Pykstantis klientas ir BDAR teisė būti pamirštam - Romas")
    q_bdar = "Iš kur gavote mano el. paštą?! Jūs man siunčiat šlamštą ir brukalą! Reikalauju nedelsiant ištrinti mano kontaktus pagal BDAR ir pasakyti iš kur duomenys, kitaip skųsiu VDAI!"
    rep_18, wait_18, meta_18 = classify_and_generate_reply(q_bdar, "Romas", "UAB Metalo Konstrukcijos", has_documents=False)

    explains_rc_source = "registrų centro juridinių asmenų" in rep_18.lower() or "vieši įmonių rekvizitai" in rep_18.lower()
    confirms_deleted = "nedelsiant pašalintas" in rep_18.lower() or "ištrintas" in rep_18.lower()
    no_sales_pitch = "kaina" not in rep_18.lower() and "balansas" not in rep_18.lower()
    no_call_18 = meta_18.get("call_requested") != 1

    passed_18 = explains_rc_source and confirms_deleted and no_sales_pitch and no_call_18
    results.append({
        "scenario": "18. BDAR pretenzija ir teisė būti pamirštam",
        "passed": passed_18,
        "details": f"Viešo šaltinio (RC) nurodymas: {explains_rc_source}, Ištrynimo patvirtinimas: {confirms_deleted}, Jokio brukalų siūlymo: {no_sales_pitch}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_18 else 'FAIL'} | Topic: {meta_18.get('topic')}, Ištrinta: {confirms_deleted}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 19: Beviltiškos pirkėjų skolos (2411 / Bankrotas) - MB „Inžineriniai Tinklai“
    # -------------------------------------------------------------------------
    print("\n[STRESS 19/20] Beviltiškos pirkėjų skolos (2411 / Bankrotas) - MB 'Inžineriniai Tinklai'")
    f_debt = os.path.join(ULTRA_DIR, "skolos_2411.xlsx")
    create_bad_debt_xlsx(f_debt)

    case_id_19 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Paulius', 'paulius@inzineriniaitinklai.lt', 'MB Inžineriniai Tinklai', 'MB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_19,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'skolos_2411.xlsx', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_19, f_debt, os.path.getsize(f_debt)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_19)

    q_debt = "Mūsų pirkėjas bankrutavo ir liko skolingas 18 000 € (2411 sąskaita). Ar galime nurašyti šią skolą į leidžiamus atskaitymus ir susigrąžinti PVM iš VMI?"
    rep_19, wait_19, meta_19 = classify_and_generate_reply(q_debt, "Paulius", "MB Inžineriniai Tinklai", has_documents=True)

    explains_pmi_25 = "pmį 25" in rep_19.lower()
    explains_vat_recovery = "pvmį 89-1" in rep_19.lower() or "fr0600" in rep_19.lower()
    explains_court_docs = "bankrutavęs" in rep_19.lower() or "teismo nutartis" in rep_19.lower()

    passed_19 = explains_pmi_25 and explains_vat_recovery and explains_court_docs
    results.append({
        "scenario": "19. Beviltiškos pirkėjų skolos (2411 / Bankrotas)",
        "passed": passed_19,
        "details": f"PMĮ 25 leidžiami atskaitymai: {explains_pmi_25}, PVM susigrąžinimas pagal 89-1 str: {explains_vat_recovery}, Teismo/RC įrodymai: {explains_court_docs}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_19 else 'FAIL'} | Topic: {meta_19.get('topic')}, PMĮ 25: {explains_pmi_25}, PVM susigrąžinimas: {explains_vat_recovery}")

    # -------------------------------------------------------------------------
    # SCENARIJUS 20: PDF Bandomasis balansas (UAB „Skuba Trans“ - Tier 4: 310 000 €)
    # -------------------------------------------------------------------------
    print("\n[STRESS 20/20] PDF Bandomojo balanso E2E analizė - UAB 'Skuba Trans' (Tier 4: 310k €)")
    f_pdf = os.path.join(ULTRA_DIR, "skuba_trans_balansas.pdf")
    create_trial_balance_pdf(f_pdf)

    case_id_20 = str(uuid.uuid4())
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO accounting_cases (id, client_name, client_email, company_name, company_type, status, waiting_for, created_at, updated_at)
        VALUES (?, 'Valdas', 'valdas@skubatrans.lt', 'UAB Skuba Trans', 'UAB', 'new', 'client_documents', datetime('now'), datetime('now'))
    """, (case_id_20,))
    c.execute("""
        INSERT INTO accounting_documents (id, case_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, 'skuba_trans_balansas.pdf', 'trial_balance', ?, ?, datetime('now'))
    """, (str(uuid.uuid4()), case_id_20, f_pdf, os.path.getsize(f_pdf)))
    conn.commit()
    conn.close()

    pipe.analyze_case_documents(case_id_20)
    conn = pipe.get_db()
    c = conn.cursor()
    c.execute("SELECT annual_turnover, calculated_price, pricing_tier FROM accounting_cases WHERE id = ?", (case_id_20,))
    row20 = c.fetchone()
    conn.close()

    # 310 000 € apyvarta -> Tier 4 (360 € bazė)
    # Priedai: DU UAB su 75k DU (+30 €), Ilgalaikis turtas 85k (+20 €) = 410.00 €
    turnover_20 = row20["annual_turnover"]
    price_20 = row20["calculated_price"]
    tier_20 = row20["pricing_tier"]

    # Patikriname 2 etapų išsiuntimą
    res_stage1 = pipe.approve_case_and_dispatch(case_id_20)
    res_stage2 = pipe.deliver_final_package_and_invoice(case_id_20)

    # 1 etape NETURI būti SF, 2 etape TURI būti SF
    stage1_has_sf = any("LZ-" in att for att in mock_smtp.sent_emails[-2]["attachments"])
    stage2_has_sf = any("LZ-" in att for att in mock_smtp.sent_emails[-1]["attachments"])

    passed_20 = (turnover_20 == 310000.0) and (price_20 == 410.0) and (not stage1_has_sf) and stage2_has_sf
    results.append({
        "scenario": "20. PDF Bandomojo balanso analizė ir 2 etapų SF pristatymas",
        "passed": passed_20,
        "details": f"PDF apyvarta 310k €: {turnover_20 == 310000.0}, Tier 4 kaina 410 €: {price_20 == 410.0}, 1 etapas be SF: {not stage1_has_sf}, 2 etapas su SF: {stage2_has_sf}"
    })
    print(f"  ✓ Rezultatas: {'PASS' if passed_20 else 'FAIL'} | PDF Apyvarta: {turnover_20:,.2f} €, Kaina: {price_20} €, 2 etapų SF: {not stage1_has_sf and stage2_has_sf}")

    # -------------------------------------------------------------------------
    # GALUTINĖ ULTRA-STRESO SUVESTINĖ
    # -------------------------------------------------------------------------
    print("\n" + "=" * 85)
    print("🏆 ULTRA-STRESO (SCENARIJAI 14-20) TESTAVIMO REZULTATŲ SUVESTINĖ:")
    print("=" * 85)
    all_ultra_passed = True
    for r in results:
        status_icon = "✅ PASS" if r["passed"] else "❌ FAIL"
        if not r["passed"]:
            all_ultra_passed = False
        print(f"{status_icon} | {r['scenario']}")
        print(f"       Smulkesnė info: {r['details']}")
    print("=" * 85)

    if all_ultra_passed:
        print("🎉 VISI 7 ULTRA-STRESO SCENARIJAI ĮVEIKTI 100%! AGENTAI PASIEKĖ ABSOLIUTŲ KALIBRAVIMO LYGĮ!")
    else:
        print("⚠️ APTIKTA KLAIDŲ KAI KURIUOSE ULTRA SCENARIJUOSE.")

    return all_ultra_passed

if __name__ == "__main__":
    run_ultra_stress_suite()
