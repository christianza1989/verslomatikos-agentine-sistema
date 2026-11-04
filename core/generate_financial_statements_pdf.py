import os
import sys
import subprocess
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATEMENTS_DIR = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "financial_statements")
os.makedirs(STATEMENTS_DIR, exist_ok=True)

def generate_financial_package_pdf(
    client_name: str = "Lilija",
    company_name: str = "MB Prekybos Sprendimai"
) -> str:
    """
    Sugeneruoja oficialų 3 dokumentų rinkinį:
    1. Oficialų Balansą (pagal VAS sutrumpintą formą)
    2. Oficialią Pelno (nuostolių) ataskaitą (pagal VAS)
    3. Užpildytą VMI Pelno mokesčio deklaracijos PLN204 suvestinę
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    out_pdf = os.path.join(STATEMENTS_DIR, "Finansines_Atskaitomybes_ir_PLN204_Rinkinys_2026.pdf")
    html_file = os.path.join(STATEMENTS_DIR, "statements.html")

    html_content = f"""<!DOCTYPE html>
<html lang="lt">
<head>
<meta charset="UTF-8">
<title>Finansinė Atskaitomybė ir PLN204 - {company_name}</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }}
  * {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.4;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }}
  .page {{
    page-break-after: always;
    position: relative;
    min-height: 270mm;
  }}
  .page:last-child {{
    page-break-after: avoid;
  }}
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 8px;
    margin-bottom: 14px;
  }}
  .doc-title {{
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: -0.3px;
    margin: 0 0 2px 0;
  }}
  .doc-sub {{
    font-size: 11.5px;
    color: #475569;
  }}
  .badge {{
    background: #eef2ff;
    color: #4338ca;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }}
  .entity-box {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 11px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 10.5px;
  }}
  th {{
    background: #1e293b;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #1e293b;
  }}
  td {{
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
  }}
  tr.subtotal {{
    background: #f1f5f9;
    font-weight: 700;
  }}
  tr.total {{
    background: #e2e8f0;
    font-weight: 800;
    font-size: 11px;
  }}
  .num {{
    text-align: right;
    font-variant-numeric: tabular-nums;
  }}
  .footer {{
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    font-size: 9.5px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }}
  .signatures {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 24px;
    padding-top: 14px;
    border-top: 1px dashed #cbd5e1;
    font-size: 11px;
  }}
</style>
</head>
<body>

<!-- PUSLAPIS 1: VADOVO FINANSINIS SKYDAS IR SUVESTINĖ ŽMONIŲ KALBA -->
<div class="page">
  <div class="header">
    <div>
      <div class="doc-title" style="color: #4338ca;">VADOVO FINANSINIS SKYDAS IR VEIKSMŲ PLANAS</div>
      <div class="doc-sub">Praktinė įmonės finansų, mokesčių ir rizikų suvestinė vadovui</div>
    </div>
    <div style="text-align: right;">
      <span class="badge" style="background: #e0e7ff; color: #3730a3;">AUKŠČIAUSIAS PRIORITETAS • VADOVUI</span>
    </div>
  </div>

  <div class="entity-box">
    <div>
      Įmonė: <strong>{company_name}</strong> • Vadovas: <strong>{client_name}</strong><br>
      Teisinė forma: <strong>Mažoji bendrija (MB)</strong>
    </div>
    <div style="text-align: right;">
      Ataskaitinis laikotarpis: <strong>2026-01-01 – 2026-09-30 (9 mėn.)</strong><br>
      Ekspertė: <strong>Vyriausioji buhalterė Lilija Zapasnik (25 m. patirtis)</strong>
    </div>
  </div>

  <div style="margin-bottom: 14px;">
    <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: -0.2px;">
      🚦 Šviesoforas: Įmonės finansinė būklė per 60 sekundžių
    </div>

    <!-- RAUDONA ZONA -->
    <div style="background: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 9px 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <span style="font-weight: 800; color: #991b1b; font-size: 11.5px;">🔴 RAUDONA ZONA: Nuosavas kapitalas yra NEIGIAMAS (-6 762,09 €)</span>
        <span style="background: #fee2e2; color: #991b1b; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px;">KRITINĖ RIZIKA</span>
      </div>
      <div style="font-size: 10.5px; color: #334155; line-height: 1.45;">
        <strong>Ką tai reiškia:</strong> Įmonės įsipareigojimai (skolos) viršija jos turimą turtą. Savininkų įnašai tėra 200,00 €, o sukauptas veiklos nuostolis siekia -6 962,09 €.<br>
        <strong>Ką privaloma padaryti:</strong> Pagal LR Mažųjų bendrijų įstatymą, vadovas privalo turėti pasirašytą „Narių susirinkimo sprendimą“, kuriame oficialiai numatytas nuostolio padengimas iš būsimų laikotarpių pelno arba papildomais narių įnašais. Nesant šio sprendimo iki gruodžio 31 d., kyla teisinė atsakomybė vadovui.
      </div>
    </div>

    <!-- GELTONA ZONA -->
    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 9px 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <span style="font-weight: 800; color: #92400e; font-size: 11.5px;">🟡 GELTONA ZONA: Pirkėjų avansai 33 630,72 € vs. Pinigai banke/kasoje 118,97 €</span>
        <span style="background: #fef3c7; color: #92400e; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px;">LIKVIDUMO RIZIKA</span>
      </div>
      <div style="font-size: 10.5px; color: #334155; line-height: 1.45;">
        <strong>Ką tai reiškia:</strong> Iš klientų esate gavę 33,6 tūkst. € išankstinių apmokėjimų už būsimas prekes, tačiau šie pinigai jau panaudoti einamosioms veiklos sąnaudoms. Sąskaitoje Swedbank yra vos 54,77 €, o kasoje 64,20 €.<br>
        <strong>Ką privaloma padaryti:</strong> Būtina griežta prekių pristatymo kontrolė. Jei dalis pirkėjų atšauktų užsakymus ir pareikalautų grąžinti pinigus, įmonei kiltų tiesioginė atsiskaitymų krizė.
      </div>
    </div>

    <!-- ŽALIA ZONA -->
    <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #10b981; border-radius: 6px; padding: 9px 12px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <span style="font-weight: 800; color: #065f46; font-size: 11.5px;">🟢 ŽALIA ZONA: Gautinas PVM 4 795,48 € ir 0,00 € Pelno mokestis</span>
        <span style="background: #dcfce7; color: #065f46; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px;">TAVO GALIMYBĖS</span>
      </div>
      <div style="font-size: 10.5px; color: #334155; line-height: 1.45;">
        <strong>1. Teisėti Jūsų pinigai VMI sąskaitoje:</strong> Turite 4 795,48 € permokėto PVM (iš jų 3 727,28 € vidaus PVM ir 1 069,01 € importo PVM). Užpildžius VMI prašymą FR0781, šiuos pinigus galima teisėtai susigrąžinti tiesiai į savo banko sąskaitą apyvartai papildyti!<br>
        <strong>2. Pelno mokesčio mokėti nereikia:</strong> 9 mėn. veiklos rezultatas yra -5 383,41 € nuostolis, todėl mokėtinas mokestis yra <strong>0,00 €</strong>.<br>
        <strong>3. Sukauptas 3 369,00 € mokesčių skydas:</strong> Pagal PMĮ 30 str. šis mokestinis nuostolis perkeliamas į kitus metus ir ateityje teisėtai mažins apmokestinamąjį pelną (sutaupysite ~500–600 € grynais).
      </div>
    </div>
  </div>

  <!-- VADOVO VEIKSMŲ PLANAS -->
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;">
    <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
      📋 Ką vadovui privaloma padaryti iki gruodžio 31 d. (3 konkretūs žingsniai):
    </div>
    <div style="font-size: 10.5px; line-height: 1.5; color: #1e293b;">
      <strong>1 Žingsnis:</strong> Pasirašyti MB narių susirinkimo sprendimą dėl nuosavo kapitalo padengimo (rekomenduojame paruošti iki 12-31).<br>
      <strong>2 Žingsnis:</strong> Pateikti VMI prašymą FR0781 dėl 4 795,48 € PVM permokos grąžinimo į įmonės banko sąskaitą (lėšos apyvartai).<br>
      <strong>3 Žingsnis:</strong> Sukontroliuoti, kad užsakytos ir avansais apmokėtos prekės (33,6 tūkst. €) būtų išsiųstos klientams iki metų uždarymo.
    </div>
  </div>

  <div style="font-size: 10px; color: #64748b; font-style: italic; background: #ffffff; border: 1px dashed #cbd5e1; padding: 8px 12px; border-radius: 4px;">
    * Tolesniuose puslapiuose (2, 3 ir 4 psl.) pateikiamas oficialus buhalterinis dokumentų rinkinys pagal LR Verslo apskaitos standartus (VAS) bei VMI Formą PLN204 (07 versija), paruoštas teikimui Registrų centrui bei Valstybinei mokesčių inspekcijai.
  </div>

  <div class="footer">
    <span>{company_name} • Vadovo Finansinis Skydas</span>
    <span>Puslapis 1 iš 4</span>
  </div>
</div>

<!-- PUSLAPIS 2: BALANSAS -->
<div class="page">
  <div class="header">
    <div>
      <div class="doc-title">BALANSAS (SUTRUMPINTAS)</div>
      <div class="doc-sub">Pagal 2026 m. rugsėjo 30 d. duomenis (Valiuta: Eurais)</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Pagal VAS reikalavimus</span>
    </div>
  </div>

  <div class="entity-box">
    <div>
      Įmonės pavadinimas: <strong>{company_name}</strong><br>
      Teisinė forma: <strong>Mažoji bendrija (MB)</strong>
    </div>
    <div style="text-align: right;">
      Ataskaitinis laikotarpis: <strong>2026-01-01 – 2026-09-30</strong><br>
      Surašymo data: <strong>{today_str}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Eil. Nr.</th>
        <th style="width: 60%;">TURTAS</th>
        <th style="width: 15%; text-align: center;">Pastabos Nr.</th>
        <th style="width: 15%; text-align: right;">2026-09-30 (€)</th>
      </tr>
    </thead>
    <tbody>
      <tr class="subtotal">
        <td>A.</td>
        <td>ILGALAIKIS TURTAS</td>
        <td style="text-align: center;">1</td>
        <td class="num">2 704,17</td>
      </tr>
      <tr>
        <td>I.</td>
        <td>Materialusis turtas (įranga 1240: 3 171,27 €, nusidėvėjimas 1247: -467,10 €)</td>
        <td></td>
        <td class="num">2 704,17</td>
      </tr>

      <tr class="subtotal">
        <td>B.</td>
        <td>TRUMPALAIKIS TURTAS</td>
        <td style="text-align: center;">2</td>
        <td class="num">36 155,21</td>
      </tr>
      <tr>
        <td>I.</td>
        <td>Atsargos (žaliavos 2010: 23 119,16 €, prekės 2040: 3 530,91 €, avansai 2080: 2 389,12 €)</td>
        <td></td>
        <td class="num">29 039,19</td>
      </tr>
      <tr>
        <td>II.</td>
        <td>Per vienerius metus gautinos sumos</td>
        <td></td>
        <td class="num">6 265,91</td>
      </tr>
      <tr>
        <td>II.1.</td>
        <td>Pirkėjų skolos (2410 + 2411 el. prekyba)</td>
        <td></td>
        <td class="num">1 470,43</td>
      </tr>
      <tr>
        <td>II.2.</td>
        <td>Gautinas PVM iš biudžeto (2441 + 24411 + 24412)</td>
        <td></td>
        <td class="num">4 795,48</td>
      </tr>
      <tr>
        <td>II.3.</td>
        <td>Kitos gautinos sumos / Atskaitingi asmenys (24450 Liudas)</td>
        <td></td>
        <td class="num">0,00</td>
      </tr>
      <tr>
        <td>III.</td>
        <td>Pinigai ir pinigų ekvivalentai (bankas Swedbank: 54,77 €, kasa: 64,20 €, kelyje: 581,14 €)</td>
        <td></td>
        <td class="num">700,11</td>
      </tr>
      <tr>
        <td>IV.</td>
        <td>Ateinančių laikotarpių sąnaudos ir sukauptos pajamos (291)</td>
        <td></td>
        <td class="num">150,00</td>
      </tr>
      <tr class="total">
        <td></td>
        <td>TURTO IŠ VISO (A + B):</td>
        <td></td>
        <td class="num">38 859,38</td>
      </tr>
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Eil. Nr.</th>
        <th style="width: 60%;">NUOSAVAS KAPITALAS IR ĮSIPAREIGOJIMAI</th>
        <th style="width: 15%; text-align: center;">Pastabos Nr.</th>
        <th style="width: 15%; text-align: right;">2026-09-30 (€)</th>
      </tr>
    </thead>
    <tbody>
      <tr class="subtotal">
        <td>C.</td>
        <td>NUOSAVAS KAPITALAS</td>
        <td style="text-align: center;">3</td>
        <td class="num" style="color: #dc2626;">-6 762,09</td>
      </tr>
      <tr>
        <td>I.</td>
        <td>Kapitalas (MB savininkų įnašai, sąskaita 308)</td>
        <td></td>
        <td class="num">200,00</td>
      </tr>
      <tr>
        <td>II.</td>
        <td>Nepaskirstytasis pelnas (nuostoliai) (sąskaita 3411)</td>
        <td></td>
        <td class="num" style="color: #dc2626;">-6 962,09</td>
      </tr>
      <tr>
        <td></td>
        <td><em>iš jų: ataskaitinio laikotarpio grynasis nuostolis</em></td>
        <td></td>
        <td class="num" style="color: #dc2626;"><em>(-5 383,41)</em></td>
      </tr>

      <tr class="subtotal">
        <td>D.</td>
        <td>MOKĖTINOS SUMOS IR ĮSIPAREIGOJIMAI</td>
        <td style="text-align: center;">4</td>
        <td class="num">51 004,88</td>
      </tr>
      <tr>
        <td>I.</td>
        <td>Iš pirkėjų gauti avansai (sąskaita 4420)</td>
        <td></td>
        <td class="num">33 630,72</td>
      </tr>
      <tr>
        <td>II.</td>
        <td>Skolos tiekėjams (sąskaita 4430)</td>
        <td></td>
        <td class="num">5 810,78</td>
      </tr>
      <tr>
        <td>III.</td>
        <td>Paskolos ir kiti skoliniai įsipareigojimai (sąskaita 4404)</td>
        <td></td>
        <td class="num">4 236,88</td>
      </tr>
      <tr>
        <td>IV.</td>
        <td>Mokėtinas pridėtinės vertės mokestis (sąskaita 4492 net)</td>
        <td></td>
        <td class="num">6 019,61</td>
      </tr>
      <tr>
        <td>V.</td>
        <td>Su darbo santykiais susiję įsipareigojimai (DU 302,91 €, GPM 497,59 €, Sodra 506,39 €)</td>
        <td></td>
        <td class="num">1 306,89</td>
      </tr>
      <tr class="total">
        <td></td>
        <td>NUOSAVO KAPITALO IR ĮSIPAREIGOJIMŲ IŠ VISO (C + D):</td>
        <td></td>
        <td class="num">38 859,38</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div>Vadovas: ___________________ ({client_name})</div>
    <div style="text-align: right;">Vyr. buhalterė: ___________________ (Lilija Zapasnik)</div>
  </div>

  <div class="footer">
    <span>{company_name} • Balansas 2026-09-30 būklei</span>
    <span>Puslapis 2 iš 4</span>
  </div>
</div>

<!-- PUSLAPIS 3: PELNO (NUOSTOLIŲ) ATASKAITA -->
<div class="page">
  <div class="header">
    <div>
      <div class="doc-title">PELNO (NUOSTOLIŲ) ATASKAITA</div>
      <div class="doc-sub">Pagal 2026-01-01 – 2026-09-30 duomenis (Valiuta: Eurais)</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Pagal VAS reikalavimus</span>
    </div>
  </div>

  <div class="entity-box">
    <div>
      Įmonės pavadinimas: <strong>{company_name}</strong><br>
      Teisinė forma: <strong>Mažoji bendrija (MB)</strong>
    </div>
    <div style="text-align: right;">
      Ataskaitinis laikotarpis: <strong>2026-01-01 – 2026-09-30 (9 mėn.)</strong><br>
      Pateikimo valiuta: <strong>Eurai (€)</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Eil. Nr.</th>
        <th style="width: 60%;">STRAIPSNIAI</th>
        <th style="width: 15%; text-align: center;">Sąskaitos</th>
        <th style="width: 15%; text-align: right;">Suma (€)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>I.</td>
        <td><strong>Pardavimo pajamos</strong></td>
        <td style="text-align: center;">500</td>
        <td class="num" style="font-weight: 700;">40 209,69</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Parduotų prekių pajamos</em></td>
        <td style="text-align: center;">5000</td>
        <td class="num">32 845,15</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Pardavimai mugėse</em></td>
        <td style="text-align: center;">5002</td>
        <td class="num">5 894,14</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Pardavimai Europos Sąjungoje</em></td>
        <td style="text-align: center;">5003</td>
        <td class="num">870,40</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Suteiktų paslaugų pajamos</em></td>
        <td style="text-align: center;">5001</td>
        <td class="num">600,00</td>
      </tr>

      <tr>
        <td>II.</td>
        <td><strong>Pardavimo savikaina</strong></td>
        <td style="text-align: center;">6001</td>
        <td class="num" style="font-weight: 700;">6 684,10</td>
      </tr>

      <tr class="subtotal">
        <td>III.</td>
        <td>BENDRASIS PELNAS (NUOSTOLIAI) (I - II):</td>
        <td style="text-align: center;"></td>
        <td class="num">33 525,59</td>
      </tr>

      <tr>
        <td>IV.</td>
        <td><strong>Pardavimo sąnaudos</strong> (paslaugų ir prekių reklama)</td>
        <td style="text-align: center;">6202</td>
        <td class="num">6 820,33</td>
      </tr>

      <tr>
        <td>V.</td>
        <td><strong>Bendrosios ir administracinės sąnaudos</strong></td>
        <td style="text-align: center;">63</td>
        <td class="num" style="font-weight: 700;">30 025,84</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Vadovavimo ir panašios išmokos (civilinė vadovo sutartis)</em></td>
        <td style="text-align: center;">6305</td>
        <td class="num">12 000,00</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Darbuotojų darbo užmokestis ir su juo susijusios sąnaudos</em></td>
        <td style="text-align: center;">6304</td>
        <td class="num">10 426,04</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Nuomos sąnaudos</em></td>
        <td style="text-align: center;">6300</td>
        <td class="num">809,09</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Ilgalaikio turto nusidėvėjimas</em></td>
        <td style="text-align: center;">6306</td>
        <td class="num">305,90</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Transporto sąnaudos</em></td>
        <td style="text-align: center;">631202</td>
        <td class="num">1 025,10</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Neleidžiami atskaitymai (neleidžiamos sąnaudos)</em></td>
        <td style="text-align: center;">631204</td>
        <td class="num">2 014,41</td>
      </tr>
      <tr>
        <td></td>
        <td><em>Kitos bendrosios sąnaudos (komandiruotės, apskaita, bankai, kita)</em></td>
        <td style="text-align: center;">6312</td>
        <td class="num">3 445,30</td>
      </tr>

      <tr class="subtotal">
        <td>VI.</td>
        <td>VEIKLOS PELNAS (NUOSTOLIAI) (III - IV - V):</td>
        <td style="text-align: center;"></td>
        <td class="num" style="color: #dc2626;">-3 320,58</td>
      </tr>

      <tr>
        <td>VII.</td>
        <td>Finansinės ir investicinės veiklos sąnaudos (paskolos palūkanos)</td>
        <td style="text-align: center;">6802</td>
        <td class="num">2 062,83</td>
      </tr>

      <tr class="subtotal">
        <td>VIII.</td>
        <td>PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ:</td>
        <td style="text-align: center;"></td>
        <td class="num" style="color: #dc2626;">-5 383,41</td>
      </tr>

      <tr>
        <td>IX.</td>
        <td>Pelno mokestis (apskaičiuotas mokestis)</td>
        <td style="text-align: center;">PMĮ</td>
        <td class="num">0,00</td>
      </tr>

      <tr class="total">
        <td>X.</td>
        <td>GRYNASIS ATASKAITINIO LAIKOTARPIO NUOSTOLIS:</td>
        <td style="text-align: center;"></td>
        <td class="num" style="color: #dc2626; font-size: 13px;">-5 383,41 €</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div>Vadovas: ___________________ ({client_name})</div>
    <div style="text-align: right;">Vyr. buhalterė: ___________________ (Lilija Zapasnik)</div>
  </div>

  <div class="footer">
    <span>{company_name} • Pelno (nuostolių) ataskaita 2026-09-30</span>
    <span>Puslapis 3 iš 4</span>
  </div>
</div>

<!-- PUSLAPIS 4: PELNO MOKESČIO DEKLARACIJA PLN204 (07 VERSIJA) -->
<div class="page">
  <div class="header">
    <div>
      <div class="doc-title">METINĖ PELNO MOKESČIO DEKLARACIJA (FORMA PLN204, 07 VERSIJA)</div>
      <div class="doc-sub">Valstybinei mokesčių inspekcijai (VMI) prie LR Finansų ministerijos • Netiesioginis apskaičiavimo būdas</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">VMI Forma PLN204 (07)</span>
    </div>
  </div>

  <div class="entity-box">
    <div>
      Mokesčių mokėtojas: <strong>{company_name}</strong><br>
      Teisinė forma: <strong>Mažoji bendrija (MB)</strong>
    </div>
    <div style="text-align: right;">
      Mokestinis laikotarpis: <strong>2026-01-01 – 2026-09-30</strong><br>
      Apskaičiavimo būdas: <strong>Netiesioginis (nuo finansinio rezultato)</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">PLN204 Laukelis</th>
        <th style="width: 55%;">RODIKLIO PAVADINIMAS IR VMI PMĮ PAGRINDAS</th>
        <th style="width: 15%; text-align: center;">Reikšmė / Priedas</th>
        <th style="width: 15%; text-align: right;">Suma (€)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: 700;">18 laukelis</td>
        <td>Bendra apmokestinamųjų pajamų suma (PMĮ 4 str., 500 sąskaitos)</td>
        <td style="text-align: center;">Pajamos</td>
        <td class="num">40 209,69</td>
      </tr>
      <tr class="subtotal" style="background: #fef2f2;">
        <td style="font-weight: 700; color: #b91c1c;">19 laukelis</td>
        <td style="color: #b91c1c;"><strong>Finansinės atskaitomybės pelnas (nuostoliai) prieš apmokestinimą</strong></td>
        <td style="text-align: center; color: #b91c1c; font-weight: 700;">Nuostolis</td>
        <td class="num" style="color: #b91c1c; font-weight: 700;">-5 383,41</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">20 laukelis</td>
        <td>Suma, kuria didinamas apmokestinamasis pelnas (mažinamas nuostolis) dėl neleidžiamų atskaitymų</td>
        <td style="text-align: center;">PLN204S priedas</td>
        <td class="num">2 014,41</td>
      </tr>
      <tr style="background: #f8fafc; font-size: 10px;">
        <td style="padding-left: 15px; font-style: italic;">↳ PLN204S (S1: 08)</td>
        <td style="font-style: italic;">Priedas PLN204S: Kitos neleidžiamos sąnaudos pagal PMĮ 31 str. 1 d. 17 p. (sąskaita 631204)</td>
        <td style="text-align: center; font-style: italic;">Kodas 08</td>
        <td class="num" style="font-style: italic;">2 014,41</td>
      </tr>
      <tr class="subtotal" style="background: #eff6ff;">
        <td style="font-weight: 800; color: #1e40af;">31 laukelis</td>
        <td style="color: #1e40af;"><strong>MOKESTINIO LAIKOTARPIO VEIKLOS MOKESTINIS NUOSTOLIS (19 lauk. + 20 lauk.):</strong></td>
        <td style="text-align: center; color: #1e40af; font-weight: 700;">Mokestinis nuostolis</td>
        <td class="num" style="font-size: 11.5px; font-weight: 800; color: #1e40af;">3 369,00 €</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">34 laukelis</td>
        <td>Apmokestinamasis pelnas (kadangi apskaičiuotas veiklos nuostolis)</td>
        <td style="text-align: center;">Baza 0 €</td>
        <td class="num">0,00</td>
      </tr>
      <tr class="total">
        <td style="font-weight: 800;">45 laukelis</td>
        <td>MOKĖTINAS PELNO MOKESTIS Į VALSTYBĖS BIUDŽETĄ:</td>
        <td style="text-align: center;">Tarifas 0%</td>
        <td class="num" style="font-size: 12px; color: #047857; font-weight: 800;">0,00 €</td>
      </tr>
      <tr class="subtotal" style="background: #f0fdf4;">
        <td style="font-weight: 800; color: #15803d;">PMĮ 30 str.</td>
        <td style="color: #15803d;"><strong>Į KITUS MOKESTINIUS METUS PERKELIAMAS MOKESTINIS NUOSTOLIS:</strong></td>
        <td style="text-align: center; color: #15803d; font-weight: 700;">Perkėlimas į 2027 m.</td>
        <td class="num" style="font-size: 12px; font-weight: 800; color: #15803d;">3 369,00 €</td>
      </tr>
    </tbody>
  </table>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-top: 10px; font-size: 10.5px; line-height: 1.45;">
    <strong>Vyriausiosios buhalterės metodinis komentaras (Pagal VMI taisykles):</strong><br>
    Pagal Lietuvos Respublikos Pelno mokesčio įstatymą ir VMI PLN204 (07 versijos) pildymo taisykles, apmokestinamasis rezultatas apskaičiuojamas <strong>netiesioginiu būdu</strong>:<br>
    • Pradedama nuo finansinės apskaitos rezultato (<strong>19 laukelis: -5 383,41 € nuostolis</strong> iš Pelno (nuostolių) ataskaitos).<br>
    • Pridedami neleidžiami atskaitymai iš priedo PLN204S (<strong>20 laukelis: +2 014,41 €</strong>, priedo PLN204S kodas 08).<br>
    • Galutinis mokestinis nuostolis įrašomas į <strong>31 laukelį: 3 369,00 €</strong>. Kadangi patirtas mokestinis nuostolis, apmokestinamojo pelno (34 laukelis) nėra (0,00 €) ir mokėtinas mokestis (45 laukelis) lygus <strong>0,00 €</strong>.<br>
    • Šis 3 369,00 € nuostolis pagal PMĮ 30 str. perkeliamas į kitus mokestinius metus ir ateityje mažins apmokestinamąjį pelną iki 70%.
  </div>

  <div class="signatures">
    <div>Vadovas: ___________________ ({client_name})</div>
    <div style="text-align: right;">Vyr. buhalterė: ___________________ (Lilija Zapasnik)</div>
  </div>

  <div class="footer">
    <span>{company_name} • PLN204 suvestinė 2026 m.</span>
    <span>Puslapis 4 iš 4</span>
  </div>
</div>

</body>
</html>"""

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
        f"--print-to-pdf={out_pdf}",
        f"file:///{html_file.replace(os.sep, '/')}"
    ]

    subprocess.run(cmd, capture_output=True)

    if os.path.exists(out_pdf):
        print(f"[Financial Statements Generator] Successfully generated PDF: {out_pdf}")
        return out_pdf
    else:
        print("[Financial Statements Generator] Failed to generate PDF.")
        return ""

if __name__ == "__main__":
    generate_financial_package_pdf()
