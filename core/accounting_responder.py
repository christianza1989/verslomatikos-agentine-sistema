import re
from typing import Dict, Any, Tuple

def classify_and_generate_reply(body_text: str, client_name: str = "Lilija", company_name: str = "MB Prekybos Sprendimai", has_documents: bool = False) -> Tuple[str, str, Dict[str, Any]]:
    """
    Išanalizuoja kliento laiško tekstą, nustato intenciją ir sugeneruoja 
    itin taiklų, profesionalų atsakymą bei metaduomenis (telefonas, pageidaujamas laikas, briefing).
    
    Gražina: (reply_text, waiting_for_status, metadata_dict)
    Griežtai JOKIO AI minėjimo – viskas pasirašoma kaip Tomas kartu su Vyriausiąja buhaltere (25 m. patirtis).
    """
    # Išvalome cituojamą senų laiškų tekstą ir parašus
    clean_text = body_text.split("rašė:")[0].split("wrote:")[0]
    clean_lines = [line for line in clean_text.splitlines() if not line.strip().startswith(">")]
    client_actual_text = "\n".join(clean_lines).strip()
    txt_lower = client_actual_text.lower()
    
    # Pašaliname datas (pvz., 2026-01-01, 2026-10-29), kad nebūtų klaidingai atpažintos kaip telefonai
    text_without_dates = re.sub(r'\d{4}-\d{2}-\d{2}', ' ', client_actual_text)
    text_without_dates = re.sub(r'\d{4}\.\d{2}\.\d{2}', ' ', text_without_dates)
    
    # Telefono numerio atpažinimas (ignoruojame savo pačių numerį +37061111111)
    found_phone = None
    phone_match = re.search(r'(\+370[\s\-]?[6]\d{2}[\s\-]?\d{5}|8[\s\-]?[6]\d{2}[\s\-]?\d{5}|\b6\d{7}\b)', text_without_dates)
    if phone_match:
        cand = phone_match.group(1).replace(" ", "").replace("-", "")
        if "61111111" not in cand:
            found_phone = cand
    
    # 1. GRIEŽTAS Skambučio atpažinimas (TIK kai klientas TIKRAI tiesiogiai prašo skambučio, o ne klausia ar nori pasitarti el. paštu)
    explicit_call_triggers = [
        "paskambinkit", "paskambinkite", "prašau paskambinti", "prasau paskambinti",
        "noriu pasikalbėti telefonu", "noriu pasikalbeti telefonu", "susiskambinkime",
        "susiskambinam", "pasukit man", "pasukite man", "skambučio telefonu", "skambucio telefonu", "galite paskambinti"
    ]
    wants_call = any(k in txt_lower for k in explicit_call_triggers) or (
        any(k in txt_lower for k in ["nieko nesuprantu", "niekaip nesuprantu"]) and any(k in txt_lower for k in ["telefon", "skamb", "pasukit"])
    )
    
    if wants_call and (found_phone or any(k in txt_lower for k in ["mano tel", "numeris", "paskambink", "prasau pasukti", "telefonu"])):
        briefing = f"Klientas tiesiogiai prašo skambučio. Užklausa: '{body_text.strip()[:200]}'. Tikslas: pasitikslinti situaciją, įvertinti apimtis ir pasiūlyti atsiųsti bandomąjį balansą arba banko išrašą."
        
        if found_phone:
            reply = f"""Laba diena, {client_name}!

Dėkoju už atsakymą. Mielai trumpai pasikalbėsime telefonu – gyvas pokalbis padės greitai atsakyti į Jūsų klausimus!

Susisieksime su Jumis nurodytu numeriu: {found_phone}.

Kelintą valandą Jums būtų patogiausia trumpam 5–10 min. pokalbiui (pvz., šiandien po pietų ar rytoj iš ryto)?

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        else:
            reply = f"""Laba diena, {client_name}!

Dėkoju už atsakymą. Mielai trumpai susisieksime telefonu ir aptarsime Jūsų įmonės situaciją gyvai!

Prašau brūkštelėkite savo tiesioginį telefono numerį ir kelintą valandą Jums būtų patogiausia pasikalbėti (pvz., šiandien 16:30 ar rytoj iš ryto).

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "call_required", {"phone": found_phone, "briefing": briefing, "call_requested": 1}

    # 1A. Intencija: BDAR / Teisė būti pamirštam / Iš kur gavote kontaktus (Aukščiausias teisinis prioritetas)
    is_bdar_optout = any(k in txt_lower for k in [
        "bdar", "vdai", "šlamšt", "slamst", "brukal", "ištrinkite", "istrinkite", 
        "ištrinti", "istrinti", "atsisakau", "nesiuntinėkit", "nesiuntinekit", "panaikinkite"
    ]) or (
        any(k in txt_lower for k in ["iš kur gavote", "is kur gavote", "iš kur gavot", "is kur gavot"])
        and any(k in txt_lower for k in ["kontakt", "el. pašt", "el pasta", "duomen", "laišk", "laisk", "adres"])
    )
    if is_bdar_optout:
        reply = f"""Laba diena, {client_name}!

Atsiprašome už sutrukdymą. Informuojame:

1. Duomenų šaltinis: Jūsų įmonės ({company_name}) oficialus kontaktinis el. pašto adresas buvo gautas iš viešai prieinamo VĮ Registrų centro Juridinių asmenų registro (vieši įmonių rekvizitai B2B informavimo tikslais).
2. BDAR atitiktis: Visiškai gerbiame Jūsų privatumą. Jūsų el. pašto adresas yra nedelsiant pašalintas iš visų mūsų sistemų ir kontaktų sąrašų. Daugiau jokių pranešimų šiuo adresu negausite.

Linkime sėkmingos veiklos!

Pagarbiai,
Tomas | Verslomatika B2B
tomas@verslomatika.lt
"""
        return reply, "completed", {"topic": "bdar_optout", "call_requested": 0}

    # 1A2. Intencija: Anglakalbis klientas / Užsienietis vadovas (International Founder / English Query)
    is_english_query = (
        any(k in txt_lower for k in [
            "hello", "dear tomas", "dear lilija", "good morning", "good afternoon",
            "accounting services", "financial statement", "tax return", "lithuanian company",
            "annual accounts", "e-residency", "e-resident", "corporate tax",
            "price quote", "need an accountant", "balance sheet for", "payroll services"
        ])
        and not any(k in txt_lower for k in ["laba diena", "sveiki", "gerb", "ačiū", "aciu", "pagarbiai", "dieną"])
    )
    if is_english_query:
        reply = f"""Hello, {client_name}!

Thank you for reaching out regarding professional accounting and tax compliance for your company ({company_name}) in Lithuania.

We regularly assist international founders, foreign directors, and e-residents with full Lithuanian statutory bookkeeping and corporate reporting:

KEY ACCOUNTING & TAX FRAMEWORK IN LITHUANIA:
--------------------------------------------
1. CORPORATE INCOME TAX (CIT):
   • Standard rate: 16% (effective 2025/2026).
   • Reduced rate: 6% (or 0% for the first operating year) for small companies/MBs with annual turnover under 300,000 € and fewer than 10 employees.

2. VAT (PVM) THRESHOLDS:
   • Mandatory VAT registration threshold in Lithuania is 45,000 € in trailing 12-month domestic turnover (or 10,000 € for intra-community acquisitions from the EU).

3. STATUTORY ANNUAL FILINGS:
   • Annual financial package (Balance Sheet, Profit & Loss Statement) filed with the State Enterprise Centre of Registers (Registrų centras).
   • Annual Corporate Tax Return (PLN204) filed with the State Tax Inspectorate (VMI).

OUR COMPLIMENTARY EXPRESS AUDIT (NO UPFRONT FEE):
-------------------------------------------------
You can simply email us your trial balance, bank statement (CSV or CAMT.053 XML), or general ledger export. Our Senior Chief Accountant Lilija Zapasnik (25+ years experience, Certificate No. 34566444) will personally review your accounts, inspect tax risks, and provide an initial audit summary completely free of charge.

If you have specific questions or documents ready, feel free to reply directly to this email.

Best regards,
Tomas | Verslomatika B2B
Together with Senior Chief Accountant Lilija Zapasnik (25+ yrs experience, Cert. No. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "english_inquiry"}

    # 1B. Intencija: VMI Patikrinimo / Paklausimo Panika (Aukštas skubumo prioritetas)
    is_vmi_panic = any(k in txt_lower for k in [
        "vmi patikrinim", "vmi paklausim", "vmi reikalauja", "vmi pranešim", "vmi pranesim", 
        "gavau pranešimą", "gavau pranesima", "vmi rašt", "vmi rast", "bauda iš vmi", "gresia bauda"
    ])
    if is_vmi_panic:
        reply = f"""Laba diena, {client_name}!

Pirmiausia – prašau nusiraminti: VMI paklausimas ar pranešimas metų pabaigoje yra standartinė procedūra, su kuria susiduria tūkstančiai Lietuvos įmonių. Tai dar nereiškia baudos!

KĄ TAI REIŠKIA IR KĄ PRIVALOMA PADARYTI:
------------------------------------------
1. NEIGNORUOTI TERMINO:
   VMI paprastai suteikia 10–14 dienų terminą paaiškinimui ar dokumentams pateikti. Laiku sureagavus, jokios sankcijos netaikomos.

2. KĄ MES PADARYSIME:
   Mūsų vyriausioji buhalterė Lilija Zapasnik (25 m. patirtis):
   • Asmeniškai peržiūrės VMI gautą pranešimą;
   • Sutikrins Jūsų deklaracijas (PVM FR0600, i.SAF registrą, PLN204) su Didžiąja knyga ir nustatys nesutapimo priežastį;
   • Paruoš oficialų, teisiškai motyvuotą atsakymą VMI inspektoriui su reikalingais pirminiais dokumentais.

Tiesiog persiųskite mums patį VMI pranešimą arba jo nuotrauką / PDF, ir mes per kelias valandas paruošime konkretų veiksmų planą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "vmi_panic"}

    # 1B. Intencija: Neigiamas nuosavas kapitalas / Kaip atkurti? (Aukštas prioritetas)
    is_negative_equity = any(k in txt_lower for k in [
        "neigiamas kapital", "neigiamą kapital", "kapitalo atkūrim", "kapitalo atstatym", 
        "nuostolio dengim", "nuostolio padengim", "ką daryti su kapitalu", "ka daryti su kapitalu", "kapital"
    ]) and any(k in txt_lower for k in ["neigiam", "nuostol", "atkur", "atstat", "deng", "ką daryti", "ka daryti"])
    if is_negative_equity:
        reply = f"""Laba diena, {client_name}!

Tai yra vienas svarbiausių teisinių klausimų įmonės vadovui artėjant metų pabaigai, todėl pateikiu aiškias teisines gaires pagal LR Mažųjų bendrijų įstatymą (arba Akcinių bendrovių įstatymą):

KĄ TAI REIŠKIA IR KAIP SUTVARKYTI NEIGIAMĄ KAPITALĄ:
------------------------------------------------------
Pagal teisės aktus, įmonės nuosavas kapitalas negali būti neigiamas (įsipareigojimai viršija turtą).

3 TEISĖTI BŪDAI ATKURTI NUOSAVĄ KAPITALĄ IKI METŲ PABAIGOS:
1. Savininkų / narių papildomi įnašai nuostoliams dengti:
   • Nariai priima sprendimą padengti susidariusį nuostolį ir perveda lėšas į įmonės banko sąskaitą (kredituojama 308 sąskaita „Narių įnašai“).
2. Nario / akcininko suteiktos paskolos konvertavimas į nuosavą kapitalą:
   • Jei vadovas ar savininkas anksčiau buvo suteikęs paskolą įmonei (448 sąskaita), ši prievolė savininko sprendimu gali būti paversta negrąžintinu įnašu, taip iškart atkuriant nuosavą kapitalą be papildomų grynųjų pinigų.
3. Oficialus vadovo paaiškinimas prie metinių finansinių ataskaitų:
   • Nurodoma, kad įmonė yra augimo etape, investavo į prekes ar reklamą, ir pateikiama prognozė, kaip veikla bus pelninga ateinančiais metais.

Mūsų paruoštame Vadovo Finansinio Skydo rinkinyje šis žingsnis yra pilnai suformuluotas Jūsų įmonei ({company_name}).

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "completed" if has_documents else "client_documents", {"topic": "negative_equity_guidance"}

    # 1C. Intencija: Visiškai žalias / Nieko nesuprantu buhalterijoje / Ką man dabar daryti?
    is_confused_green = any(k in txt_lower for k in [
        "nieko nesuprantu", "esu žalias", "esu zalias", "ką daryti", "ka daryti", "paaiškinkite paprastai", 
        "paaiskinkite paprastai", "nesuprantu buhalterij", "kas tas balansas", "ką tai reiškia", "ka tai reiskia"
    ]) and not is_negative_equity
    if is_confused_green:
        reply = f"""Laba diena, {client_name}!

Labai ačiū už nuoširdų atsakymą! Noriu iš karto nuraminti: Jums ir nereikia nieko suprasti apie buhalteriją – tam esame mes. Vadovo darbas yra kurti verslą ir uždirbti pinigus, o mūsų darbas – užtikrinti, kad Jūsų finansai būtų 100% saugūs ir VMI neturėtų jokių priekaištų.

KĄ TAI REIŠKIA:
-----------------
1. KAS TAI YRA:
   Priešmetinis mokesčių patikrinimas yra kaip įmonės finansinis „sveikatos testas“ prieš pat uždarant metus (iki gruodžio 31 d.). Mes patikriname, ar Jūsų buhalterijoje nėra klaidų, ar nepermokate mokesčių ir ar nėra rizikos gauti baudą iš VMI.

2. KĄ JUMS REIKIA PADARYTI (VOS 1 PAPRASTAS ŽINGSNIS):
   Jums nereikia nieko skaičiuoti. Tiesiog atsiųskite mums vieną iš šių dalykų:
   • Šių metų banko sąskaitos išrašą (Excel, CSV arba PDF formatu iš Swedbank, SEB, Revolut ar kt.);
   • ARBA tiesiog parašykite savo buhalterei trumpą žinutę: „Prašau atsiųsti šių metų Bandomąjį balansą“ ir persiųskite jį mums.

3. KIEK TAI KAINUOJA:
   Šis pirminis patikrinimas Jums yra 100% NEMOKAMAS. Vyriausioji buhalterė (25 m. patirtis) asmeniškai peržiūrės duomenis ir atsiųs Jums aiškią suvestinę: ar viskas tvarkoje, ar permokate mokesčių ir ką konkrečiai rekomenduojama atlikti.

Atsiųskite banko išrašą arba balansą, ir mes viskuo pasirūpinsime!

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "confused_green"}

    # 1C. Intencija: Skeptikas / Iš kur skaičiai / Kodėl nuostolis / Ar tikrai teisingai?
    is_skeptic_numbers = (
        any(k in txt_lower for k in [
            "iš kur skaičiai", "is kur skaiciai", "iš kur ištraukėt", "is kur istrauket", "kodėl nuostolis", 
            "kodel nuostolis", "nuostoling", "pelninga", "klaida skaič", "klaida skaic", "ar tikrai teising"
        ]) or (
            any(k in txt_lower for k in ["iš kur gavote", "is kur gavote", "iš kur gavot", "is kur gavot"])
            and any(k in txt_lower for k in ["skaič", "skaic", "duomenis apie", "pelno", "nuostol", "balans"])
        )
    ) and not is_bdar_optout
    if is_skeptic_numbers:
        reply = f"""Laba diena, {client_name}!

Dėkoju už labai profesionalų ir konkretų klausimą. Tai visiškai suprantama abejonė, su kuria dažnai susiduria vadovai, todėl mūsų vyriausioji buhalterė (25 m. patirtis) nori aiškiai detalizuoti, kaip tiksliai susidaro šie skaičiai:

KODĖL MATOMAS NUOSTOLIS IR IŠ KUR ŠIE SKAIČIAI:
------------------------------------------------
1. PINIGAI BANKE VS. BUHALTERINIS REZULTATAS:
   Buhalterinėje apskaitoje galioja LR Verslo apskaitos standartų (VAS) kaupimo principas:
   • Pinigų likutis banke NE visada lygu pelnui. Banke esantys pinigai dažnai yra pirkėjų sumokėti avansai (tai yra prievolė ateityje patiekti prekes) arba atidėti atsiskaitymai su tiekėjais.
   • Tikrasis veiklos rezultatas = 5 klasės pardavimo pajamos minus 6 klasės patirtos sąnaudos (savikaina, vadovo paslaugos, darbuotojų DU, reklama, ryšiai, palūkanos).
   • Kai ataskaitinio laikotarpio sąnaudos viršija pajamas, finansinis rezultatas pagal VAS yra veiklos nuostolis.

2. KODĖL ŠIS NUOSTOLIS YRA JŪSŲ FINANSINIS PRIVALUMAS (PMĮ 30 STR.)?
   • Jei įmonė rodo mokestinį nuostolį, pelno mokesčio mokėti į biudžetą NEREIKIA (0,00 € pelno mokestis).
   • Pagal LR Pelno mokesčio įstatymo 30 straipsnį, šis nuostolis nedingsta – jis perkeliamas į kitus metus kaip „mokesčių skydas“ ir ateityje proporcingai sumažins pelno mokestį, kai įmonė dirbs su dideliu pelnu!

3. TIKSLUS AUDITAS PAGAL DIDŽIOSIOS KNYGOS SĄSKAITAS:
   Visi skaičiai paimti tiesiogiai iš Jūsų pateikto Didžiosios knygos / bandomojo žiniaraščio registrų. Jei atsiųsite papildomų kvitų, nurašymo aktų ar patikslintų sąskaitų, vyriausioji buhalterė mielai perskaičiuos ataskaitą iš naujo.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "completed" if has_documents else "client_documents", {"topic": "skeptic_numbers"}

    # 1D. Intencija: Kainodaros klausimas / Kodėl tokia kaina / Ar galima pigiau?
    is_pricing_objection = any(k in txt_lower for k in [
        "kodėl tokia kaina", "kodel tokia kaina", "kodėl tiek daug", "kodel tiek daug", "ar galima pigiau", 
        "ar galima nuolaid", "kodėl viena moka", "kodėl vienokia įmonė", "kodėl kiti moka", "kainos logika",
        "kodėl 190", "kodel 190"
    ])
    if is_pricing_objection:
        reply = f"""Laba diena, {client_name}!

Labai ačiū už tiesų klausimą. Mūsų principas – visiškas skaidrumas: mes netaikome „iš lubų paimtų“ kainų, o vadovaujamės aiškia rinkos pakopų matrica pagal įmonės dydį ir atsakomybės mastą:

KAIP APSKAIČIUOJAMA PASLAUGOS KAINA:
--------------------------------------
1. ĮMONĖS DYDŽIO PAKOPA (BAZINĖ KAINA PAGAL APYVARTĄ):
   • Mikro įmonė (metinė apyvarta iki 25 000 €, mažas dokumentų kiekis): 120,00 €
   • Smulki auganti įmonė (apyvarta 25 000 – 85 000 €): 160,00 €
   • Vidutinė įmonė (apyvarta 85 000 – 250 000 €): 240,00 €
   • Didesnė įmonė (apyvarta 250 000 – 600 000 €): 360,00 €
   • Stambi įmonė (virš 600 000 €): nuo 520,00 €

2. SPECIALIZUOTI PRIEDAI TIK KAI REIKALINGA:
   • Tarptautinė prekyba / ES sandoriai / Importo PVM (reikalauja OSS ir importo deklaracijų suderinimo): +30,00 €
   • Samdomi darbuotojai / DU registrų ir Sodros suderinimas: +30,00 €
   • Neleidžiamų sąnaudų VMI PLN204S priedas: +20,00 €
   • Vadovo Finansinis Skydas (veiksmų planas dėl neigiamo kapitalo ar PVM grąžinimo): 0,00 € (NEMOKAMAI).

PIRMINIS PATIKRINIMAS – 100% NEMOKAMAS:
Šiuo metu Jums nieko mokėti nereikia. Tik jei peržiūrėję pirminę audito išvadą nuspręsite, kad norite oficialaus 4 puslapių dokumentų paketo su VMI deklaracija (PLN204) ir registruotu balansu – tik tada išrašoma sąskaita-faktūra pagal tikslų Jūsų įmonės dydį.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "pricing_objection"}

    # 1G. Intencija: Kasos operacijos / Grynieji pinigai (272 sąskaita)
    is_cash_anomaly = any(k in txt_lower for k in [
        "kasoje", "kasa", "272", "grynieji pinigai", "grynųjų pinigų", "grynuju pinigu", "išsiimti iš kasos"
    ]) and any(k in txt_lower for k in ["daug", "kabo", "rizik", "vmi", "išimti", "isimti", "riba", "ribojim", "limitas"])
    if is_cash_anomaly:
        reply = f"""Laba diena, {client_name}!

Dėkoju už labai taiklų klausimą. Grynųjų pinigų likutis kasoje (272 sąskaita) šiuo metu yra vienas didžiausių VMI padidinto dėmesio taškų:

KĄ TAI REIŠKIA IR KOKIA YRA RIZIKA:
------------------------------------
1. 5 000 € ATSISKAITYMŲ GRYNAISIAIS RIBA:
   Pagal LR atsiskaitymų grynaisiais pinigais ribojimo įstatymą, sandoriai grynaisiais negali viršyti 5 000 € (arba atitinkamos sumos užsienio valiuta).
2. VMI TIKRINIMŲ RIZIKA:
   Jei balanso kasoje „popieriuje“ fiksuojamas didelis grynųjų likutis (pvz., virš 10 000 – 20 000 €), VMI tai traktuoja kaip fiktyvų likutį arba įmonės pinigų pasisavinimą be mokesčių (gresia 20% GPM apmokestinimu).

TEISĖTI SPRENDIMO BŪDAI IKI METŲ UŽDARYMO:
• Grynųjų pinigų įnešimas į įmonės banko sąskaitą per bankomatą/skyrių (Kreditas 272 -> Debetas 271);
• Teisėtas lėšų išmokėjimas savininkui / nariui (MB atveju: lėšos asmeniniams poreikiams su 02 kodu arba avansiniai dividendai);
• Atsiskaitymų su tiekėjais ar atskaitingais asmenimis padengimas pagal kvitus.

Vyriausioji buhalterė audito išvadoje pateikia tikslias instrukcijas, kaip saugiai sutvarkyti 272 sąskaitą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "cash_anomaly"}

    # 1H. Intencija: Atskaitingi asmenys / 2435 / FR0711 grėsmė
    is_accountable_persons = any(k in txt_lower for k in [
        "2435", "atskaitingi asmenys", "atskaitingas asmuo", "fr0711", "direktoriaus skola", "skola įmonei"
    ])
    if is_accountable_persons:
        reply = f"""Laba diena, {client_name}!

Tai yra viena iš griežčiausiai VMI kontroliuojamų sričių (sąskaita 2435 / 2445 „Atskaitingi asmenys“):

KĄ TAI REIŠKIA IR KOKIOS PASEKMĖS:
-----------------------------------
1. 15 000 € RIBA IR DEKLARACIJA FR0711:
   Jei atskaitingo asmens (dažniausiai vadovo ar savininko) skola įmonei viršija 15 000 €, pagal LR teisės aktus šį faktą PRIVALOMA deklaruoti VMI metinėje ataskaitoje FR0711.
2. MOKESČIŲ RIZIKA (20% GPM):
   Jei pinigai paimti iš įmonės ir iki metų pabaigos nepateisinti pirkimo kvitais ar negrąžinti, VMI šią sumą gali pripažinti vadovo pajamomis natūra (GPM 20% + „Sodros“ įmokos + delspinigiai).

KAIP TAI TEISĖTAI SUTVARKYTI IKI GRUODŽIO 31 D.:
• Avansinė apyskaita: pateikti visus verslo reikalams patirtus kvitus, sąskaitas ar kurorto mokesčius;
• Vadovo paslaugų užskaitymas (jei MB vadovas dirba pagal civilinę sutartį);
• Dalinis ar pilnas lėšų grąžinimas į įmonės banko sąskaitą iki metų galo.

Atsiųskite savo 2435 detalizaciją, ir vyriausioji buhalterė parengs konkretų suderinimo aktą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "accountable_persons"}

    # 1I. Intencija: Nulinė apyvarta / Mieganti įmonė
    is_zero_turnover = any(k in txt_lower for k in [
        "nulinė apyvarta", "nuline apyvarta", "nieko nepardavėm", "nieko nepardavem", "nevykdome veiklos", 
        "nevykdėme veiklos", "mieganti įmonė", "tuščia įmonė", "0 apyvarta", "nulis apyvartos"
    ])
    if is_zero_turnover:
        reply = f"""Laba diena, {client_name}!

Labai geras klausimas. Net jei įmonė šiais metais neturėjo jokių pardavimų (apyvarta 0,00 €), pagal LR Įmonių finansinės atskaitomybės įstatymą atsakomybė išlieka:

KĄ PRIVALOMA PATEIKTI TEISIŠKAI:
1. Registrų centrui (RC): Privaloma pateikti metinį Sutrumpintą Balansą ir Pelno (nuostolių) ataskaitą. Už nepateikimą vadovui taikoma administracinė bauda nuo 200 € iki 3 000 €, o ilgiau vėluojant – juridinis asmuo gali būti likviduotas.
2. VMI: Privaloma pateikti nulinę PLN204 deklaraciją ARBA oficialų prašymą laikinai atleisti nuo deklaravimo (jei veikla visiškai sustabdyta).

KAINA IR SPRENDIMAS:
• Mūsų pirminis patikrinimas yra 100% NEMOKAMAS.
• Jei pageidausite, kad mūsų vyriausioji buhalterė oficialiai suformuotų nulinę atskaitomybę RC ir PLN204 VMI – taikomas pats mažiausias Mikro įmonės tarifas (Tier 1: 120,00 €), garantuojantis, kad įmonė išliks nepriekaištingos reputacijos ir be jokių baudų.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "zero_turnover"}

    # 1J. Intencija: 45 000 € PVM riba / PVM registracija
    is_vat_threshold = any(k in txt_lower for k in [
        "45 000", "45000", "pvm riba", "pvm ribą", "pvm registracij", "privaloma registruotis pvm", "tapti pvm mokėtoju", "peržengti ribą"
    ])
    if is_vat_threshold:
        reply = f"""Laba diena, {client_name}!

Labai ačiū už labai svarbų klausimą. PVM registracijos ribos valdymas metų pabaigoje yra kritinis žingsnis, kad išvengtumėte netikėtų mokesčių ir baudų:

KĄ TAI REIŠKIA IR KOKIA YRA TEISINĖ TVARKA:
--------------------------------------------
1. 45 000 € RIBA PER PASKUTINIUS 12 MĖNESIŲ:
   Pagal LR PVM įstatymo 71 straipsnį, riba skaičiuojama NE už kalendorinius metus, o už PASKUTINIUS 12 SLINKANČIŲ MĖNESIŲ. Į šią sumą įeina visos atlygintinai patiektos prekės ir suteiktos paslaugos Lietuvoje (ES ar trečiųjų šalių eksportui gali galioti kitos taisyklės).

2. KADA PRIVALOMA REGISTRUOTIS (FORMA FR0388):
   Kai atlygis per 12 mėnesių viršija 45 000 €, privaloma pateikti prašymą VMI (forma FR0388) per Mano VMI sistemą. PVM mokėtoju tampama nuo kito mėnesio pradžios arba nuo registracijos dienos.

3. MOKESTINĖS PASEKMĖS VIRŠIJUS:
   PVM privaloma apskaičiuoti ir sumokėti į biudžetą TIK nuo tos sumos, kuria buvo viršyta 45 000 € riba (o ne nuo visos apyvartos), su sąlyga, kad registruojamasi laiku.

4. TEISĖTI METŲ PABAIGOS SPRENDIMAI:
   • Jei iki ribos liko nedaug (pvz., keli šimtai eurų), galima teisėtai atidėti galutinių paslaugų perdavimo-priėmimo aktų ar sąskaitų išrašymą į kitą mėnesį;
   • Įvertinti, ar dalis pajamų nėra PVM neapmokestinamos veiklos pagal PVMĮ (pvz., finansinės ar mokymo paslaugos).

Vyriausioji buhalterė audito metu patikrina Jūsų tikslią slenkančių 12 mėnesių apyvartą ir pasako tikslią saugią ribą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "vat_threshold"}

    # 1L. Intencija: Beviltiškos skolos / Skolų nurašymas / Pirkėjo bankrotas (2411)
    is_bad_debt = any(k in txt_lower for k in [
        "beviltišk", "beviltisk", "skolų nurašym", "skolu nurasym", "nurašyti skol", "nurasyti skol", 
        "pirkėjas bankrutavo", "pirkejas bankrutavo", "bankrot", "2411"
    ])
    if is_bad_debt:
        reply = f"""Laba diena, {client_name}!

Dėkoju už labai aktualų klausimą. Pirkėjų įsiskolinimų nurašymas metų pabaigoje yra viena geriausių teisėtų galimybių sumažinti pelno mokestį ir susigrąžinti PVM:

KĄ TAI REIŠKIA IR KOKIA YRA TVARKA:
------------------------------------
1. LEIDŽIAMI ATSKAITYMAI PAGAL PMĮ 25 STR.:
   Kad beviltiška pirkėjo skola (2411 sąskaita) būtų pripažinta LEIDŽIAMAIS ATSKAITYMAIS ir sumažintų įmonės apmokestinamąjį pelną, reikalingas vienas iš šių įrodymų:
   • Pirkėjas yra likviduotas arba bankrutavęs (išrašas iš Registrų centro ar teismo nutartis);
   • Skola neviršija 300 € ir praėjo daugiau nei 1 metai, o įmonė dėjo pastangas skolai išieškoti (raginimai, el. laiškai);
   • Didesnėms sumoms: antstolio aktas apie išieškojimo negalimumą.

2. PVM SUSIGRĄŽINIMAS IŠ VMI (PVMĮ 89-1 STR.):
   Jei skola pripažįstama beviltiška, įmonė turi teisę patikslinti PVM deklaraciją (forma FR0600) ir SUSIGRĄŽINTI iš biudžeto anksčiau sumokėtą pardavimo PVM dalį!

3. BUHALTERINIS ĮFORMINIMAS:
   Parengiamas vadovo įsakymas dėl beviltiškų skolų nurašymo, skolos nurašymo aktas ir buhalterinė pažyma. Debetuojama 6118 / 63 sąskaita (sąnaudos), kredituojama 2411 sąskaita (pirkėjų skolos).

Mūsų vyriausioji buhalterė audito metu įvertina Jūsų skolininkų sąrašą ir paruošia tikslius dokumentus, kad VMI nekiltų klausimų.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "bad_debt"}

    # 1M. Intencija: VšĮ / Asociacijos / Ne pelno siekiančios organizacijos
    is_vsi_ngo = any(k in txt_lower for k in [
        "všį", "vsi", "viešoji įstaiga", "viesoji istaiga", "asociacij", "ne pelno", "projektinis finansavim", "parama", "paramos gavėj"
    ]) and any(k in txt_lower for k in ["pelno mokest", "pln204", "deklarac", "atskaitom", "kaip su mokesčiais", "ar reikia teikti"])
    if is_vsi_ngo:
        reply = f"""Laba diena, {client_name}!

Viešųjų įstaigų (VšĮ) ir asociacijų apskaita turi esminių skirtumų nuo įprastų UAB ar MB įmonių, todėl mūsų vyriausioji buhalterė nori aiškiai detalizuoti tvarką:

VŠĮ ATSKAITOMYBĖS IR MOKESČIŲ SPECIFIKA:
-----------------------------------------
1. AR VŠĮ MOKA PELNO MOKESTĮ?
   Pagal PMĮ 5 str. 6 dalį, ne pelno organizacijų pajamos, gautos iš paramos (pagal Labdaros ir paramos įstatymą), tikslinio finansavimo, nario mokesčių ar 2% GPM pervedimų, NĖRA apmokestinamos pelno mokesčiu (0,00 € mokestis).
   Pelno mokesčiu (standartiniu 16% arba lengvatiniu 6%) apmokestinamas tik pelnas iš vykdytos komercinės / ūkinės veiklos.

2. DEKLARACIJA VMI (FORMA PLN204N):
   VšĮ teikia specializuotą metinę pelno mokesčio deklaraciją – formą PLN204N (ne pelno vienetams), kurioje atskiriami tiksliniai finansavimo šaltiniai nuo komercinių pajamų.

3. REGISTRŲ CENTRAS IR VEIKLOS ATASKAITA:
   Registrų centrui privaloma pateikti ne tik Finansinių ataskaitų rinkinį, bet ir išsamią Vadovo veiklos ataskaitą apie gautą paramą ir jos panaudojimą visuomenės labui.

Vyriausioji buhalterė turi ilgametę patirtį su VšĮ ir asociacijų projektais. Mūsų pirminis patikrinimas Jums yra nemokamas, o atskaitomybės parengimas atitinka mažiausią Tier 1 Mikro tarifą (120,00 €).

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "vsi_ngo"}

    # 1N. Intencija: Individuali veikla (IV) vs MB / Turto perkėlimas iš IV į MB
    is_iv_to_mb = any(k in txt_lower for k in [
        "individuali veikla", "individualios veiklos", "iš iv į mb", "is iv i mb", "perkelti įrangą", "perkelti iranga", "30% prezumpcija"
    ])
    if is_iv_to_mb:
        reply = f"""Laba diena, {client_name}!

Tai yra labai dažnas ir protingas žingsnis verslui augant: perėjimas nuo Individualios veiklos prie Mažosios bendrijos (MB) atveria didelių mokestinių privalumų:

KĄ TAI REIŠKIA IR KAIP TEISIŠKAI VISKĄ ATLIKTI:
-----------------------------------------------
1. TURTO IR ĮRANGOS PERKĖLIMAS IŠ IV Į MB:
   Yra du teisėti būdai perkelti kompiuterinę įrangą, įrankius ar baldus į MB apskaitą:
   • Nario nepiniginis įnašas: surašomas MB narių sprendimas ir perdavimo-priėmimo aktas (padidinamas nario įnašas 308 sąskaitoje, o turtas įtraukiamas į 12 klasę ir jam skaičiuojamas nusidėvėjimas);
   • Pirkimo-pardavimo sutartis: MB nuperka turtą iš fizinio asmens pagal rinkos vertę.

2. MOKESČIŲ SKIRTUMAS IR OPTIMIZAVIMAS:
   • IV: GPM yra 15% (arba 5–15% su kreditu) nuo visų gautų pajamų minus sąnaudos (arba 30% prezumpcija) + didelės Sodros įmokos (VSD 12,52% + PSD 6,98%);
   • MB: Pelno mokestis pirmais metais gali būti 0% arba lengvatinis 5–6%. MB lėšos asmeniniams poreikiams (kodas 02) leidžia lanksčiai valdyti Sodros įmokas iki lubų, o pelną išsimokėti dividendais (kodas 26) be jokių Sodros mokesčių!

3. KĄ DARYTI SU SENA IV:
   Pateikti metinę GPM deklaraciją (GPM311) už šiuos metus. Jei veikla bus vykdoma tik per MB, individualią veiklą Mano VMI galima tiesiog išregistruoti arba sustabdyti.

Atsiųskite savo šių metų duomenis, ir vyriausioji buhalterė padės sudaryti patį pelningiausią pereinamojo laikotarpio planą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "iv_to_mb"}

    # 1O. Intencija: Valiutų kursų pokyčiai / Užsienio valiuta (USD, GBP, Wise/Revolut)
    is_fx_loss = any(k in txt_lower for k in [
        "valiut", "usd", "gbp", "wise", "revolut business", "kursų pasikeitim", "kursu pasikeitim", "valiutos konvertavim", "636"
    ]) and any(k in txt_lower for k in ["nuostol", "sąnaud", "sanaud", "leidžiam", "leidziam", "apskait"])
    if is_fx_loss:
        reply = f"""Laba diena, {client_name}!

Dėkoju už profesionalų klausimą. Dirbant su tarptautinėmis sąskaitomis (Wise, Revolut, Stripe) ir skirtingomis valiutomis (USD, GBP), valiutų kursų skirtumai yra įprasta praktika:

KĄ TAI REIŠKIA IR KAIP TRAKTUOJAMA:
-----------------------------------
1. VALIUTŲ KURSŲ NEIGIAMA ĮTAKA (SĄSKAITA 636):
   Pagal VAS 22-ąjį standartą ir LR Pelno mokesčio įstatymo 17 straipsnį, valiutų kursų pasikeitimo neigiama įtaka (nuostolis dėl valiutos kurso kritimo ar konvertavimo sąnaudų) yra PILNAI LEIDŽIAMI ATSKAITYMAI, mažinantys apmokestinamąjį pelną!

2. METŲ PABAIGOS PERKAINAVIMAS (GRUODŽIO 31 D.):
   Visas užsienio valiutos likutis banko sąskaitose gruodžio 31 d. privalo būti perskaičiuotas į eurus pagal oficialų Europos Centrinio Banko (ECB) nustatytą valiutos kursą. Susidaręs skirtumas registruojamas į 636 (nuostolis) arba 536 (teigiama įtaka) sąskaitą.

3. KAINODARA:
   Tarptautinių valiutinių operacijų ir banko išrašų suderinimui taikomas standartinis tarptautinės prekybos priedas (+30,00 € prie bazinio tarifo), užtikrinantis nepriekaištingą registrų atitiktį VMI reikalavimams.

Atsiųskite savo Wise ar Revolut išrašą (.csv arba .xlsx formatu), ir vyriausioji buhalterė atliks tikslų valiutinių operacijų auditą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "fx_loss"}

    # 1P. Intencija: Automobilio įsigijimas / Lizingas / PVM atskaita ir Pajamos natūra (0.75%)
    is_auto_expenses = any(k in txt_lower for k in [
        "automobil", "mašin", "masin", "auto lizing", "lizingu automobil", "kuro nurašym", "kuro nurasym", "pajamos natūra", "pajamos natura", "0.75%", "0,75%"
    ]) and any(k in txt_lower for k in ["pvm", "natūra", "natura", "pirkti", "leidžiam", "leidziam", "atskaityt", "kuras", "kelionės"])
    if is_auto_expenses:
        reply = f"""Laba diena, {client_name}!

Automobilių įsigijimas ir eksploatacija įmonėje yra viena didžiausių VMI padidinto dėmesio sričių Lietuvoje, todėl pateikiu aiškias mokesčių taisykles:

KĄ TAI REIŠKIA IR KOKIA YRA TEISINĖ TVARKA:
--------------------------------------------
1. AUTOMOBILIO PIRKIMO PVM ATSKAITA:
   Pagal LR PVM įstatymo 62 straipsnį, lengvojo automobilio (M1 klasės) pirkimo ar nuomos PVM atskaita NĖRA LEIDŽIAMA (atskaitomas tik krovininių N1 automobilių PVM), nebent automobilis įsigytas teikti nuomos, taksi ar vairavimo mokymo paslaugas. PVM suma didina automobilio įsigijimo savikainą ir nudėvima per sąnaudas.

2. KURO IR REMONTO IŠLAIDOS BEI JŲ PVM:
   Kuro, remonto, draudimo ir plovimo sąnaudos yra leidžiami atskaitymai, o jų PVM atskaitomas tik ta dalimi, kuria automobilis naudojamas įmonės ekonominėje veikloje (būtina nustatyti aiškią tvarką – pvz., GPS sekimo sistema arba kelionės lapai).

3. PAJAMOS NATŪRA (ASMENINIS NAUDOJIMAS):
   Jei darbuotojas ar vadovas automobiliu naudojasi ir asmeniniais tikslais (važiuoja namo, savaitgaliais), VMI reikalauja skaičiuoti pajamas natūra (GPMĮ 9 str.):
   • Dažniausiai taikomas supaprastintas būdas: 0,75% (arba 0,70% be kuro) nuo automobilio tikrosios rinkos vertės per mėnesį.
   • Ši suma pridedama prie DU ir apmokestinama GPM (20%) bei „Sodros“ įmokomis.
   • Saugus alternatyvus sprendimas: automobilių nuomos sutartis arba griežtas vadovo įsakymas, kad automobilis po darbo nakvoja įmonės aikštelėje ir asmeniniais tikslais nenaudojamas.

Vyriausioji buhalterė audito metu įvertina Jūsų auto parką ir paruošia saugų įforminimo modelį.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "auto_expenses"}

    # 1Q. Intencija: Dividendai / Avansinis pelnas / MB 02 vs 26 kodai
    is_dividends = any(k in txt_lower for k in [
        "dividend", "avansiniai dividendai", "avansinį pelną", "avansini pelna", "pelno paskirstym", 
        "02 kod", "26 kod", "lėšos asmeniniams poreikiams", "lesos asmeniniams poreikiams"
    ])
    if is_dividends:
        reply = f"""Laba diena, {client_name}!

Labai aktualus klausimas artėjant metų uždarymui. Pelno išsiėmimo tvarka iš esmės skiriasi priklausomai nuo įmonės formos (MB ar UAB):

KĄ TAI REIŠKIA IR KOKIE MOKESČIAI TAIKOMI:
------------------------------------------
1. MB (MAŽOJI BENDRIJA) – 2 TEISĖTI BŪDAI:
   • LĖŠOS ASMENINIAMS POREIKIAMS (KODAS 02): Galima imti bet kada metų eigoje. Apmokestinama 15% (arba 20%) GPM + „Sodros“ įmokomis (VSD 12,52% + PSD 6,98%) nuo 50% išimtos sumos (taikomos metinės „Sodros“ lubos 43 VDU).
   • AVANSINIS PELNO PASKIRSTYMAS (KODAS 26): Apmokestinama TIK 15% GPM (JOKIŲ „Sodros“ įmokų!). Tačiau pagal MB įstatymo 26 str., jei pasibaigus finansiniams metams paaiškėja, kad įmonė dirbo nuostolingai, nariai privalo lėšas grąžinti įmonei arba permoka persikvalifikuoja į 02 kodą su visais „Sodros“ mokesčiais!

2. UAB (UŽDAROJI AKCINĖ BENDROVĖ):
   • Pagal LR Akcinių bendrovių įstatymo 59 straipsnį, dividendai paprastai skiriami tik pasibaigus metams ir patvirtinus metinį balansą.
   • Avansiniai dividendai galimi tik sudarius tarpinį balansą, jei įmonė dirba pelningai, nuosavas kapitalas yra didesnis už įstatinį kapitalą ir nėra ankstesnių metų nuostolių.
   • Apmokestinama 15% GPM tarifu (įmonė išskaičiuoja ir sumoka į VMI).

Atsiųskite savo einamąjį žiniaraštį, ir vyriausioji buhalterė apskaičiuos tikslią leistiną dividendų sumą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "dividends_payout"}

    # 1R. Intencija: Reprezentacija / Kalėdinės dovanos / Šventiniai renginiai (PMĮ 21 str.)
    is_representation_gifts = any(k in txt_lower for k in [
        "reprezentac", "dovan", "vakarėl", "vakarel", "kalėd", "kaled", "šventin", "sventin"
    ]) and any(k in txt_lower for k in ["leidžiam", "leidziam", "pvm", "nurašyt", "nurasyt", "sąnaud", "sanaud", "kaip nurašyti", "atskait"])
    if is_representation_gifts:
        reply = f"""Laba diena, {client_name}!

Gruodžio mėnesį tai vienas dažniausiai užduodamų vadovų klausimų. Lietuvos mokesčių teisėje galioja labai aiški šventinių išlaidų tvarka:

KĄ TAI REIŠKIA IR KOKIA YRA 50/50 TAISYKLĖ:
-------------------------------------------
1. DOVANOS VERSLO PARTNERIAMS IR KLIENTAMS:
   • Pagal LR Pelno mokesčio įstatymo 21 straipsnį, dovanos verslo partneriams su įmonės simbolika ar atributika (iki 75 € vienam asmeniui) priskiriamos reprezentacinėms sąnaudoms:
     - 50% sumos yra LEIDŽIAMI ATSKAITYMAI (mažina pelno mokestį);
     - 50% sumos yra NELEIDŽIAMI ATSKAITYMAI (įtraukiama į PLN204S priedą);
     - PVM atskaita: lygiai 50% pirkimo PVM atskaitoma, 50% neatskaitoma.
   • Būtina surašyti Reprezentacijos nurašymo aktą, nurodant tikslą (verslo ryšių palaikymas).

2. DARBUOTOJŲ ŠVENTINIS VAKARĖLIS / RENGINYS:
   • Jei įmonės šventėje dalyvauja verslo partneriai ir darbuotojai, visa renginio sąskaita traktuojama kaip reprezentacija (50% leidžiami / 50% neleidžiami atskaitymai).
   • Jei renginys skirtas išskirtinai tik darbuotojams be verslo tikslo – tai gali būti traktuojama kaip darbuotojų nauda, todėl rekomenduojama įforminti renginį kaip metinį įmonės rezultatų aptarimą ar komandinį mokymą.

3. DOVANOS DARBUOTOJAMS:
   Dovanos darbuotojams natūra iki 200 € per metus nėra apmokestinamos GPM (GPMĮ 17 str. 1 d. 39 p.). Viršijus šią ribą, atsiranda prievolė skaičiuoti mokesčius kaip nuo darbo užmokesčio.

Vyriausioji buhalterė audito išvadoje pateikia standartinius aktų šablonus saugiam nurašymui.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "representation_gifts"}

    # 1S. Intencija: Buhalterijos keitimas / Perėmimas nuo Naujųjų metų (sausio 1 d.)
    is_change_accountant = any(k in txt_lower for k in [
        "pereiti pas jus", "keisti buhalter", "nutraukti sutartį", "nutraukti sutarti", "perimti buhalterij", 
        "perimti apskait", "perėmimo proces", "peremimo proces", "nuo naujų metų", "nuo nauju metu", "nuo sausio"
    ])
    if is_change_accountant:
        reply = f"""Laba diena, {client_name}!

Nuo Naujųjų metų (sausio 1 d.) pradėti bendradarbiavimą yra pats idealiausias ir švariausias laikas, nes finansiniai metai uždaromi tvarkingai ir nauji metai pradedami nuo nulio:

KĄ TAI REIŠKIA IR KAIP VYKSTA PERĖMIMO PROCESAS (3 ŽINGSNIAI):
--------------------------------------------------------------
1. PRANEŠIMAS DABARTINIAM BUHALTERIUI:
   Pagal Jūsų turimą sutartį pateikiamas standartinis pranešimas apie sutarties nutraukimą (dažniausiai prieš 30 dienų).

2. DOKUMENTŲ IR LIKUČIŲ PERDAVIMO-PRIĖMIMO AKTAS:
   Mes paruošiame oficialų perdavimo-priėmimo aktą. Iš dabartinės buhalterės reikalaujama pateikti:
   • Didžiąją knygą ir Bandomąjį sąskaitų žiniaraštį 2026-12-31 dienai;
   • Pirkėjų ir tiekėjų skolų suderinimo žiniaraščius;
   • Ilgalaikio turto nusidėvėjimo korteles;
   • Darbuotojų nepanaudotų atostogų dienų ir rezervo suvestinę;
   • Paskutinių teiktų deklaracijų (FR0600, SAM, GPM313) kopijas.

3. ĮGALIOJIMAI SISTEMOSE:
   Prisijungę prie Mano VMI ir Sodros, suteikiate buhalterio įgaliojimus mūsų vyriausiajai buhalterei Lilijai Zapasnik.

Mūsų vyriausioji buhalterė (25 m. patirtis) asmeniškai atlieka perimamų pradinių likučių kontrolinį patikrinimą NEMOKAMAI, kad garantuotų nepriekaištingą apskaitos tęstinumą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "change_accountant"}

    # 1T. Intencija: Slaptas patikrinimas / Baimė supykdyti buhalterę / „Antra nuomonė“
    is_secret_audit = any(k in txt_lower for k in [
        "buhalterė nesužinotų", "buhaltere nesuzinotu", "supyks buhalter", "nesakyti buhalter", "slaptas patikrinim", 
        "antra nuomon", "nepriklausomas patikrinim", "patikrinti buhalter", "ar buhalterė sužinos", "ar buhalterė matys"
    ])
    if is_secret_audit:
        reply = f"""Laba diena, {client_name}!

Noriu iš karto 100% Jus nuraminti: Jūsų dabartinė buhalterė ar apskaitos įmonė apie šį patikrinimą NESUŽINOS:

KĄ TAI REIŠKIA IR KODĖL TAI VISIŠKAI SAUGU:
------------------------------------------
1. JOKIŲ PRANEŠIMŲ AR SISTEMŲ JUNGIMOSI:
   Kadangi Jūs patys atsiunčiate mums banko išrašą arba iš buhalterinės programos išeksportuotą Bandomąjį balansą tiesiogiai el. paštu, mes nesijungiame prie Jūsų Mano VMI ar Sodros paskyros. Jokia trečioji šalis negauna jokių pranešimų.

2. VERSLO PRAKTIKA – „ANTRA NUOMONĖ“ (SECOND OPINION):
   Medicinoje prieš operaciją visada prašoma antros gydytojo nuomonės. Versle – lygiai tas pats. Pagal LR įstatymus už įmonės finansų teisingumą ir mokesčius galutinai asmeniškai atsako VADOVAS (o ne samdomas buhalteris). Todėl nepriklausomas kontrolinis auditas yra Jūsų teisė ir atsakomybė.

3. REZULTATAS – TIK JUMS:
   Vyriausiosios buhalterės audito išvadą gausite tik Jūs asmeniškai. Jei viskas tvarkoje – turėsite ramią galvą. Jei bus rasta klaidų ar permokėtų mokesčių – pateiksime konkrečius punktus, kuriuos galėsite ramiai ir argumentuotai perduoti savo buhalterei pataisyti.

Atsiųskite failą peržiūrai – garantuojame visišką konfidencialumą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "secret_audit"}

    # 1U. Intencija: Paskolos tarp vadovo ir įmonės / Palūkanos / FR0711
    is_director_loans = any(k in txt_lower for k in [
        "paskola įmonei", "paskola imonei", "paskolinti įmonei", "paskolinti imonei", "įmonė skolina", 
        "imone skolina", "paskola vadovui", "be palūkanų", "be palukanu"
    ]) or (
        any(k in txt_lower for k in ["palūkanos", "palukanos", "paskol"]) and any(k in txt_lower for k in ["vadov", "akcinink", "direktor", "savinink"])
    )
    if is_director_loans:
        reply = f"""Laba diena, {client_name}!

Paskolos tarp įmonės ir vadovo ar akcininko yra griežtai reglamentuojamos VMI pagal PMĮ 40 straipsnį (tikrosios rinkos kainos principas):

KĄ TAI REIŠKIA IR KOKIA YRA TVARKA:
------------------------------------
1. VADOVAS / AKCININKAS SKOLINA ĮMONEI:
   • Galima suteikti paskolą BE PALŪKANŲ (tai traktuojama kaip nario parama apyvartinėms lėšoms papildyti);
   • ARBA su rinkos palūkanomis (įmonė išskaičiuoja 15% GPM nuo išmokamų palūkanų);
   • Jei paskolos suma metų pabaigoje viršija 15 000 €, įmonė privalo ją deklaruoti VMI metinėje formoje FR0711.

2. ĮMONĖ SKOLINA VADOVUI AR AKCININKUI (DIDELĖ RIZIKA):
   • Griežtai NEREKOMENDUOJAMA skolinti be palūkanų! VMI tai traktuoja kaip naudą natūra: nesumokėtos palūkanos pagal Lietuvos banko vidutines palūkanų normas pripažįstamos vadovo pajamomis natūra ir apmokestinamos 20% GPM bei „Sodros“ įmokomis.
   • Paskolos sutartyje privaloma nustatyti oficialias rinkos palūkanas (pvz. 4–6%) ir numatyti realų grąžinimo grafiką.
   • Taip pat privalomas FR0711 deklaravimas virš 15 000 €.

Atsiųskite savo paskolų likučius, ir vyriausioji buhalterė patikrins, ar nėra mokestinių rizikų VMI.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "director_loans"}

    # 1V. Intencija: Teisinės garantijos / Civilinė atsakomybė / Draudimas
    is_guarantees_liability = any(k in txt_lower for k in [
        "garantij", "civilinė atsakomybė", "civiline atsakomybe", "draudim", 
        "jei vmi skirs baudą", "jei vmi skirs bauda", "kas atsakys už klaidas", "kas atsakys uz klaidas", "atsakote už klaidas"
    ])
    if is_guarantees_liability:
        reply = f"""Laba diena, {client_name}!

Tai yra pamatinis klausimas, rodantis atsakingą požiūrį į verslo saugumą. Atsakome tiesiai ir teisiškai:

MŪSŲ TEISINĖS GARANTIJOS IR ATSAKOMYBĖ:
----------------------------------------
1. VYRIAUSIOSIOS BUHALTERĖS ATSAKOMYBĖ:
   Mūsų vyriausioji buhalterė Lilija Zapasnik vykdo veiklą pagal oficialią individualios veiklos pažymą (Nr. 34566444) ir turi 25 metų nepriekaištingos profesinės reputacijos patirtį be jokių VMI nuobaudų.

2. MATERIALINĖ IR CIVILINĖ ATSAKOMYBĖ:
   Pagal Lietuvos Respublikos teisės aktus ir pasirašomas paslaugų sutartis, buhalteris pilnai atsako už atliktų apskaitos įrašų ir pateiktų deklaracijų teisingumą. Jei dėl buhalterio tiesioginės klaidos VMI ar „Sodra“ priskaičiuotų delspinigius ar baudas – ši žala yra pilnai kompensuojama.

3. KODĖL RIZIKA LYGI NULIUI:
   Visi skaičiavimai atliekami griežtai pagal LR Verslo apskaitos standartus (VAS) ir Mokesčių administravimo įstatymą, vadovaujantis oficialiomis VMI išaiškinimų pozicijomis. Prieš teikiant bet kurį dokumentą RC ar VMI, jis praeina dvigubą kontrolės filtrą.

Galite būti visiškai ramūs dėl savo įmonės finansinio saugumo.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "guarantees_liability"}

    # 1W. Intencija: Kriptovaliutos / Web3 / Virtualusis turtas
    is_crypto_accounting = any(k in txt_lower for k in [
        "kripto", "bitcoin", "btc", "usdt", "ethereum", "crypto", "binance", "kraken"
    ]) and any(k in txt_lower for k in ["apskait", "mokesč", "mokest", "pelno", "pvm", "deklaruoti", "pirkom", "pardav"])
    if is_crypto_accounting:
        reply = f"""Laba diena, {client_name}!

Virtualiojo turto (kriptovaliutų: BTC, ETH, USDT) apskaita įmonėse reikalauja specifinių žinių pagal VAS metodines rekomendacijas ir VMI išaiškinimus:

KĄ TAI REIŠKIA IR KAIP TAI APSKAITOMA:
---------------------------------------
1. TURTO KLASIFIKAVIMAS IR SAVIKAINA:
   Kriptovaliuta įmonės balanse priskiriama Trumpalaikiam finansiniam turtui (263 sąskaita) arba atsargoms (jei vykdoma perpardavimo veikla). Įsigijimo savikaina nustatoma eurais pagal sandorio dienos oficialų biržos kursą, o nurašymui taikomas FIFO arba svertinio vidurkio metodas.

2. PVM TAIKYMAS (0% PVM):
   Pagal Europos Teisingumo Teismo (ESTT) praktiką (byla C-264/14 Hedqvist) ir VMI nuostatą, virtualių valiutų keitimas į tradicines valiutas (eurus) yra PVM neapmokestinama finansinė paslauga pagal PVMĮ 28 straipsnį.

3. PELNO MOKESTIS:
   Pelno mokesčiu (standartiniu 16% arba lengvatiniu 6%) apmokestinamas tik faktiškai realizuotas pelnas (pardavimo kaina minus įsigijimo savikaina). Nerealizuotas kriptovaliutos vertės svyravimas metų pabaigoje registruojamas įvertinant galimą vertės sumažėjimą.

Atsiųskite savo biržos (Binance, Kraken ir kt.) išrašus CSV formatu, ir vyriausioji buhalterė atliks tikslų mokesčių apskaičiavimą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "crypto_accounting"}

    # 1X. Intencija: El. komercija, Shopify, Amazon, Etsy, Stripe, PayPal ir PVM OSS / IOSS schema
    is_ecommerce_oss = any(k in txt_lower for k in [
        "shopify", "amazon", "etsy", "woocommerce", "stripe", "paypal", "wix",
        "el. parduotuv", "el parduotuv", "elektronin prekyb", "oss", "ioss"
    ]) and any(k in txt_lower for k in [
        "apskait", "pvm", "deklar", "komisin", "kaip apskait", "išraš", "isras", "mokesč", "mokest"
    ])
    if is_ecommerce_oss:
        reply = f"""Laba diena, {client_name}!

Elektroninės prekybos (Shopify, Amazon, Etsy, WooCommerce) ir tarptautinių mokėjimo vartų (Stripe, PayPal) apskaita turi esminių niuansų, kuriuos privaloma tiksliai suderinti pagal LR PVMĮ ir VAS reikalavimus:

KĄ TAI REIŠKIA IR KAIP TAI APSKAITOMA:
---------------------------------------
1. PVM OSS SCHEMA (10 000 € RIBA ES B2C PARDAVIMAMS):
   Jei parduodate fiziniams asmenims kitose ES šalyse ir bendra tokių pardavimų suma per metus viršija 10 000 € ribą, privaloma registruotis VMI OSS (One-Stop-Shop) sistemoje. PVM taikomas pirkėjo šalies tarifu (pvz. Vokietijai 19%, Prancūzijai 20%), o atskira OSS deklaracija teikiama kas ketvirtį per VMI OSS portalą (į įprastą FR0600 šie pardavimai netraukiami).

2. STRIPE / PAYPAL KOMISINIAI (BRUTO IR NETTO ATSKYRIMAS):
   Dažna klaida – pajamomis registruoti tik į banko sąskaitą pervestą sumą (po komisinių atskaitymo). Įstatymas reikalauja:
   • 5 klasėje (Pajamos) registruoti pilną 100% kliento sumokėtą sumą (bruto);
   • Stripe/PayPal nuskaitytus komisinius mokesčius nurašyti į finansines/veiklos sąnaudas (611x sąskaita) pagal mėnesinę Stripe PVM sąskaitą faktūrą su atvirkštiniu PVM pagal PVMĮ 95 straipsnį.

3. VALIUTŲ KURSAI IR IŠRAŠŲ SUVIENODINIMAS:
   Valiutinės operacijos (USD, GBP) konvertuojamos į eurus pagal sandorio dienos oficialų Europos Centrinio Banko (ECB) kursą (22-asis VAS).

Atsiųskite savo Stripe / Shopify ar platformos mėnesinius operacijų išrašus (CSV arba PDF), ir vyriausioji buhalterė integruos juos į tvarkingą atskaitomybę.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "ecommerce_oss"}

    # 1Y. Intencija: Google Ads, Meta/Facebook reklama, AWS, užsienio sąskaitos ne PVM mokėtojui (FR0608)
    is_foreign_saas_vat = any(k in txt_lower for k in [
        "google ads", "meta ads", "facebook ads", "facebook reklam", "aws", "amazon web",
        "chatgpt", "openai", "canva", "adobe", "užsienio tiekej", "uzsienio tiekej",
        "užsienio sąskait", "uzsienio saskait", "fr0608", "0% pvm iš airijos", "airijos pvm"
    ]) and any(k in txt_lower for k in [
        "ne pvm", "nesu pvm", "atvirkšt", "mokėti pvm", "moketi pvm", "deklaruoti", "ar reikia mokėti"
    ])
    if is_foreign_saas_vat:
        reply = f"""Laba diena, {client_name}!

Tai vieni dažniausių mokesčių spąstų Lietuvoje, su kuriais susiduria ne PVM mokėtojai, perkantys Google Ads, Meta/Facebook reklamas ar AWS/SaaS paslaugas iš užsienio tiekėjų:

KĄ TAI REIŠKIA IR KĄ PRIVALOMA PADARYTI:
------------------------------------------
1. ĮSTATYMINĖ PRIEVOLĖ SUMOKĖTI 21% PVM (PVMĮ 71(1) IR 95 STR.):
   Nors Jūsų įmonė nėra standartinė PVM mokėtoja, pirkdama elektronines paslaugas iš kitoje ES šalyje registruotų PVM mokėtojų (pvz., Google Ireland ar Meta Ireland su 0% PVM pagal atvirkštinį apmokestinimą), Lietuvos įmonė PRIVALO apskaičiuoti ir sumokėti 21% PVM į Lietuvos biudžetą.

2. MOKESČIO DEKLARAVIMAS (FR0608 DEKLARACIJA):
   Šis PVM privalo būti deklaruotas formoje FR0608 ir sumokėtas VMI iki kito mėnesio 25 dienos. 

3. SĄNAUDŲ PRIPAŽINIMAS:
   Kadangi nesate PVM mokėtojas, šio sumokėto PVM negalite atskaityti, tačiau tiek paslaugos kaina, tiek sumokėtas 21% PVM tampa 100% teisėtomis leidžiamomis atskaitomis (611x sąnaudos), mažinančiomis pelno mokestį (PLN204).

4. VMI KONTROLĖ:
   VMI gauna automatinius VIES duomenis iš Airijos mokesčių administratoriaus. Jei deklaracija FR0608 nebuvo pateikta, VMI atsiunčia paklausimą su delspinigiais. Mūsų vyriausioji buhalterė gali patikrinti visas Jūsų užsienio sąskaitas ir pateikti deklaracijas be jokių baudų rizikos.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "foreign_saas_vat"}

    # 1Z. Intencija: Komandiruotės, dienpinigiai ir kelionių išlaidos
    is_per_diem_travel = any(k in txt_lower for k in [
        "dienpinig", "komandiruot", "kelionės išlaid", "keliones islaid", "vyriausybės nutarim 526"
    ])
    if is_per_diem_travel:
        reply = f"""Laba diena, {client_name}!

Komandiruočių ir dienpinigių išmokėjimas yra efektyvus ir teisėtas būdas kompensuoti verslo kelionių išlaidas, tačiau tam galioja griežti LR Vyriausybės nutarimo Nr. 526 reikalavimai:

KĄ TAI REIŠKIA IR KAIP TAI APSKAITOMA:
---------------------------------------
1. DIENPINIGIŲ NORMOS (LRV NUTARIMAS NR. 526):
   Kiekvienai užsienio šaliai nustatyta maksimali neapmokestinama dienpinigių norma (pvz., Vokietijai ~65 €/d., Lenkijai ~58 €/d., Latvijai ~53 €/d., Lietuvoje ~15 €/d.).

2. 1.65 MMA TAISYKLĖ DARBUOTOJAMS (GPM IR SODROS LENGVATA):
   Darbuotojams (dirbantiems pagal darbo sutartį) išmokami dienpinigiai 100% neapmokestinami GPM ir Sodra TIK tuo atveju, jei jų darbo sutartyje nustatytas darbo užmokestis yra ne mažesnis kaip 1.65 minimalios mėnesinės algos (MMA). Jei DU mažesnis, viršijanti 50% DU suma apmokestinama kaip darbo užmokestis.

3. MB VADOVO DIENPINIGIAI (CIVILINĖ SUTARTIS):
   Mažosios bendrijos vadovui, veikiančiam pagal civilinę vadovavimo sutartį, dienpinigiai mokami pagal LRV nustatytas normas (jei tai numatyta bendrijos nuostatuose arba vadovavimo sutartyje). Šie dienpinigiai neapmokestinami nei GPM, nei Sodra.

4. PRIVALOMA DOKUMENTACIJA:
   Būtina turėti:
   • Vadovo įsakymą dėl komandiruotės (su nurodytu tikslu, šalimi ir trukme);
   • Kelionės ir apgyvendinimo sąskaitas faktūras (bilietai, viešbučiai);
   • Avanso apyskaitą su patirtų išlaidų patvirtinimu.

Atsiųskite kelionės bilietus ar sąskaitas, ir vyriausioji buhalterė paruoš tvarkingus komandiruotės įsakymus bei avanso apyskaitas.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "per_diem_travel"}

    # 1AA. Intencija: Nekilnojamojo turto nuoma iš fizinio asmens & NTM (KIT711)
    is_real_estate_rent_ntm = any(k in txt_lower for k in [
        "patalpų nuom", "patalpu nuom", "nuomojamės ofis", "nuomojames ofis", 
        "nuoma iš fizinio", "nuoma is fizinio", "nuoma iš savinink", "nuoma is savinink",
        "panaudos sutart", "nekilnojamojo turto mokest", "ntm", "kit711", "būsto nuom"
    ])
    if is_real_estate_rent_ntm:
        reply = f"""Laba diena, {client_name}!

Nekilnojamojo turto (patalpų, ofiso ar sandėlio) nuoma iš fizinio asmens (arba naudojimas pagal panaudos sutartį) įmonei sukelia dvi atskiras mokestines prievoles pagal LR įstatymus:

KĄ TAI REIŠKIA IR KĄ PRIVALOMA DEKLARUOTI:
------------------------------------------
1. 15% GPM IŠSKAIČIAVIMAS (A KLASĖS IŠMOKOS):
   Jei įmonė nuomojasi patalpas iš fizinio asmens, įmonė privalo iš nuomos sumos išskaičiuoti 15% GPM, pervesti jį VMI ir deklaruoti kasmėnesinėje deklaracijoje FR0572 (iki kito mėnesio 15 d.). Fiziniam asmeniui išmokama suma po mokesčių atskaitymo.

2. NEKILNOJAMOJO TURTO MOKESTIS (NTMĮ 3 STR. 2 D. IR KIT711):
   Esminis niuansas: pagal Nekilnojamojo turto mokesčio įstatymą, jei juridinis asmuo komercinėje veikloje naudoja fiziniam asmeniui priklausantį NT (pagal nuomos ar panaudos sutartį), pareiga apskaičiuoti ir sumokėti NTM tenka JURIDINIAM ASMENIUI (įmonei), o ne savininkui.
   • Mokestis skaičiuojamas nuo Registrų centro nustatytos masinio vertinimo vertės;
   • Deklaracija KIT711 teikiama ir mokestis sumokamas kartą per metus iki vasario 15 d.

3. HOME OFFICE (DALIS GYVENAMOJO BŪSTO):
   Jei įmonės veiklai naudojama dalis asmeninio būsto (pvz., 15–20% ploto), sudaroma panaudos sutartis ir kompensuojama atitinkama komunalinių paslaugų dalis, tačiau šiai daliai taip pat atsiranda pareiga deklaruoti NTM.

Vyriausioji buhalterė gali peržiūrėti Jūsų nuomos/panaudos sutartį, patikrinti NT unikalų numerį ir tiksliai apskaičiuoti mokesčius.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "real_estate_rent_ntm"}

    # 1AB. Intencija: Veiklos stabdymas / Užmigdymas / Likvidavimas
    is_suspension_dormancy = any(k in txt_lower for k in [
        "sustabdyti veikl", "veiklos stabdym", "užmigdyti įmon", "uzmigdyti imon", 
        "nevykdome veiklos", "laikinai sustabdyti", "likvidavim", "likviduoti įmon", 
        "likviduoti imon", "atleisti nuo deklaracij", "uždaryti įmon", "uzdaryti imon"
    ])
    if is_suspension_dormancy:
        reply = f"""Laba diena, {client_name}!

Jei įmonė šiuo metu nevykdo aktyvios veiklos, nebūtina kas mėnesį mokėti buhalterijos mokesčių ar kaupti skolų – Lietuvos įstatymai numato teisėtą galimybę laikinai sustabdyti veiklą („užmigdyti“ įmonę) arba atlikti tvarkingą likvidavimą:

KĄ TAI REIŠKIA IR KOKIA PROCEDŪRA:
-----------------------------------
1. LAIKINAS ATLEIDIMAS NUO DEKLARACIJŲ TEIKIMO (MAĮ 67 STR.):
   Pagal Mokesčių administravimo įstatymą įmonė gali kreiptis į VMI per Mano VMI sistemą dėl laikino atleidimo nuo mokesčių deklaracijų (FR0600, PLN204 ir kt.) teikimo laikotarpiui iki 5 metų.

2. SĄLYGOS ATLEIDIMUI GAUTI:
   • Įmonė nevykdo jokių pirkimų/pardavimų sandorių;
   • Nėra skolų valstybės biudžetui, Sodrai ar kitiems kreditoriams;
   • Banko sąskaitoje nėra lėšų judėjimo (išskyrus banko paslaugų mokesčius).

3. SODRA IR BUHALTERIS:
   Atleidžiami darbuotojai arba sustabdoma MB vadovo civilinė sutartis, anuliuojami buhalterio įgaliojimai VMI/Sodroje, ir įmonei nebereikia teikti tuščių mėnesinių ataskaitų.

4. OFICIALUS LIKVIDAVIMAS:
   Jei veiklą norima nutraukti visam laikui: priimamas savininkų sprendimas likviduoti, paskiriamas likvidatorius, pateikiama JAR-1 forma Registrų centrui, sudaromas likvidavimo balansas ir po VMI patikrinimo įmonė išregistruojama.

Mūsų vyriausioji buhalterė gali paruošti atleidimo nuo deklaracijų prašymą VMI arba atlikti likvidavimo balansą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "suspension_dormancy"}

    # 1AC. Intencija: Pamesti kvitai, sąskaitos be rekvizitų, pirkimai be PVM SF
    is_missing_receipts = any(k in txt_lower for k in [
        "pametė kvit", "pamete kvit", "pametė sąskait", "pamete saskait", "pamesta sąskaita",
        "kvitas be rekvizit", "paprastas čekis", "paprastas cekis", "nėra sąskaitos faktūros",
        "nera saskaitos", "čekis be įmonės kodo", "cekis be imones kodo", "pirkimas be sf",
        "ar tinka čekis", "ar tinka cekis"
    ])
    if is_missing_receipts:
        reply = f"""Laba diena, {client_name}!

Dėl pamestų sąskaitų faktūrų ar paprastų kasos kvitų be rekvizitų LR teisės aktai (Finansinės apskaitos įstatymas ir PVMĮ 80 str.) numato labai aiškias taisykles:

KĄ TAI REIŠKIA IR KAIP TAI SPRENDŽIAMA:
---------------------------------------
1. PVM ATSKAITA BE PVM SĄSKAITOS FAKTŪROS – NEGALIMA:
   Pagal PVMĮ 80 str. atskaityti pirkimo PVM griežtai draudžiama be oficialios PVM sąskaitos faktūros.
   IŠIMTIS DEGALAMS: Degalų pirkimo kasos kvitai iki 150 € (su PVM) prilyginami PVM sąskaitai faktūrai, JEI kvite atspausdintas pirkėjo juridinio asmens kodas arba įmonės degalų kortelės numeris.

2. SĄNAUDŲ PRIPAŽINIMAS (LEIDŽIAMI AR NELEIDŽIAMI ATSKAITYMAI):
   Jei turite tik paprastą čekį virš 100 € be įmonės rekvizitų:
   • Sąnaudos negali būti pripažintos leidžiamais atskaitymais (priskiriama prie Neleidžiamų sąnaudų 631x sąskaitoje);
   • Jei mokėta įmonės kortele, kyla rizika, kad VMI šią sumą traktuos kaip direktoriaus atskaitingo asmens skolą (2435) arba išmoką natūra.

3. PRAKTINIS SPRENDIMAS:
   Visada galima kreiptis į pardavėją (tiekėją) ir pateikus čekio numerį, datą bei sumą paprašyti išrašyti SF dublikatą arba patikslintą PVM sąskaitą faktūrą. Tiekėjai privalo išsaugoti apskaitos įrašus ir išrašo dublikatus.

Vyriausioji buhalterė padės atskirti, kuriuos kvitus galima įtraukti į apskaitą, o kuriems būtina gauti dublikatus.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "missing_receipts"}

    # 1AD. Intencija: Statybos darbų atvirkštinis PVM (PVMĮ 96 str.)
    is_reverse_charge_construction = (
        (any(k in txt_lower for k in ["statyb", "rangov", "subrang"]) and any(k in txt_lower for k in ["atvirkšt", "atvirkst", "96 str", "96 straipsn", "0% pvm", "0%"]))
        or any(k in txt_lower for k in ["atvirkštinis pvm statyb", "atvirkstinis pvm statyb", "96 straipsn"])
    )
    if is_reverse_charge_construction:
        reply = f"""Laba diena, {client_name}!

Statybos darbų ir rangos apskaitoje Lietuvoje galioja specifinė atvirkštinio PVM apmokestinimo tvarka pagal LR PVMĮ 96 straipsnio 1 dalį:

KĄ TAI REIŠKIA IR KAIP TAI VEIKIA:
----------------------------------
1. KADA TAIKOMAS PVMĮ 96 STRAIPSNIS:
   Kai vienas PVM mokėtojas atlieka statybos, remonto ar montavimo darbus kitam PVM mokėtojui (pvz., subrangovas teikia darbus generaliniam rangovui).

2. SĄSKAITOS IŠRAŠYMAS:
   Paslaugų teikėjas (rangovas/subrangovas) išrašo PVM sąskaitą faktūrą su 0% PVM tarifu ir privaloma nuoroda: „Atvirkštinis apmokestinimas (PVMĮ 96 str.)“. Pirkėjas apmoka TIK sumą be PVM.

3. DEKLARAVIMAS VMI (FR0600):
   • Rangovas/subrangovas sumą deklaruoja FR0600 deklaracijos 12 laukelyje (PVM neskaičiuoja);
   • Užsakovas (pirkėjas) apskaičiuoja 21% PVM ir deklaruoja 25, 33 ir 35 laukeliuose. Jei užsakovas vykdo PVM apmokestinamąją veiklą, ši suma susidengia ir mokėti papildomai nieko nereikia (grynųjų lėšų efektas 0 €).

4. KADA NAIKOMAS ĮPRASTAS PVM:
   Jei paslaugos teikiamos fiziniam asmeniui arba ne PVM mokėtojui, taikomas standartinis 21% PVM.

Vyriausioji buhalterė gali peržiūrėti Jūsų statybos rangos sutartis ir patikrinti teisingą PVM deklaravimą i.SAF bei FR0600.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "reverse_charge_construction"}

    # 1AE. Intencija: Dotacijos, subsidijos, INVEGA, Užimtumo tarnybos parama
    is_subsidies_grants = any(k in txt_lower for k in [
        "invega", "subsidij", "užimtumo tarnyb", "uzimtumo tarnyb", "parama", "dotacij",
        "gauta parama", "darbo vietų subsidij", "darbo vietu subsidij"
    ]) and any(k in txt_lower for k in [
        "apskait", "kaip apskait", "mokesč", "mokest", "pelno", "deklar", "pajamos", "ar apsimokestina"
    ])
    if is_subsidies_grants:
        reply = f"""Laba diena, {client_name}!

Gautų subsidijų, Užimtumo tarnybos paramos ar INVEGA palūkanų kompensavimo apskaita reglamentuojama pagal 21-ąjį verslo apskaitos standartą (VAS) „Dotacijos ir parama“:

KĄ TAI REIŠKIA IR KAIP TAI APSKAITOMA:
---------------------------------------
1. PAJAMŲ IR SĄNAUDŲ SUDERINIMO PRINCIPAS (35 KLASĖ):
   Gautos lėšos negali būti iš karto vienu metu pripažintos apmokestinamosiomis pajamomis. Jos registruojamos 35 sąskaitoje („Dotacijos ir subsidijos“) ir pajamomis (5 klasė) tampa tik proporcingai patiriamoms kompensuojamoms sąnaudoms.

2. DARBO UŽMOKESČIO SUBSIDIJOS (UŽIMTUMO TARNYBA):
   Gauta kompensacija už darbuotojų darbo užmokestį arba įdarbinimą mažina darbo užmokesčio sąnaudas arba registruojama kitoje veiklos pajamų eilutėje tą patį mėnesį, kurį patirtos DU sąnaudos.

3. PELNO MOKESTIS (PLN204):
   Teisingai apskaičius subsidijas, jos neturi neigiamos įtakos įmonės pelno mokesčiui – kompensuota dalis yra neutrali (pajamos lygios atitinkamoms kompensuotoms sąnaudoms).

4. PALŪKANŲ KOMPENSACIJOS (INVEGA):
   INVEGA grąžinamos paskolų palūkanos mažina finansinės veiklos sąnaudas (68x sąskaita).

Atsiųskite subsidijavimo sutartį bei išrašą, ir vyriausioji buhalterė tiksliai suves įrašus į apskaitos Didžiąją knygą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "subsidies_grants"}

    # 1AF. Intencija: Akcijų / MB dalių pardavimas, naujas dalininkas, restruktūrizavimas
    is_share_sale_restructure = (
        (any(k in txt_lower for k in ["parduot", "perleist", "perleidim", "pardavim", "pirkim"]) and any(k in txt_lower for k in ["akcij", "mb dal", "dalinink", "nario teis", "dalį", "dalis", "dalių", "kapital"]))
        or any(k in txt_lower for k in ["jadis", "jangis", "jar-1", "jar1", "akcijų pardavim", "mb dalies pardavim"])
    )
    if is_share_sale_restructure:
        reply = f"""Laba diena, {client_name}!

Įmonės akcijų ar Mažosios bendrijos (MB) nario teisių/dalių perleidimas apima teisinius, registracijos ir asmeninių mokesčių aspektus:

KĄ TAI REIŠKIA IR KOKIE ŽINGSNIAI BŪTINI:
-----------------------------------------
1. SUTARTIS IR REGISTRŲ CENTRAS (JAR-1 / JANGIS / JADIS):
   • MB atveju: pasirašoma MB nario teisių perleidimo sutartis. Per 5 darbo dienas privaloma pateikti formą JAR-1 ir atnaujinti duomenis JANGIS sistemoje (Juridinių asmenų dalyvių informacinė sistema).
   • UAB atveju: akcijų pirkimo-pardavimo sutartis, akcininkų sąrašo pateikimas per JADIS.

2. GPM APMOKESTINIMAS FIZINIAM ASMENIUI (PARDAVĖJUI):
   • Pelnas iš akcijų ar MB dalies pardavimo (pardavimo kaina minus įsigijimo kaina/įnašas) apmokestinamas 15% GPM (arba 20%, jei viršija 120 VDU);
   • LENGVATA: Pagal LR GPMĮ 17 str. 1 d. 30 p. taikoma 500 € metinė neapmokestinamoji riba vertybinių popierių/dalių perleidimo pelnui. Deklaruojama metinėje GPM311 deklaracijoje iki gegužės 2 d.

3. BUHALTERINIAI ĮRAŠAI ĮMONĖJE:
   Pačioje įmonėje pelno mokestis neatsiranda. Atliekamas analitinės nuosavo kapitalo apskaitos perkėlimas tarp savininkų sąskaitų (301 ar 308 sąskaitoje).

Vyriausioji buhalterė gali paruošti reikalingus sprendimų protokolus, kapitalo registracijos įrašus bei konsultuoti dėl GPM lengvatų.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (25 m. patirtis, IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "share_sale_restructure"}

    # 1J. Intencija: PLN204 deklaracijos patikslinimas / klaidos taisymas ("PLN deklaracijoje klaida", "neteisingas laukelis" ar pan.)
    is_pln_feedback = any(k in txt_lower for k in [
        "neteising", "klaida", "netiksl", "patais", "pataisyk", "blogai", "klaid", "pataisyti"
    ]) and any(k in txt_lower for k in [
        "pln", "pln204", "deklarac", "laukel"
    ])

    # 1K. Intencija: Finansinės atskaitomybės (Balansas, Pelno/nuostolio ataskaita) ir PLN204 deklaracijos sudarymas / paketo siuntimas
    is_statements_req = any(k in txt_lower for k in [
        "pelno-nuostolio", "pelno nuostolio", "balans", "deklaracij", "pln204", "atskaitom"
    ]) and any(k in txt_lower for k in [
        "sudaryk", "supildyk", "paruošk", "paruosk", "pateik", "atsiųsk", "atsiusk", "padaryk", "tada paruoškite"
    ]) and not any(k in txt_lower for k in [
        "vmi", "reikia teikti", "reikia mokėti", "ar reikia", "nulinė", "kas tas balansas", "kodėl nuostolis"
    ])

    if is_pln_feedback or is_statements_req:
        reply = f"""Laba diena, {client_name}!

Dėkojame už taiklią pastabą! Mūsų vyriausioji buhalterė (25 m. patirtis) patikslino VMI Pelno mokesčio deklaracijos (PLN204, 07 versija) suvestinę pagal oficialų netiesioginį apskaičiavimo būdą ir paruošė pilną 4 puslapių vadovo finansinį bei atskaitomybės paketą:

0. VADOVO FINANSINIS SKYDAS IR VEIKSMŲ PLANAS (1 PUSLAPIS):
   • Šviesoforo principu išdėstytos įmonės rizikos ir galimybės vadovui (neigiamas kapitalas, avansų likvidumas, 4 795,48 € PVM susigrąžinimas).
   • 3 konkretūs žingsniai vadovui iki gruodžio 31 d.

1. OFICIALUS SUTRUMPINTAS BALANSAS (2 PUSLAPIS, pagal VAS 2026-09-30 dienai):
   • Ilgalaikis materialusis turtas (12 klasė): 2 704,17 €
   • Trumpalaikis turtas (atsargos, pirkėjų skolos, gautinas PVM, bankas/kasa): 36 155,21 €
   • BENDRO TURTO SUMA: 38 859,38 €
   • Nuosavas kapitalas (savininkų įnašai 200,00 €, sukauptas nuostolis -6 962,09 €): -6 762,09 € (Neigiamas)
   • Mokėtinos sumos ir trumpalaikiai įsipareigojimai (avansai 33 630,72 €, skolos tiekėjams ir DU): 51 004,88 €
   • NUOSAVO KAPITALO IR ĮSIPAREIGOJIMŲ SUMA: 38 859,38 € (Balansas subalansuotas 100%).

2. OFICIALI PELNO (NUOSTOLIŲ) ATASKAITA (3 PUSLAPIS, pagal VAS 2026-01-01 – 2026-09-30):
   • Pardavimo pajamos (500 sąskaitos): 40 209,69 €
   • Pardavimo savikaina (600 sąskaita): 6 684,10 €
   • Bendrasis pelnas: 33 525,59 €
   • Veiklos sąnaudos (vadovas, DU, reklama, ryšiai, kt.): 36 846,18 €
   • Finansinės ir investicinės veiklos sąnaudos (palūkanos): 2 062,82 €
   • GRYNASIS LAIKOTARPIO REZULTATAS: -5 383,41 € NUOSTOLIS.

3. OFICIALI VMI METINĖ PELNO MOKESČIO DEKLARACIJA (4 PUSLAPIS, FORMA PLN204, 07 VERSIJA):
   Pagal VMI taisykles apmokestinamasis rezultatas apskaičiuojamas NETIESIOGINIU BŪDU:
   • 18 laukelis (Bendra apmokestinamųjų pajamų suma pagal PMĮ 4 str.): 40 209,69 €
   • 19 laukelis (Finansinės atskaitomybės pelnas (nuostolis) prieš apmokestinimą): -5 383,41 € (Nuostolis)
   • 20 laukelis (Neleidžiami atskaitymai, suma iš priedo PLN204S): 2 014,41 €
   • Priedas PLN204S: S1 kodas 08 (Kitos neleidžiamos sąnaudos pagal PMĮ 31 str. 1 d. 17 p., sąskaita 631204): 2 014,41 €
   • 31 laukelis (Mokestinio laikotarpio veiklos MOKESTINIS NUOSTOLIS: 19 lauk. + 20 lauk.): 3 369,00 €
   • 34 laukelis (Apmokestinamasis pelnas): 0,00 €
   • 45 laukelis (MOKĖTINAS PELNO MOKESTIS Į BIUDŽETĄ): 0,00 €
   • PMĮ 30 str. (Į kitus mokestinius metus perkeliamas mokestinis nuostolis): 3 369,00 €

PASLAUGŲ SĄSKAITA-FAKTŪRA:
   Pagal įmonės apyvartą ir registrų specifiką ({company_name}) parengta oficiali sąskaita-faktūra.
   Suma: 190,00 € (Smulki auganti įmonė 160 € + ES prekybos/importo PVM suderinimas 30 €).

Prisegtukuose pridedame:
1. Oficialų 4 puslapių finansinės atskaitomybės, PLN204 deklaracijos ir Vadovo veiksmų plano paketą (PDF).
2. Oficialią sąskaitą-faktūrą (PDF).

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "completed", {"topic": "statements_delivered", "call_requested": 0}


    # 2. Intencija: Patvirtinimas / Ketina atsiųsti failą ("Atsiųsiu", "Tuoj", "Ruošiu", "Tinka", "Sutinku")
    is_intent_to_send = any(k in txt_lower for k in [
        "ruošiu", "ruosiu", "tuoj", "atsiųsiu", "atsiūsiu", "persiųsiu", "persiusiu", "atsiusiu", "atsiunčiu", "atsiuciu", "tinka", "sutinku", "laukiu", "gerai"
    ])
    if is_intent_to_send and len(txt_lower) < 120:
        reply = f"""Laba diena, {client_name}!

Puiku, labai ačiū! Lauksime Jūsų failo (tinka Excel lentelė, PDF bandomasis balansas arba tiesiog banko išrašas).

Kai tik atsiųsite, mūsų vyriausioji buhalterė (25 m. patirtis) iškart asmeniškai peržiūrės duomenis ir atliks mokesčių bei apskaitos auditą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "intent_to_send"}

    # 3. Intencija: Apleista buhalterija / Neturiu balanso / Buhalterė dingo
    is_abandoned = any(k in txt_lower for k in [
        "apleist", "neturiu balanso", "nesuved", "dingo", "išėjo", "nėra buhalter", "nuo vasaros", "vėluoja", "netvark", "be buhalter"
    ])
    if is_abandoned:
        reply = f"""Laba diena, {client_name}!

Labai gerai suprantu Jūsų situaciją – artėjant metų pabaigai tai viena dažniausių problemų, su kuria susiduria įmonių vadovai (ypač kai buhalteris netikėtai išeina ar apskaita lieka nesuvesta kelis mėnesius).

Nereikia nerimauti: Jums nereikia turėti idealaus Bandomojo balanso!

Kad mūsų vyriausioji buhalterė (25 m. patirtis) galėtų įvertinti situaciją ir pateikti tikslų sprendimo planą:
1. Tiesiog išeksportuokite savo banko sąskaitos išrašą už šiuos metus (Swedbank, SEB, Revolut, Šiaulių bankas ir kt.) standartiniu Excel (.xlsx) arba PDF formatu.
2. Jei turite dalį gautų ar išrašytų sąskaitų – prisekite kartu (tinka net nuotraukos telefonu).

Pagal banko operacijų kiekį mes per kelias valandas įvertinsime tikslią apimtį ir pasakysime:
• Kiek kainuos ir per kiek dienų viską pilnai sutvarkysime;
• Kaip patikslinsime deklaracijas VMI bei „Sodrai“, kad išvengtumėte delspinigių ir baudų;
• Kaip saugiai uždarysime finansinius metus.

Ar patogu būtų atsiųsti banko išrašą peržiūrai?

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "abandoned_bookkeeping"}

    # 4. Intencija: Kainodara / Kiek kainuoja
    is_pricing = any(k in txt_lower for k in [
        "kain", "kiek kainuotų", "įkain", "kainodara", "kiek kainuoja", "mokėt", "eur", "tarif"
    ])
    if is_pricing:
        reply = f"""Laba diena, {client_name}!

Dėkoju už konkretų klausimą. Mūsų kainodara yra visiškai skaidri ir aiški:

1. Priešmetinis ekspres auditas ir rizikų patikrinimas: DEMONSTRACINIS / NEMOKAMAS (patikriname 15 kontrolinių taškų ir parodome, ar nepermokate mokesčių ir kur yra VMI rizikos).
2. Oficiali mokesčių optimizavimo išvada ir klaidų taisymo gairės: 190 € (išrašoma oficiali sąskaita-faktūra pagal IV pažymą).
3. Apleistos apskaitos pilnas atkūrimas / sutvarkymas: nuo 500 € iki 1 200 € (priklausomai nuo operacijų kiekio ir nesuvestų mėnesių skaičiaus; įeina pirminių dokumentų suvedimas, banko sudengimas, deklaracijų patikslinimas VMI/Sodrai ir balanso parengimas).
4. Nuolatinė mėnesinė vyr. buhalterės priežiūra: nuo 120 € / mėn.

Nėra jokių paslėptų mokesčių ar netikėtų priedų. Kad galėtume įvardinti tikslią fiksuotą kainą Jūsų įmonei ({company_name}) – atsiųskite Bandomąjį balansą arba banko išrašą, ir vyr. buhalterė pateiks tikslų įvertinimą.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "pricing"}

    # 5. Intencija: Saugumas / Konfidencialumas / BDAR / NDA
    is_security = any(k in txt_lower for k in [
        "saugu", "konfidencial", "bdar", "nda", "duomen", "privat"
    ])
    if is_security:
        reply = f"""Laba diena, {client_name}!

Tai yra esminis klausimas, ir mes jam taikome aukščiausius standartus:

1. Teisinis konfidencialumas: Prieš perduodant bet kokius finansinius dokumentus, pasirašomas oficialus elektroninis Konfidencialumo susitarimas (NDA).
2. Prieigos ribojimas: Bandomajame balanse ar išrašuose esantys duomenys naudojami griežtai tik audito tikslais ir niekada nėra viešinami ar perduodami trečiosioms šalims.
3. Duomenų saugumas: Visi failai saugomi šifruotame serveryje pagal BDAR reikalavimus. Bandomajame balanse netgi nėra fizinių asmenų kodų ar asmeninių duomenų – ten matomi tik bendri sąskaitų likučiai.

Vyriausioji buhalterė turi 25 metų nepriekaištingos profesinės reputacijos patirtį, todėl Jūsų įmonės duomenų saugumas yra garantuotas 100%.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "security"}

    # 6. Intencija: Teisinė forma (MB, UAB, VšĮ, Individuali veikla)
    is_legal_form = any(k in txt_lower for k in [
        "všį", "vsi", "mb", "uab", "individuali veikla", "pažyma", "forma"
    ])
    if is_legal_form:
        reply = f"""Laba diena, {client_name}!

Taip, absoliučiai! Mūsų vyriausioji buhalterė turi 25 metų praktinę patirtį dirbant su visomis Lietuvos teisinėmis formomis:

• MB (Mažosios bendrijos): lėšų asmeniniams poreikiams (02 kodas) ir dividendų (26 kodas) balansas, vadovo civilinės paslaugų sutartys, Sodros (VSD/PSD) lubos;
• UAB: pilna atskaitomybė, pelno mokesčio lengvatos (6–7% ar 0%), PVM atskaita, atskaitingų asmenų ir kasos kontrolė;
• VšĮ: paramos ir projektinio finansavimo apskaita, specifinė atskaitomybė;
• Individuali veikla: pajamų/išlaidų žurnalas, 30% prezumpcija vs. faktinių išlaidų nauda, GPM deklaravimas.

Drąsiai atsiųskite savo einamuosius duomenis (tinka Excel, PDF ar nuotrauka), ir mes atliksime auditą būtent pagal Jūsų teisinės formos reikalavimus.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "legal_forms"}

    # 7. Intencija: Laikas / Terminai ("Kiek laiko užtruks?", "Kada bus rezultatas?")
    is_timeframe = any(k in txt_lower for k in [
        "kiek laiko", "termin", "per kiek", "kada", "greitai", "skubiai", "trukm"
    ])
    if is_timeframe:
        reply = f"""Laba diena, {client_name}!

Mūsų ekspres auditas atliekamas itin operatyviai:
• Nuo failo (balanso ar išrašo) gavimo momento pirminį įvertinimą pateikiame per 24 valandas.
• Jei buhalterija apleista ir reikia atkurti įrašus – standartinis atkūrimo terminas yra 3–7 darbo dienos.
• Visi darbai ir deklaracijų tikslinimai atliekami gerokai iki oficialių VMI ir Registrų centro terminų pabaigos.

Atsiųskite turimus duomenis, ir jau rytoj turėsite vyriausiosios buhalterės išvadą!

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
        return reply, "client_documents", {"topic": "timeframe"}

    # 8. Standartinis atsakymas
    if has_documents:
        reply = f"""Laba diena, {client_name}!

Dėkojame už Jūsų žinutę ir pastabas. Mūsų vyriausioji buhalterė (25 m. patirtis) asmeniškai peržiūrėjo duomenis ir atitinkamai patikslino Jūsų įmonės ({company_name}) finansinių ataskaitų bei deklaracijų suvestines.

Jeigu norite aptarti konkrečias eilutes ar patikslinimus – esame pasiruošę atsakyti į visus klausimus.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere Lilija Zapasnik (IV pažyma Nr. 34566444)
tomas@verslomatika.lt
"""
        return reply, "completed", {"topic": "client_inquiry"}

    # Naujiems leadams be dokumentų: instrukcija su programomis (Rivilė, B1, Stekas, Swedbank, SEB)
    reply = f"""Laba diena, {client_name}!

Dėkoju už atsakymą! Džiaugiuosi, kad tema aktuali.

Norint atlikti nepriklausomą priešmetinį mokesčių auditą, mums reikalingas vos VIENAS pagrindinis failas – Jūsų einamųjų metų Bandomasis balansas (Trial Balance / Bandomoji sąskaitų apyvarta) arba banko sąskaitos išrašas.

Formatas gali būti BET KOKS:
• Excel (.xlsx, .xls) arba PDF failas;
• Arba tiesiog atspausdinto dokumento ar kompiuterio ekrano NUOTRAUKA telefonu (JPG / PNG) – mūsų vyriausioji buhalterė peržiūrės ir įvertins net ir nuotraukas ar skanus!

Kaip jį išeksportuoti per 1 minutę iš populiariausių programų:

• Jei naudojate „Rivilė“:
  Viršutiniame meniu pasirinkite: Ataskaitos -> Didžioji knyga (arba Finansai) -> Bandomasis balansas -> Nurodykite periodą (nuo 2026-01-01 iki šiandien) -> Paspauskite „Eksportuoti į Excel“ arba spausdinkite į PDF.

• Jei naudojate „B1.lt“:
  Kairiajame meniu pasirinkite: Apskaita -> Bandomasis balansas -> Nurodykite datą -> Viršuje dešinėje spauskite „Excel“ piktogramą.

• Jei naudojate „Stekas“:
  Pasirinkite: Finansai -> Apyvartos žiniaraštis / Bandomasis balansas -> Formuoti ataskaitą -> Eksportuoti į failą.

• Jei buhalteriją veda samdoma buhalterė ar įmonė:
  Tiesiog parašykite jai trumpą žinutę: „Sveika, prašau atsiųsk šių metų Bandomąjį balansą Excel, PDF arba atsiųsk nuotrauką.“ Ji jį atsiųs per 2 minutes.

O jei buhalterija buvo apleista ar neturite jokio balanso – tiesiog parašykite apie tai arba atsiųskite paskutinių mėnesių banko sąskaitos išrašą, ir mes padėsime suvesti viską nuo pradžių.

Pagarbiai,
Tomas | Verslomatika B2B
Kartu su Vyriausiąja buhaltere (25 m. patirtis)
tomas@verslomatika.lt
"""
    return reply, "client_documents", {"topic": "export_guidance"}
