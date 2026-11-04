import os
import sys
import subprocess
from datetime import datetime
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_REPORTS_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "audit_reports")
os.makedirs(AUDIT_REPORTS_DIR, exist_ok=True)

def generate_client_audit_pdf(
    case_id: str,
    client_name: str = "Lilija",
    company_name: str = "MB Prekybos Sprendimai",
    accountant_feedback: str = "",
    findings: List[Dict[str, Any]] = None
) -> str:
    today_str = datetime.now().strftime("%Y-%m-%d")
    report_number = f"AUD-2026-{case_id[:6].upper()}"

    if not findings:
        findings = []

    # KPI reikšmės pagal realias anomalijas
    equity_val = "-6 762,09 €"
    result_val = "-5 383,41 €"
    pvm_val = "+4 796,29 €"

    for f in findings:
        if "nuosavas kapitalas" in f.get("name", "").lower():
            equity_val = f"-{f.get('value', 0):,.2f} €"
        elif "veiklos rezultatas" in f.get("name", "").lower():
            result_val = f"-{f.get('value', 0):,.2f} €"
        elif "pvm" in f.get("name", "").lower():
            pvm_val = f"+{f.get('value', 0):,.2f} €"

    findings_rows_html = ""
    for f in findings:
        badge_color = "#ef4444" if f.get("severity") == "high" else "#10b981" if f.get("severity") == "opportunity" else "#f59e0b"
        badge_bg = "#fef2f2" if f.get("severity") == "high" else "#ecfdf5" if f.get("severity") == "opportunity" else "#fffbeb"
        type_title = "KRITINĖ RIZIKA" if f.get("severity") == "high" else "MOKESČIŲ / LĖŠŲ GRAŽINIMAS" if f.get("severity") == "opportunity" else "REKOMENDACIJA"
        
        findings_rows_html += f"""
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid {badge_color}; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="background: {badge_bg}; color: {badge_color}; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                {type_title}
              </span>
              <strong style="margin-left: 8px; font-size: 13px; color: #0f172a;">{f.get('name')} (Sąskaita: {f.get('account')})</strong>
            </div>
            <span style="font-weight: 800; font-size: 13px; color: {badge_color};">
              {f.get('value', 0):,.2f} €
            </span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.45;">
            {f.get('note')}
          </p>
        </div>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="lt">
<head>
<meta charset="UTF-8">
<title>Mokesčių ir Apskaitos Audito Išvada - {company_name}</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 14mm 14mm 14mm 14mm;
  }}
  * {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.45;
    font-size: 12px;
    margin: 0;
    padding: 0;
  }}
  .page {{
    page-break-after: always;
    position: relative;
    min-height: 268mm;
  }}
  .page:last-child {{
    page-break-after: avoid;
  }}
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #312e81;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }}
  .brand {{
    font-size: 16px;
    font-weight: 800;
    color: #312e81;
    letter-spacing: -0.3px;
  }}
  .badge-official {{
    background: #eef2ff;
    color: #4338ca;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
  }}
  h1 {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }}
  h2 {{
    font-size: 14.5px;
    font-weight: 800;
    color: #1e1b4b;
    border-left: 4px solid #4f46e5;
    padding-left: 8px;
    margin: 16px 0 10px 0;
  }}
  .meta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 11.5px;
  }}
  .kpi-row {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px;
  }}
  .kpi-box {{
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px 14px;
    text-align: center;
  }}
  .kpi-val {{
    font-size: 17px;
    font-weight: 800;
    margin: 4px 0 2px 0;
  }}
  .quote-box {{
    background: #f0fdf4;
    border-left: 4px solid #10b981;
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    margin: 14px 0;
    font-size: 12px;
    color: #14532d;
    line-height: 1.5;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 18px 0;
    font-size: 11px;
  }}
  th {{
    background: #1e293b;
    color: #ffffff;
    font-weight: 700;
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #1e293b;
  }}
  td {{
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
  }}
  .footer {{
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    font-size: 10.5px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }}
</style>
</head>
<body>

<!-- PUSLAPIS 1 -->
<div class="page">
  <div class="header">
    <div class="brand">VERSLOMATIKA B2B • VYRIAUSIOSIOS BUHALTERĖS BIURAS</div>
    <div class="badge-official">Nepriklausoma Audito Išvada #{report_number}</div>
  </div>

  <h1>PRIEŠMETINIS MOKESČIŲ IR APSKAITOS AUDITAS</h1>
  <p style="color: #64748b; margin-top: 0; font-size: 12px;">
    Ataskaita parengta pagal 2026-01-01 – 2026-09-30 Darbinės atskaitomybės parengimo lentelės duomenis.
  </p>

  <div class="meta-grid">
    <div>
      <strong>UŽSAKOVAS:</strong> {company_name}<br>
      <strong>ATSTOVAS:</strong> {client_name}<br>
      <strong>DATA:</strong> {today_str}<br>
      <strong>VEIKLOS TIPAS:</strong> Mažoji bendrija (MB)
    </div>
    <div>
      <strong>AUDITORIUS:</strong> Vyriausioji buhalterė Lilija Zapasnik<br>
      <strong>KVALIFIKACIJA:</strong> 25 metų vyr. buhalterio praktinė patirtis<br>
      <strong>VEIKLOS PAGRINDAS:</strong> Individuali veikla pagal pažymą Nr. 34566444
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box" style="border-top: 3px solid #ef4444;">
      <div style="font-size: 10.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Nuosavas kapitalas</div>
      <div class="kpi-val" style="color: #ef4444;">{equity_val}</div>
      <div style="font-size: 10px; color: #475569;">Neigiamas (kapitalo atstatymo rizika)</div>
    </div>
    <div class="kpi-box" style="border-top: 3px solid #3b82f6;">
      <div style="font-size: 10.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Veiklos rezultatas (9 mėn.)</div>
      <div class="kpi-val" style="color: #1e40af;">{result_val}</div>
      <div style="font-size: 10px; color: #475569;">Nuostolis (Pelno mokestis: 0 €)</div>
    </div>
    <div class="kpi-box" style="border-top: 3px solid #10b981;">
      <div style="font-size: 10.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Gautinas PVM iš VMI</div>
      <div class="kpi-val" style="color: #10b981;">{pvm_val}</div>
      <div style="font-size: 10px; color: #475569;">Permoka (grąžintina suma)</div>
    </div>
  </div>

  <h2>Vyriausiosios Buhalterės Asmeninis Komentaras Vadovui</h2>
  <div class="quote-box">
    <strong>Lilija Zapasnik (25 m. vyr. buhalterio patirtis):</strong><br><br>
    <em>„{accountant_feedback}“</em>
  </div>

  <h2>Nustatytų Apskaitos ir Finansinių Rūpesčių Santrauka</h2>
  {findings_rows_html}

  <div class="footer">
    <span>Verslomatika B2B • Audito ataskaita #{report_number}</span>
    <span>Puslapis 1 iš 2</span>
  </div>
</div>

<!-- PUSLAPIS 2 -->
<div class="page">
  <div class="header">
    <div class="brand">VERSLOMATIKA B2B • VYRIAUSIOSIOS BUHALTERĖS BIURAS</div>
    <div class="badge-official">Veiksmų Planas Vadovui</div>
  </div>

  <h2>Privalomi Veiksmai Vadovui IKI Gruodžio 31 d.</h2>
  <p style="color: #475569; font-size: 11.5px;">
    Remiantis LR Mažųjų bendrijų įstatymu bei LR Pelno mokesčio įstatymu, pateikiame konkrečius žingsnius finansinių metų pabaigai:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 8%;">Nr.</th>
        <th style="width: 30%;">Sritis</th>
        <th style="width: 44%;">Teisinis veiksmas ir sprendimas</th>
        <th style="width: 18%;">Terminas</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center; font-weight: 700;">1</td>
        <td><strong>Neigiamo nuosavo kapitalo atstatymas (3411 / 308)</strong></td>
        <td>MB narių susirinkimo sprendimu įforminti papildomus narių įnašus arba suformuoti nuostolių dengimo tvarką, kad nuosavas kapitalas netaptų neigiamas metinėje atskaitomybėje Registrų centrui.</td>
        <td style="color: #ef4444; font-weight: 700;">Iki 2026-12-31</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700;">2</td>
        <td><strong>Pirkėjų avansų kontrolė (4420)</strong></td>
        <td>Kadangi gautų avansų suma (33 630 €) 48 kartus viršija banko ir kasos likučius (~700 €), atlikti prekių/užsakymų vykdymo inventorizaciją ir pasirašyti prekių perdavimo aktus.</td>
        <td style="font-weight: 700;">Iki 2026-12-31</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700;">3</td>
        <td><strong>PVM permokos grąžinimas / užskaitymas (2441)</strong></td>
        <td>Pateikti prašymą VMI (Mano VMI sistemoje) dėl sukauptos 4 796 € PVM permokos grąžinimo į įmonės Swedbank sąskaitą apyvartinėms lėšoms atkurti.</td>
        <td style="font-weight: 700;">Iki 2026-11-30</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700;">4</td>
        <td><strong>Nuostolio perkėlimas ir neleidžiami atskaitymai (PLN204)</strong></td>
        <td>Tinkamai užpildyti metinę PLN204 deklaraciją: atskirti 2 014 € neleidžiamų sąnaudų (631204) ir įforminti perkeliamo nuostolio dydį pagal PMĮ 30 str.</td>
        <td style="font-weight: 700;">Iki metinės deklaracijos</td>
      </tr>
    </tbody>
  </table>

  <h2>Tolimesnė Pagalba ir Garantija</h2>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; font-size: 11.5px; line-height: 1.5;">
    Jeigu pageidaujate, kad vyriausioji buhalterė pati paruoštų MB narių sprendimus dėl kapitalo, atliktų PVM permokos grąžinimo procedūras VMI ir teisingai suformuotų metines PLN204 deklaracijas – mes galime pilnai perimti šį procesą.<br><br>
    <strong>Kontaktai konsultacijai:</strong><br>
    Vyriausioji buhalterė: Lilija Zapasnik • Tel.: +370 611 11111 • El. paštas: lilijazap@gmail.com<br>
    Klientų koordinatorius: Tomas | tomas@verslomatika.lt
  </div>

  <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
    <div>
      Audito išvadą parengė ir patvirtino:<br><br>
      ____________________________________<br>
      <strong>Vyriausioji buhalterė Lilija Zapasnik</strong><br>
      <span style="font-size: 10.5px; color: #64748b;">(25 m. praktinė vyr. buhalterio patirtis, IV Nr. 34566444)</span>
    </div>
    <div style="text-align: right;">
      Susipažinau ir ataskaitą priėmiau:<br><br>
      ____________________________________<br>
      <strong>{client_name} ({company_name})</strong><br>
      <span style="font-size: 10.5px; color: #64748b;">(Elektroninis patvirtinimas galioja be fizinio parašo)</span>
    </div>
  </div>

  <div class="footer">
    <span>Verslomatika B2B • Audito ataskaita #{report_number}</span>
    <span>Puslapis 2 iš 2</span>
  </div>
</div>

</body>
</html>"""

    html_file = os.path.join(AUDIT_REPORTS_DIR, f"{report_number}.html")
    pdf_file = os.path.join(AUDIT_REPORTS_DIR, f"{report_number}.pdf")

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        edge_path,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_file}",
        f"file:///{html_file.replace(os.sep, '/')}"
    ]

    subprocess.run(cmd, capture_output=True)

    if os.path.exists(pdf_file):
        print(f"[Client Audit Generator] Generated REAL PDF report: {pdf_file}")
        return pdf_file
    else:
        print("[Client Audit Generator] Failed to generate client PDF report.")
        return ""
