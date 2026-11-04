import os
import sys
import subprocess
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.accounting_pricing import lithuanian_number_to_words

INVOICES_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "invoices")
os.makedirs(INVOICES_DIR, exist_ok=True)

def generate_invoice_pdf(
    invoice_number: str = "LZ-2026-001",
    client_name: str = "Lilija",
    client_company: str = "MB Prekybos Sprendimai",
    client_email: str = "lilijazap@gmail.com",
    service_title: str = "Metinė finansinė atskaitomybė (VAS) ir PLN204 mokesčių deklaracija",
    amount: float = 190.00,
    line_items: Optional[List[Dict[str, Any]]] = None,
    suma_zodziais: Optional[str] = None
) -> str:
    today_str = datetime.now().strftime("%Y-%m-%d")
    due_str = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

    # Jei eilutės pateiktos, perskaičiuojame sumą
    if line_items and len(line_items) > 0:
        amount = sum(float(it.get("amount", 0.0)) for it in line_items)
    else:
        line_items = [
            {
                "title": service_title,
                "subtitle": "Metinės finansinės atskaitomybės sudarymas (Balansas, PNA), VMI PLN204 deklaracija ir mokesčių auditas",
                "amount": amount
            }
        ]

    if not suma_zodziais:
        suma_zodziais = lithuanian_number_to_words(amount)

    table_rows_html = ""
    for idx, item in enumerate(line_items, 1):
        t = item.get("title", "")
        sub = item.get("subtitle", "")
        sub_html = f'<br><span style="color: #64748b; font-size: 11px;">{sub}</span>' if sub else ""
        item_amt = float(item.get("amount", 0.0))
        amt_str = f"{item_amt:.2f} €" if item_amt > 0 else "0.00 € (Įskaičiuota)"
        amt_style = "font-weight: 700; color: #0f172a;" if item_amt > 0 else "color: #16a34a; font-weight: 600;"

        table_rows_html += f"""
    <tr>
      <td style="text-align: center; vertical-align: top;">{idx}</td>
      <td style="vertical-align: top;">
        <strong style="color: #0f172a;">{t}</strong>
        {sub_html}
      </td>
      <td style="text-align: center; vertical-align: top;">vnt.</td>
      <td style="text-align: center; vertical-align: top;">1</td>
      <td style="text-align: right; vertical-align: top; {amt_style}">{amt_str}</td>
    </tr>"""

    html_content = f"""<!DOCTYPE html>
<html lang="lt">
<head>
<meta charset="UTF-8">
<title>Sąskaita-Faktūra {invoice_number}</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 12mm 14mm 10mm 14mm;
  }}
  * {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.35;
    font-size: 11.5px;
    margin: 0;
    padding: 0;
  }}
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }}
  .doc-title {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin: 0 0 2px 0;
  }}
  .doc-number {{
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
  }}
  .dates {{
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }}
  .grid-parties {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }}
  .party-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
  }}
  .party-title {{
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 4px;
  }}
  .party-name {{
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }}
  .party-meta {{
    font-size: 11px;
    color: #475569;
    line-height: 1.4;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }}
  th {{
    background: #1e293b;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    font-size: 11px;
    border: 1px solid #1e293b;
  }}
  td {{
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    font-size: 11px;
  }}
  .total-card {{
    margin-left: auto;
    width: 290px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 14px;
  }}
  .total-row {{
    display: flex;
    justify-content: space-between;
    font-size: 11.5px;
    color: #475569;
    margin-bottom: 4px;
  }}
  .total-row.final {{
    border-top: 2px solid #cbd5e1;
    padding-top: 4px;
    margin-top: 4px;
    font-size: 14.5px;
    font-weight: 800;
    color: #0f172a;
  }}
  .bank-details {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 14px;
    color: #166534;
    font-size: 11px;
  }}
  .signatures {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px dashed #cbd5e1;
    font-size: 11px;
    color: #64748b;
  }}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1 class="doc-title">SĄSKAITA - FAKTŪRA</h1>
    <div class="doc-number">Serija LZ Nr. {invoice_number}</div>
    <div class="dates">
      Išrašymo data: <strong>{today_str}</strong> | Apmokėti iki: <strong>{due_str}</strong>
    </div>
  </div>
  <div style="text-align: right;">
    <span style="background: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;">
      OFICIALUS FINANSINIS DOKUMENTAS
    </span>
  </div>
</div>

<div class="grid-parties">
  <div class="party-card">
    <div class="party-title">PASLAUGŲ TEIKĖJAS (PARDAVĖJAS):</div>
    <div class="party-name">Lilija Zapasnik</div>
    <div class="party-meta">
      Individualios veiklos pažymos Nr.: <strong>34566444</strong><br>
      Adresas: Molynės g. 2C, Vilnius<br>
      Telefonas: +370 611 11111<br>
      El. paštas: lilijazap@gmail.com
    </div>
  </div>

  <div class="party-card">
    <div class="party-title">PIRKĖJAS (KLIENTAS):</div>
    <div class="party-name">{client_company}</div>
    <div class="party-meta">
      Atstovas: <strong>{client_name}</strong><br>
      El. paštas: {client_email}<br>
      Užsakymo tipas: Metinė finansinė atskaitomybė ir PLN204 deklaracija
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width: 6%;">Nr.</th>
      <th style="width: 58%;">Paslaugos pavadinimas ir aprašymas</th>
      <th style="width: 10%; text-align: center;">Mato vnt.</th>
      <th style="width: 8%; text-align: center;">Kiekis</th>
      <th style="width: 18%; text-align: right;">Suma (€)</th>
    </tr>
  </thead>
  <tbody>
    {table_rows_html}
  </tbody>
</table>

<div class="total-card">
  <div class="total-row">
    <span>Tarpinė suma:</span>
    <span>{amount:.2f} €</span>
  </div>
  <div class="total-row">
    <span>PVM (ne PVM mokėtojas):</span>
    <span>0.00 €</span>
  </div>
  <div class="total-row final">
    <span>MOKĖTINA SUMA:</span>
    <span>{amount:.2f} €</span>
  </div>
</div>

<div class="bank-details">
  <strong style="display: block; font-size: 13px; margin-bottom: 4px;">MOKĖJIMO REKVIZITAI:</strong>
  Gavėjas: <strong>Lilija Zapasnik</strong><br>
  Atsiskaitomoji sąskaita (IBAN): <strong>LT34 7300 0101 2345 6789</strong> (Swedbank, AB)<br>
  Mokėjimo paskirtis: <strong>Apmokėjimas už finansinę atskaitomybę ir mokesčių auditą pagal sąskaitą {invoice_number}</strong>
</div>

<div style="font-size: 11.5px; color: #64748b; margin-top: 10px;">
  Suma žodžiais: <em>{suma_zodziais}</em><br>
  Paslaugų suteikimo vieta: Lietuva. Sąskaita-faktūra išrašyta elektroniniu būdu ir galioja be fizinio parašo.
</div>

<div class="signatures">
  <div>
    Sąskaitą išrašė:<br><br>
    _______________________<br>
    <strong>Lilija Zapasnik</strong>
  </div>
  <div style="text-align: right;">
    Sąskaitą gavo:<br><br>
    _______________________<br>
    <strong>{client_name} ({client_company})</strong>
  </div>
</div>

</body>
</html>"""

    html_file = os.path.join(INVOICES_DIR, f"{invoice_number}.html")
    pdf_file = os.path.join(INVOICES_DIR, f"{invoice_number}.pdf")

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
        print(f"[Invoice Generator] Generated PDF invoice at: {pdf_file}")
        return pdf_file
    else:
        print("[Invoice Generator] Failed to generate PDF invoice.")
        return ""

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    generate_invoice_pdf()
