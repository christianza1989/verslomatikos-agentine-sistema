import os
import sys
import json
import sqlite3
import unicodedata
import re
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DENTAL_CLINICS_CATALOG = [
    {
        "business_name": "Grožio Chirurgija & Odontologija",
        "city": "Kaunas",
        "email": "info@groziochirurgija.lt",
        "website": "https://groziochirurgija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "estetinės odontologijos ir chirurgijos pacientų atsiliepimai",
        "hook": "kaip apsaugoti 5.0★ Google reitingą po sudėtingų procedūrų"
    },
    {
        "business_name": "Vilniaus Odontologijos Centras",
        "city": "Vilnius",
        "email": "info@voc.lt",
        "website": "https://voc.lt",
        "role": "Klinikos administracijai",
        "pain_point": "didelis kasdienis pacientų srautas ir registratūros apkrova",
        "hook": "nulinis darbuotojų laiko eikvojimas – pacientas per 3 sekundes atveria anketą telefonu"
    },
    {
        "business_name": "Kauno Ortodontijos Centras",
        "city": "Kaunas",
        "email": "info@ortodontas.lt",
        "website": "https://ortodontas.lt",
        "role": "Klinikos vadovui",
        "pain_point": "breketų ir dantų tiesinimo kapomis pacientų ilgalaikis pasitenkinimas",
        "hook": "kaip patenkintus pacientus paversti viešais 5★ ambasadoriais Google Maps"
    },
    {
        "business_name": "Dentina Klaipėda",
        "city": "Klaipėda",
        "email": "info@dentina.lt",
        "website": "https://dentina.lt",
        "role": "Klinikos vadovui",
        "pain_point": "pajūrio regiono pacientų pritraukimas per Google Maps paiešką",
        "hook": "kaip išlaikyti aukščiausią reitingą Klaipėdoje ir pritraukti privačius pacientus"
    },
    {
        "business_name": "Šiaulių Implantologijos Klinika",
        "city": "Šiauliai",
        "email": "info@implantai.lt",
        "website": "https://implantai.lt",
        "role": "Klinikos vadovui",
        "pain_point": "implantacijos pacientų jautrumas po operacijų",
        "hook": "privati atsiliepimų forma vadovui vietoje 1★ skundo Google tinkle"
    },
    {
        "business_name": "Panevėžio Odontologijos Centras",
        "city": "Panevėžys",
        "email": "info@dantyspanevezys.lt",
        "website": "https://dantyspanevezys.lt",
        "role": "Klinikos administracijai",
        "pain_point": "regioninė konkurencija ir pacientų lojalumas",
        "hook": "estetiškas akrilinis QR stovelis registratūrai, garantuojantis 5★ srautą"
    },
    {
        "business_name": "Papadent Odontologijos Klinika",
        "city": "Vilnius",
        "email": "info@papadent.lt",
        "website": "https://papadent.lt",
        "role": "Gydytojui odontologui / Vadovui",
        "pain_point": "dantų implantavimo „visi ant 4“ pacientų lūkesčiai",
        "hook": "išankstinė reputacijos apsauga po didelės vertės chirurginių operacijų"
    },
    {
        "business_name": "CLINIC | DPC Odontologijos Klinika",
        "city": "Kaunas",
        "email": "info@clinicdpc.lt",
        "website": "https://clinicdpc.lt",
        "role": "Klinikų tinklo vadovybei",
        "pain_point": "pacientų atsiliepimų standartizavimas visuose padaliniuose",
        "hook": "vieninga QR atsiliepimų filtravimo sistema visiems filialams"
    },
    {
        "business_name": "Fi Clinica Dental",
        "city": "Kaunas",
        "email": "info@ficlinica.lt",
        "website": "https://ficlinica.lt",
        "role": "Odontologijos skyriaus vadovei",
        "pain_point": "užsienio medicinos turistų ir vietinių pacientų atsiliepimai",
        "hook": "kaip pritraukti tarptautinius pacientus su nepriekaištingu 5.0★ Google reitingu"
    },
    {
        "business_name": "Albodent Odontologijos Klinika",
        "city": "Vilnius",
        "email": "info@albodent.lt",
        "website": "https://albodent.lt",
        "role": "Klinikos vadovei",
        "pain_point": "šeimos dantų gydymo ir profilaktikos pacientų srautas",
        "hook": "kaip higienos ir profilaktikos pacientus paskatinti palikti 5★ Google Maps"
    },
    {
        "business_name": "Dantų Gydytojas Klinika",
        "city": "Kaunas",
        "email": "info@dantugydytojas.lt",
        "website": "https://dantugydytojas.lt",
        "role": "Klinikos administracijai",
        "pain_point": "pacientų atsiliepimai po terapinio ir endodontinio gydymo",
        "hook": "momentinis nepasitenkinimo išsprendimas privačiai prieš išeinant iš klinikos"
    },
    {
        "business_name": "Lazerinės Odontologijos Centras",
        "city": "Vilnius",
        "email": "info@loc.lt",
        "website": "https://loc.lt",
        "role": "Klinikos vadovui",
        "pain_point": "naujausių lazerinių technologijų pacientų aukšti lūkesčiai",
        "hook": "aukštos technologijos įvaizdžio stiprinimas per modernų QR stovelį registratūroje"
    },
    {
        "business_name": "ProDentum Estetinė Odontologija",
        "city": "Vilnius",
        "email": "info@prodentum.lt",
        "website": "https://prodentum.lt",
        "role": "Klinikos vadovui ir profesoriams",
        "pain_point": "profesionali reputacija ir mokslinio lygio paslaugų vertinimas",
        "hook": "reputacijos skydas, apsaugantis aukščiausio lygio ekspertų vardą Google Maps"
    },
    {
        "business_name": "Klaipėdos Odontologijos Centras",
        "city": "Klaipėda",
        "email": "info@koc.lt",
        "website": "https://koc.lt",
        "role": "Klinikos vadovybei",
        "pain_point": "pajūrio pacientų rekomendacijos ir Google paieškos lyderystė",
        "hook": "kaip užsitikrinti #1 poziciją Klaipėdos dantų gydymo paieškose"
    },
    {
        "business_name": "Simetria Dentica Klinika",
        "city": "Vilnius",
        "email": "info@simetriadentica.lt",
        "website": "https://simetriadentica.lt",
        "role": "Klinikos vadovei",
        "pain_point": "estetinės šypsenos korekcijos ir laminatų pacientai",
        "hook": "estetiškas akrilinis stovelis prie registratūros be jokių popierinių anketų"
    },
    {
        "business_name": "Vilniaus Dantų Gydymo Centras",
        "city": "Vilnius",
        "email": "info@vdgc.lt",
        "website": "https://vdgc.lt",
        "role": "Klinikos vadovui",
        "pain_point": "didelis pacientų srautas ir įvairių sričių specialistų komanda",
        "hook": "reputacijos filtras, leidžiantis vadovui matyti realų pacientų pasitenkinimą"
    },
    {
        "business_name": "Garliavos Odontologijos Centras",
        "city": "Kauno r.",
        "email": "info@goc.lt",
        "website": "https://goc.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Kauno rajono pacientų lojalumas ir rekomendacijos šeimoms",
        "hook": "kaip pritraukti naujas šeimas iš viso Kauno regiono per 5★ įvertinimus"
    },
    {
        "business_name": "Odontika Odontologijos Klinika",
        "city": "Vilnius",
        "email": "info@odontika.lt",
        "website": "https://odontika.lt",
        "role": "Klinikos vadovui",
        "pain_point": "anglų ir lietuvių kalbomis besigydančių pacientų atsiliepimai",
        "hook": "dvikalbis atsiliepimų nukreipimas tiesiai į Google profilį"
    },
    {
        "business_name": "Bio Dental Klinika",
        "city": "Vilnius",
        "email": "info@biodental.lt",
        "website": "https://biodental.lt",
        "role": "Klinikos vadovei",
        "pain_point": "biologinės ir tausojančios odontologijos pacientų vertinimai",
        "hook": "aukšto pasitikėjimo kūrimas ir 5.0★ žvaigždučių išlaikymas"
    },
    {
        "business_name": "Šypsenos Akademija",
        "city": "Kaunas",
        "email": "info@sypsenosakademija.lt",
        "website": "https://sypsenosakademija.lt",
        "role": "Klinikos administracijai",
        "pain_point": "aktyviai augantis filialų tinklas ir kokybės kontrolė",
        "hook": "automatizuota atsiliepimų surinkimo sistema registratūrose"
    },
    {
        "business_name": "Aura Dentis Odontologijos Klinika",
        "city": "Šiauliai",
        "email": "info@auradentis.lt",
        "website": "https://auradentis.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Šiaulių krašto pacientų lojalumas",
        "hook": "kaip tapti geriausiai vertinama odontologijos klinika Šiauliuose"
    },
    {
        "business_name": "Denta Odontologijos Klinika",
        "city": "Panevėžys",
        "email": "info@denta.lt",
        "website": "https://denta.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Panevėžio pacientų atsiliepimai po protezavimo ir dantų gydymo",
        "hook": "privati forma vadovei – jokių netikėtų viešų skundų internete"
    },
    {
        "business_name": "Alytaus Odontologijos Centras",
        "city": "Alytus",
        "email": "info@aoc.lt",
        "website": "https://aoc.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Dzūkijos regiono pacientų pritraukimas",
        "hook": "aukščiausias Google reitingas Alytuje ir pacientų srauto augimas"
    },
    {
        "business_name": "Marijampolės Odontologijos Klinika",
        "city": "Marijampolė",
        "email": "info@mok.lt",
        "website": "https://mok.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Sūduvos regiono pacientų pasitikėjimas",
        "hook": "nemokamas testinis akrilinis QR stovelis registratūros stalui"
    },
    {
        "business_name": "Vingio Odontologijos Klinika",
        "city": "Vilnius",
        "email": "info@vingioklinika.lt",
        "website": "https://vingioklinika.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Vilniaus Naujamiesčio ir centro pacientų lojalumas",
        "hook": "kaip užsitikrinti, kad 5★ atsiliepimai atsirastų Google tinkle kasdien"
    },
    {
        "business_name": "City Dental Kaunas",
        "city": "Kaunas",
        "email": "info@citydental.lt",
        "website": "https://citydental.lt",
        "role": "Klinikos vadovei",
        "pain_point": "jaunų ir reiklių miesto pacientų atsiliepimai",
        "hook": "3 sekundžių QR sprendimas, tobulai tinkantis išmaniesiems telefonams"
    },
    {
        "business_name": "Dantų Alėja Klinika",
        "city": "Kaunas",
        "email": "info@dantualeja.lt",
        "website": "https://dantualeja.lt",
        "role": "Klinikos administracijai",
        "pain_point": "Kauno Laisvės alėjos pacientų srautas",
        "hook": "kaip patenkinto paciento šypseną akimirksniu paversti Google rekomendacija"
    },
    {
        "business_name": "Nordclinic Dental",
        "city": "Kaunas",
        "email": "info@nordclinic.lt",
        "website": "https://nordclinic.lt",
        "role": "Klinikos vadovybei",
        "pain_point": "aukščiausios klasės paslaugų standartas ir tarptautiniai pacientai",
        "hook": "reputacijos apsaugos skydas premium segmento klinikoms"
    },
    {
        "business_name": "Grožio ir Sveikatos Klinika",
        "city": "Vilnius",
        "email": "info@gsklinika.lt",
        "website": "https://gsklinika.lt",
        "role": "Klinikos vadovei",
        "pain_point": "kompleksinės šypsenos ir veido estetikos procedūros",
        "hook": "konfidencialus grįžtamasis ryšys vadovei be viešų negatyvių įrašų"
    },
    {
        "business_name": "Sveika Šypsena Klaipėda",
        "city": "Klaipėda",
        "email": "info@sveikasypsena.lt",
        "website": "https://sveikasypsena.lt",
        "role": "Klinikos administracijai",
        "pain_point": "vaikų ir suaugusiųjų profilaktikos pacientai",
        "hook": "lengvas atsiliepimų surinkimas tiesiai registratūroje"
    },
    {
        "business_name": "Baltic Dental Centras",
        "city": "Vilnius",
        "email": "info@balticdental.lt",
        "website": "https://balticdental.lt",
        "role": "Klinikos vadovui",
        "pain_point": "konkurencija sostinėje dėl Google Maps viršūnių",
        "hook": "stabili 5.0★ žvaigždučių reputacija ir nuolatinis naujų pacientų srautas"
    },
    {
        "business_name": "Vilniaus Implantologijos Klinika (VIK)",
        "city": "Vilnius",
        "email": "registratura@vik.lt",
        "website": "https://vik.lt",
        "role": "Klinikos administracijai",
        "pain_point": "pacientų pasitikėjimas po implantacijos",
        "hook": "išankstinė apsauga nuo neigiamų atsiliepimų internete"
    },
    {
        "business_name": "Antakalnio Odontologijos Centras",
        "city": "Vilnius",
        "email": "info@antakalniodontologija.lt",
        "website": "https://antakalniodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Antakalnio ir Žirmūnų pacientų lojalumas",
        "hook": "estetiškas akrilinis QR stovelis registratūros stalui"
    },
    {
        "business_name": "Naujamiesčio Odontologijos Klinika",
        "city": "Vilnius",
        "email": "info@naujamiescioklinika.lt",
        "website": "https://naujamiescioklinika.lt",
        "role": "Klinikos vadovui",
        "pain_point": "modernių miesto gyventojų atsiliepimai",
        "hook": "greitas 3 sekundžių QR įvertinimas išmaniuoju telefonu"
    },
    {
        "business_name": "Pilaitės Odontologijos Centras",
        "city": "Vilnius",
        "email": "info@pilaitesodontologija.lt",
        "website": "https://pilaitesodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "jaunų šeimų pasitikėjimas ir rekomendacijos",
        "hook": "kaip patenkintus pacientus paversti 5★ Google rekomendacijomis"
    },
    {
        "business_name": "Baltupių Odontologijos Klinika",
        "city": "Vilnius",
        "email": "info@baltupiuklinika.lt",
        "website": "https://baltupiuklinika.lt",
        "role": "Klinikos administracijai",
        "pain_point": "pacientų grįžtamasis ryšys po procedūrų",
        "hook": "privati forma vadovei vietoj viešo skundo"
    },
    {
        "business_name": "Ozo Odontologijos Centras",
        "city": "Vilnius",
        "email": "info@ozoodontologija.lt",
        "website": "https://ozoodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Ozo parko ir Šiaurės miestelio pacientų srautas",
        "hook": "Google reitingo apsauga ir paslaugų krepšelio augimas"
    },
    {
        "business_name": "Savanorių Odontologijos Klinika",
        "city": "Kaunas",
        "email": "info@savanoriuklinika.lt",
        "website": "https://savanoriuklinika.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Kauno centro ir Savanorių pr. pacientų konkurencija",
        "hook": "aukščiausias Google Maps reitingas Kaune"
    },
    {
        "business_name": "Šilainių Odontologijos Centras",
        "city": "Kaunas",
        "email": "info@silainiuodontologija.lt",
        "website": "https://silainiuodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "didžiausio Kauno mikrorajono pacientų atsiliepimai",
        "hook": "nuolatinis 5★ žvaigždučių srautas be registratorių vargo"
    },
    {
        "business_name": "Dainavos Odontologijos Klinika",
        "city": "Kaunas",
        "email": "info@dainavosodontologija.lt",
        "website": "https://dainavosodontologija.lt",
        "role": "Klinikos administracijai",
        "pain_point": "šeimos pacientų rekomendacijos",
        "hook": "reputacijos filtras, sulaikantis nepasitenkinimą privačiai"
    },
    {
        "business_name": "Pajūrio Odontologijos Klinika",
        "city": "Klaipėda",
        "email": "info@pajurioklinika.lt",
        "website": "https://pajurioklinika.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Klaipėdos pacientų pritraukimas per interneto paiešką",
        "hook": "kaip išlaikyti nepriekaištingą įvertinimą Google paieškoje"
    },
    {
        "business_name": "Danės Odontologijos Centras",
        "city": "Klaipėda",
        "email": "info@danesodontologija.lt",
        "website": "https://danesodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "senamiesčio ir Danės krantinės pacientų lojalumas",
        "hook": "estetiškas akrilinis stovelis prie kasos"
    },
    {
        "business_name": "Vakarų Odontologijos Centras",
        "city": "Klaipėda",
        "email": "info@vakaruodontologija.lt",
        "website": "https://vakaruodontologija.lt",
        "role": "Klinikos administracijai",
        "pain_point": "didelių apimčių protezavimo pacientų lūkesčiai",
        "hook": "privati forma vadovei – ramus miegas ir apsaugota reputacija"
    },
    {
        "business_name": "Saulės Odontologijos Centras",
        "city": "Šiauliai",
        "email": "info@saulesodontologija.lt",
        "website": "https://saulesodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Šiaulių miesto lyderystė atsiliepimuose",
        "hook": "kaip užtikrintai pirmauti Google Maps paieškoje Šiauliuose"
    },
    {
        "business_name": "Prisikėlimo Odontologijos Klinika",
        "city": "Šiauliai",
        "email": "info@prisikelimoklinika.lt",
        "website": "https://prisikelimoklinika.lt",
        "role": "Klinikos vadovui",
        "pain_point": "chirurginio gydymo pacientų atsiliepimai",
        "hook": "momentinis nepasitenkinimo išsprendimas prieš išeinant pro duris"
    },
    {
        "business_name": "Nevėžio Odontologijos Klinika",
        "city": "Panevėžys",
        "email": "info@nevezioklinika.lt",
        "website": "https://nevezioklinika.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Aukštaitijos pacientų pasitikėjimas",
        "hook": "aukščiausias reitingas Panevėžio regione"
    },
    {
        "business_name": "Respublikos Odontologijos Centras",
        "city": "Panevėžys",
        "email": "info@respublikosodontologija.lt",
        "website": "https://respublikosodontologija.lt",
        "role": "Klinikos administracijai",
        "pain_point": "pacientų lojalumas ir Google rekomendacijos",
        "hook": "akrilinis QR stovelis, veikiantis per 3 sekundes"
    },
    {
        "business_name": "Dzūkijos Odontologijos Centras",
        "city": "Alytus",
        "email": "info@dzukijosodontologija.lt",
        "website": "https://dzukijosodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Alytaus regiono pacientų pritraukimas",
        "hook": "garantuotas 5.0★ Google reitingas Alytuje"
    },
    {
        "business_name": "Sūduvos Odontologijos Centras",
        "city": "Marijampolė",
        "email": "info@suduvosodontologija.lt",
        "website": "https://suduvosodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Marijampolės pacientų lojalumas",
        "hook": "nemokamas testinis QR stovelis klinikos registratūrai"
    },
    {
        "business_name": "Mažeikių Odontologijos Centras",
        "city": "Mažeikiai",
        "email": "info@mazeikiuodontologija.lt",
        "website": "https://mazeikiuodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Žemaitijos šiaurės pacientų pritraukimas",
        "hook": "kaip pritraukti privačius pacientus su 5★ Google reitingu"
    },
    {
        "business_name": "Utenos Odontologijos Klinika",
        "city": "Utena",
        "email": "info@utenosodontologija.lt",
        "website": "https://utenosodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Utenos regiono pacientų atsiliepimai",
        "hook": "privatus grįžtamasis ryšys vadovei be viešų skundų"
    },
    {
        "business_name": "Kėdainių Odontologijos Centras",
        "city": "Kėdainiai",
        "email": "info@kedainiuodontologija.lt",
        "website": "https://kedainiuodontologija.lt",
        "role": "Klinikos administracijai",
        "pain_point": "vidurio Lietuvos pacientų lojalumas",
        "hook": "estetiškas akrilinis stovelis prie registratūros"
    },
    {
        "business_name": "Telšių Odontologijos Klinika",
        "city": "Telšiai",
        "email": "info@telsiuodontologija.lt",
        "website": "https://telsiuodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Žemaitijos sostinės pacientų pasitikėjimas",
        "hook": "reputacijos apsaugos skydas premium paslaugoms"
    },
    {
        "business_name": "Tauragės Odontologijos Centras",
        "city": "Tauragė",
        "email": "info@tauragesodontologija.lt",
        "website": "https://tauragesodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Tauragės krašto pacientų atsiliepimai",
        "hook": "momentinis atsiliepimų surinkimas registratūroje"
    },
    {
        "business_name": "Ukmergės Odontologijos Centras",
        "city": "Ukmergė",
        "email": "info@ukmergesodontologija.lt",
        "website": "https://ukmergesodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Ukmergės pacientų pritraukimas",
        "hook": "kaip patenkintus pacientus paversti viešais ambasadoriais"
    },
    {
        "business_name": "Plungės Odontologijos Klinika",
        "city": "Plungė",
        "email": "info@plungesodontologija.lt",
        "website": "https://plungesodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Plungės ir Rietavo pacientų lojalumas",
        "hook": "aukščiausias Google Maps reitingas be didelių reklamos kaštų"
    },
    {
        "business_name": "Kretingos Odontologijos Centras",
        "city": "Kretinga",
        "email": "info@kretingosodontologija.lt",
        "website": "https://kretingosodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Pajūrio krašto pacientų pasitikėjimas",
        "hook": "apsauga nuo nepagrįstų skundų internete"
    },
    {
        "business_name": "Šilutės Odontologijos Klinika",
        "city": "Šilutė",
        "email": "info@silutesodontologija.lt",
        "website": "https://silutesodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "Pamario krašto pacientų atsiliepimai",
        "hook": "garantuotas 5★ srautas ir pacientų pasitenkinimas"
    },
    {
        "business_name": "Palangos Odontologijos Centras",
        "city": "Palanga",
        "email": "info@palangosodontologija.lt",
        "website": "https://palangosodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "kurorto svečių ir vietinių gyventojų atsiliepimai",
        "hook": "aukščiausias reitingas pajūrio paieškose"
    },
    {
        "business_name": "Druskininkų Odontologijos Klinika",
        "city": "Druskininkai",
        "email": "info@druskininkuodontologija.lt",
        "website": "https://druskininkuodontologija.lt",
        "role": "Klinikos vadovei",
        "pain_point": "kurorto poilsiautojų ir privačių pacientų lūkesčiai",
        "hook": "išskirtinis akrilinis QR stovelis registratūros interjerui"
    },
    {
        "business_name": "Jonavos Odontologijos Centras",
        "city": "Jonava",
        "email": "info@jonavosodontologija.lt",
        "website": "https://jonavosodontologija.lt",
        "role": "Klinikos vadovui",
        "pain_point": "Jonavos ir Kauno rajono pacientų srautas",
        "hook": "ramus vadovo darbas ir privati pacientų atsiliepimų kontrolė"
    },
    {
        "business_name": 'Baltijos Amerikos Klinika',
        "city": 'Vilnius',
        "email": 'info@bak.lt',
        "website": 'https://bak.lt',
        "role": 'Klinikos vadovybei',
        "pain_point": 'privačios ligoninės pacientų atsiliepimai Google',
        "hook": 'diskretiškas pastabų sulaikymas privačiai tiesiai vadovui'
    },
    {
        "business_name": 'Kardiolitos Klinikos',
        "city": 'Vilnius',
        "email": 'vilnius@kardiolita.lt',
        "website": 'https://kardiolita.lt',
        "role": 'Klientų patirties vadovui',
        "pain_point": 'didelis pacientų srautas ir registratūros apkrova',
        "hook": 'automatinis 5★ atsiliepimų rinkimas be registratūros vargo'
    },
    {
        "business_name": 'InMedica Klinika',
        "city": 'Vilnius',
        "email": 'info@inmedica.lt',
        "website": 'https://inmedica.lt',
        "role": 'Klinikų tinklo vadovui',
        "pain_point": 'šeimos medicinos ir odontologijos pacientų skundai',
        "hook": 'momentinis skundų filtravimas prieš Google Maps'
    },
    {
        "business_name": 'Affidea Lietuva',
        "city": 'Vilnius',
        "email": 'info@affidea.lt',
        "website": 'https://affidea.lt',
        "role": 'Administracijos vadovei',
        "pain_point": 'diagnostikos ir tyrimų laukimo laiko atsiliepimai',
        "hook": 'sulaikykite neigiamas emocijas registratūroje'
    },
    {
        "business_name": 'Šnipiškių Medicinos Centras',
        "city": 'Vilnius',
        "email": 'info@snipiskiumc.lt',
        "website": 'https://snipiskiumc.lt',
        "role": 'Vadovei',
        "pain_point": 'ambulatorinių paslaugų pacientų vertinimai',
        "hook": 'veikia per 3 sek. telefonu be programėlių diegimo'
    },
    {
        "business_name": 'Senamiesčio Stomatologijos Klinika',
        "city": 'Kaunas',
        "email": 'info@senamiesciostomatologija.lt',
        "website": 'https://senamiesciostomatologija.lt',
        "role": 'Gydytojui odontologui / Vadovui',
        "pain_point": 'estetinio plombavimo pacientų rekomendacijos',
        "hook": 'daugiau privačių pacientų iš Google paieškos'
    },
    {
        "business_name": 'Kauno Implantologijos Centras',
        "city": 'Kaunas',
        "email": 'info@kic.lt',
        "website": 'https://kic.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'dantų implantavimo garantinio laikotarpio pastabos',
        "hook": 'pastabos tiesiai vadovui, o 5★ viešai'
    },
    {
        "business_name": 'Klaipėdos Odontologijos Klinika',
        "city": 'Klaipėda',
        "email": 'info@klaipedosodontologija.lt',
        "website": 'https://klaipedosodontologija.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'uostamiesčio pacientų atsiliepimai ir reitingas',
        "hook": 'apsaugokite kliniką nuo 1★ skundų'
    },
    {
        "business_name": 'Amber Dental Klaipėda',
        "city": 'Klaipėda',
        "email": 'info@amberdental.lt',
        "website": 'https://amberdental.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'dantų protezavimo ir protezų taisymo pastabos',
        "hook": 'išspręskite paciento nerimą privačiai'
    },
    {
        "business_name": 'Šiaulių Odontologijos Centras',
        "city": 'Šiauliai',
        "email": 'info@siauliuodontologija.lt',
        "website": 'https://siauliuodontologija.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'regiono pacientų pasitikėjimas Google paieškoje',
        "hook": 'tapti Nr. 1 klinika Šiauliuose pagal reitingą'
    },
    {
        "business_name": 'Panevėžio Odontologijos Centras',
        "city": 'Panevėžys',
        "email": 'info@panevezioodontologija.lt',
        "website": 'https://panevezioodontologija.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'gydymo planų ir procedūrų vertinimas',
        "hook": 'momentinis Google Maps nukreipimas'
    },
    {
        "business_name": 'Nevėžio Odontologijos Klinika',
        "city": 'Panevėžys',
        "email": 'info@neveziodontologija.lt',
        "website": 'https://neveziodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'terapinio gydymo pacientų atsiliepimai',
        "hook": 'apsauga nuo atsitiktinių neigiamų įvertinimų'
    },
    {
        "business_name": 'Alytaus Odontologijos Centras',
        "city": 'Alytus',
        "email": 'info@alytausodontologija.lt',
        "website": 'https://alytausodontologija.lt',
        "role": 'Vadovui',
        "pain_point": 'Dzūkijos pacientų lojalumas ir reitingas',
        "hook": 'padidinkite naujų pacientų srautą +40%'
    },
    {
        "business_name": 'Eigulių Medicinos Centras',
        "city": 'Kaunas',
        "email": 'info@eiguliumc.lt',
        "website": 'https://eiguliumc.lt',
        "role": 'Direktoriui',
        "pain_point": 'šeimos gydytojų ir specialistų atsiliepimai',
        "hook": 'paciento kelias per 3 sekundes telefonu'
    },
    {
        "business_name": 'Fabijoniškių Sveikatos Centras',
        "city": 'Vilnius',
        "email": 'info@fabijoniskiusc.lt',
        "website": 'https://fabijoniskiusc.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'eilių ir laukimo laiko skundai Google profilyje',
        "hook": 'sulaikykite skundus registratūros lygmenyje'
    },
    {
        "business_name": 'Pašilaičių Šeimos Medicinos Centras',
        "city": 'Vilnius',
        "email": 'info@pasilaiciusc.lt',
        "website": 'https://pasilaiciusc.lt',
        "role": 'Administracijai',
        "pain_point": 'naujų rajono gyventojų pritraukimas',
        "hook": 'aukščiausias reitingas Pašilaičiuose'
    },
    {
        "business_name": 'Justiniškių Odontologijos Centras',
        "city": 'Vilnius',
        "email": 'info@justiniskiuodontologija.lt',
        "website": 'https://justiniskiuodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'pacientų pasitikėjimas po protezavimo darbų',
        "hook": 'garantija, kad joks skundas nepateks į viešumą'
    },
    {
        "business_name": 'Jeruzalės Odontologijos Klinika',
        "city": 'Vilnius',
        "email": 'info@jeruzalesodontologija.lt',
        "website": 'https://jeruzalesodontologija.lt',
        "role": 'Vadovui',
        "pain_point": 'chirurginio gydymo pacientų atsiliepimai',
        "hook": 'reitingo apsauga ir naujų pacientų augimas'
    },
    {
        "business_name": 'Santariškių Odontologijos Klinika',
        "city": 'Vilnius',
        "email": 'info@santariskiuodontologija.lt',
        "website": 'https://santariskiuodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'medicinos miestelio pacientų lūkesčiai',
        "hook": 'aukščiausios kokybės reputacijos valdymas'
    },
    {
        "business_name": 'Naujamiesčio Odontologijos Centras',
        "city": 'Vilnius',
        "email": 'info@naujamiescioodontologija.lt',
        "website": 'https://naujamiescioodontologija.lt',
        "role": 'Vadovui',
        "pain_point": 'verslo centrų darbuotojų atsiliepimai',
        "hook": 'estetiškas NFC stovelis registratūroje'
    },
    {
        "business_name": 'Užupio Odontologijos Klinika',
        "city": 'Vilnius',
        "email": 'info@uzupioodontologija.lt',
        "website": 'https://uzupioodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'senamiesčio pacientų reiklumas aptarnavimui',
        "hook": 'diskretiškas atsiliepimų surinkimas'
    },
    {
        "business_name": 'Žvėryno Odontologijos Klinika',
        "city": 'Vilnius',
        "email": 'info@zverynoodontologija.lt',
        "website": 'https://zverynoodontologija.lt',
        "role": 'Gydytojui / Vadovui',
        "pain_point": 'premium klasės pacientų aptarnavimas',
        "hook": 'reputacijos apsauga po sudėtingų procedūrų'
    },
    {
        "business_name": 'Vingio Odontologijos Centras',
        "city": 'Vilnius',
        "email": 'info@vingioodontologija.lt',
        "website": 'https://vingioodontologija.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'pacientų rekomendacijos pažįstamiems',
        "hook": 'paverskite pacientus 5★ Google ambasadoriais'
    },
    {
        "business_name": 'Kalniečių Odontologijos Klinika',
        "city": 'Kaunas',
        "email": 'info@kalnieciuodontologija.lt',
        "website": 'https://kalnieciuodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'dantų balinimo ir higienos pacientų atsiliepimai',
        "hook": 'automatinis 5★ reitingo auginimas'
    },
    {
        "business_name": 'Aleksoto Odontologijos Centras',
        "city": 'Kaunas',
        "email": 'info@aleksotoodontologija.lt',
        "website": 'https://aleksotoodontologija.lt',
        "role": 'Vadovui',
        "pain_point": 'pacientų pasirinkimas pagal Google atsiliepimus',
        "hook": 'išvenkite skundų dėl vėluojančių vizitų'
    },
    {
        "business_name": 'Centro Odontologijos Klinika Kaunas',
        "city": 'Kaunas',
        "email": 'info@centroodontologijakaunas.lt',
        "website": 'https://centroodontologijakaunas.lt',
        "role": 'Klinikos direktorei',
        "pain_point": 'miesto centro pacientų lūkesčiai',
        "hook": 'nepriekaištingas 5★ Google profilis'
    },
    {
        "business_name": 'Taikos Odontologijos Centras Klaipėda',
        "city": 'Klaipėda',
        "email": 'info@taikosodontologija.lt',
        "website": 'https://taikosodontologija.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'Klaipėdos pacientų atsiliepimai ir reitingas',
        "hook": 'sulaikykite pastabas registratūroje'
    },
    {
        "business_name": 'Baltijos Odontologijos Centras Klaipėda',
        "city": 'Klaipėda',
        "email": 'info@baltijosodontologija.lt',
        "website": 'https://baltijosodontologija.lt',
        "role": 'Vadovei',
        "pain_point": 'gydymo kainų ir vertės atitikties pastabos',
        "hook": 'asmeninis vadovo dėmesys išsaugo pacientą'
    },
    {
        "business_name": 'Smiltelės Odontologijos Klinika',
        "city": 'Klaipėda',
        "email": 'info@smiltelesodontologija.lt',
        "website": 'https://smiltelesodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'pietinės miesto dalies pacientų srautas',
        "hook": 'daugiau naujų pacientų iš Google paieškos'
    },
    {
        "business_name": 'Tilžės Odontologijos Centras',
        "city": 'Šiauliai',
        "email": 'info@tilzesodontologija.lt',
        "website": 'https://tilzesodontologija.lt',
        "role": 'Klinikos vadovui',
        "pain_point": 'terapinės odontologijos pacientų atsiliepimai',
        "hook": 'lengvas atsiliepimų rinkimas prie kasos'
    },
    {
        "business_name": 'Dvaro Odontologijos Klinika',
        "city": 'Šiauliai',
        "email": 'info@dvaroodontologija.lt',
        "website": 'https://dvaroodontologija.lt',
        "role": 'Gydytojai / Vadovei',
        "pain_point": 'estetinio plombavimo pacientų vertinimai',
        "hook": 'pakelkite klinikos reitingą iki 4.9★'
    },
    {
        "business_name": 'Smėlynės Odontologijos Klinika',
        "city": 'Panevėžys',
        "email": 'info@smelynesodontologija.lt',
        "website": 'https://smelynesodontologija.lt',
        "role": 'Klinikos vadovei',
        "pain_point": 'pacientų pastabos po procedūrų',
        "hook": 'skundai niekada nepatenka į internetą'
    },
    {
        "business_name": 'Marijampolės Šeimos Odontologija',
        "city": 'Marijampolė',
        "email": 'info@marijampolesseima.lt',
        "website": 'https://marijampolesseima.lt',
        "role": 'Vadovui',
        "pain_point": 'šeimos gydytojų ir dantų gydymo vertinimai',
        "hook": 'stiprus bendruomenės pasitikėjimas Google'
    },
    {
        "business_name": 'Mažeikių Šeimos Odontologija',
        "city": 'Mažeikiai',
        "email": 'info@mazeikiuseima.lt',
        "website": 'https://mazeikiuseima.lt',
        "role": 'Vadovei',
        "pain_point": 'dantų protezavimo ir higienos vertinimai',
        "hook": 'nemokamas akrilinis QR stovelis registratūrai'
    }
]

def slugify(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text[:60]

def get_already_contacted_emails() -> set:
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT LOWER(email) FROM campaign_leads WHERE sent_at IS NOT NULL")
        emails = {r[0] for r in c.fetchall()}
        conn.close()
        return emails
    except Exception as e:
        print(f"[Lead Pool DB Error] {e}")
        return set()

def get_uncontacted_dental_leads(limit: int = 25) -> List[Dict[str, Any]]:
    """Grąžina paruoštus, dar nekontaktuotus odontologijos klinikos kontaktus."""
    already_contacted = get_already_contacted_emails()
    fresh_leads = []
    
    for item in DENTAL_CLINICS_CATALOG:
        email = item["email"].strip().lower()
        if email not in already_contacted:
            b_name = item["business_name"]
            city = item.get("city", "Vilnius")
            slug = slugify(b_name)
            
            lead_obj = {
                "id": f"lead-{slug}",
                "business_name": b_name,
                "city": city,
                "email": email,
                "website": item.get("website", ""),
                "role": item.get("role", "Klinikos vadovui"),
                "pain_point": item.get("pain_point", "pacientų atsiliepimai"),
                "hook": item.get("hook", "kaip apsaugoti 5.0★ Google reitingą"),
                "niche": "odontologija",
                "industry": "clinic",
                "slug": slug,
                "preview_url": f"https://reputacija.verslomatika.lt/r/{slug}",
                "qr_url": f"https://reputacija.verslomatika.lt/api/qr?slug={slug}",
                "claim_url": f"https://reputacija.verslomatika.lt/checkout?slug={slug}"  # aktyvavimas per claim tokeną laiške (ROADMAP A3)
            }
            fresh_leads.append(lead_obj)
            if len(fresh_leads) >= limit:
                break
                
    return fresh_leads

def provision_lead_in_db(lead: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Sukuria arba atnaujina demonstracinį profilį `clients` lentelėje.

    SAUGUMAS (ROADMAP A5): jau aktyvuoto kliento (is_demo=0) niekada neliečia.
    Grąžina {"id", "google_review_url", "is_demo", ...} arba None, jei įvyko klaida.
    """
    try:
        from core.claim_tokens import ensure_schema
        from core.google_place_resolver import get_review_destination

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        ensure_schema(conn)
        cur = conn.cursor()
        slug = lead["slug"]
        b_name = lead["business_name"]
        email = lead["email"].strip().lower()
        city = lead.get("city", "Vilnius")
        industry = lead.get("industry") or ("clinic" if lead.get("niche") == "odontologija" else "general")
        trial_end = (datetime.now() + timedelta(days=14)).isoformat()

        cur.execute("SELECT * FROM clients WHERE slug=? OR email=?", (slug, email))
        existing = cur.fetchone()
        if existing and not existing["is_demo"]:
            conn.close()
            return dict(existing)  # tikras klientas: nieko nekeičiame

        # Tyrimo metu patikrinta nuoroda (data/leads/research/*.json) turi pirmenybę prieš skrapinimą.
        review_url = lead.get("google_review_url") or (existing["google_review_url"] if existing else None)
        from core.claim_tokens import is_direct_review_url
        if not review_url or not is_direct_review_url(review_url):
            # Google first; without a Google profile a Rekvizitai.lt page proven by phone/website (Etapas R).
            review_url, _platform, rk_info = get_review_destination(b_name, city, lead.get("phone"), lead.get("website"))
            if rk_info:  # laiškui: „Rekvizitai.lt turite 8,3/10 iš 19 įvertinimų“
                lead["rekvizitai_stats"] = {"rating": rk_info.get("rating"), "count": rk_info.get("ratings_count")}

        if not existing:
            cur.execute("""
                INSERT INTO clients (id, slug, business_name, email, google_review_url, phone, subscription_status, is_demo, trial_ends_at, industry)
                VALUES (?, ?, ?, ?, ?, '', 'demo_trial', 1, ?, ?)
            """, (f"pre-{slug}", slug, b_name, email, review_url, trial_end, industry))
        else:
            cur.execute("""
                UPDATE clients SET business_name=?, google_review_url=?, industry=? WHERE id=? AND is_demo=1
            """, (b_name, review_url, industry, existing["id"]))
        conn.commit()
        cur.execute("SELECT * FROM clients WHERE slug=? OR email=?", (slug, email))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"[Provision Lead DB Error] {e}")
        return None

if __name__ == "__main__":
    leads = get_uncontacted_dental_leads(25)
    print(f"Rasta paruoštų nekontaktuotų klinikų: {len(leads)}")
    for l in leads[:5]:
        print(f"- {l['business_name']} ({l['city']}): {l['email']} -> {l['preview_url']}")
