import os
import sys
import sqlite3
import unicodedata
import re
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")

ECOMMERCE_LEADS_CATALOG = [
    {
        "business_name": "Hiatus Apranga ir Avalynė",
        "city": "Vilnius",
        "email": "info@hiatus.lt",
        "website": "https://hiatus.lt",
        "role": "El. prekybos vadovui",
        "industry": "ecommerce",
        "pain_point": "pirkėjų atsiliepimai po siuntos pristatymo kurjeriu",
        "hook": "kaip po kiekvieno Omniva/DPD pristatymo surinkti 5★ Google atsiliepimą"
    },
    {
        "business_name": "Linen Tales",
        "city": "Vilnius",
        "email": "info@linentales.com",
        "website": "https://linentales.com",
        "role": "El. parduotuvės vadovei",
        "industry": "ecommerce",
        "pain_point": "tarptautinių ir vietinių pirkėjų Trustpilot ir Google reitingas",
        "hook": "privati forma pirkėjui vietoj 1★ skundo dėl siuntimo vėlavimo"
    },
    {
        "business_name": "Open24 Avalynė",
        "city": "Vilnius",
        "email": "klientams@open24.lt",
        "website": "https://open24.lt",
        "role": "Klientų patirties vadovui",
        "industry": "ecommerce",
        "pain_point": "batų dydžių keitimo ir grąžinimo skundai viešoje erdvėje",
        "hook": "sulaikykite nepatenkintą pirkėją privačiai prieš jam parašant viešą skundą"
    },
    {
        "business_name": "Knygos.lt",
        "city": "Vilnius",
        "email": "pagalba@knygos.lt",
        "website": "https://knygos.lt",
        "role": "El. komercijos vadovui",
        "industry": "ecommerce",
        "pain_point": "knygų pristatymo terminai ir pirkėjų lūkesčiai",
        "hook": "automatinis 5★ atsiliepimų rinkimas po kiekvieno sėkmingo pirkimo"
    },
    {
        "business_name": "Vynoteka Internetu",
        "city": "Vilnius",
        "email": "info@vynoteka.lt",
        "website": "https://vynoteka.lt",
        "role": "El. prekybos komandai",
        "industry": "ecommerce",
        "pain_point": "trapių prekių pristatymo kurjeriu patirtis",
        "hook": "momentinis nepatenkinto pirkėjo sugrąžinimas tiesiai vadovui"
    },
    {
        "business_name": "Audimas El. Parduotuvė",
        "city": "Kaunas",
        "email": "eshop@audimas.lt",
        "website": "https://audimas.lt",
        "role": "Internetinės prekybos vadovei",
        "industry": "ecommerce",
        "pain_point": "sportinės ir laisvalaikio aprangos pirkėjų atsiliepimai",
        "hook": "kaip patenkintus pirkėjus paversti 5★ Google ir Trustpilot ambasadoriais"
    },
    {
        "business_name": "Uoga Uoga Natūrali Kosmetika",
        "city": "Vilnius",
        "email": "info@uogauoga.lt",
        "website": "https://uogauoga.lt",
        "role": "E-komercijos vadovei",
        "industry": "ecommerce",
        "pain_point": "kosmetikos produktų vertinimai ir pirkėjų pasitikėjimas",
        "hook": "automatinis atsiliepimų srautas po siuntos gavimo be jokių stovelio ribojimų"
    },
    {
        "business_name": "Biok Laboratorija (E-Shop)",
        "city": "Vilnius",
        "email": "biok@biok.lt",
        "website": "https://bioklab.lt",
        "role": "Prekės ženklų vadovui",
        "industry": "ecommerce",
        "pain_point": "prekių vertinimai tiesioginėje el. parduotuvėje",
        "hook": "privati forma pirkėjui išspręsti klausimą prieš viešą komentarą"
    },
    {
        "business_name": "Topocentras Internetinė Parduotuvė",
        "city": "Kaunas",
        "email": "info@topocentras.lt",
        "website": "https://topocentras.lt",
        "role": "Klientų patirties vadovui",
        "industry": "ecommerce",
        "pain_point": "buitinės technikos garantinio aptarnavimo ir pristatymo skundai",
        "hook": "100% skundų sulaikymas vadovo skydelyje prieš jiems patenkant į Google"
    },
    {
        "business_name": "Senukai Internetu (1A)",
        "city": "Kaunas",
        "email": "info@keskosenukai.lt",
        "website": "https://senukai.lt",
        "role": "E-komercijos kokybės vadovui",
        "industry": "ecommerce",
        "pain_point": "didelis internetinių užsakymų srautas ir kurjerių vėlavimai",
        "hook": "išmanus po-pirkimo atsiliepimų paskirstymas"
    },
    {
        "business_name": "Baldai1.lt",
        "city": "Vilnius",
        "email": "info@baldai1.lt",
        "website": "https://baldai1.lt",
        "role": "Klientų aptarnavimo vadovui",
        "industry": "ecommerce",
        "pain_point": "baldų surinkimo ir pristatymo terminų jautrumas",
        "hook": "kaip užtikrinti 4.9★ reitingą po didelės vertės internetinių užsakymų"
    },
    {
        "business_name": "Varle.lt Internetinė Parduotuvė",
        "city": "Vilnius",
        "email": "info@varle.lt",
        "website": "https://varle.lt",
        "role": "Pardavimų vadovui",
        "industry": "ecommerce",
        "pain_point": "elektronikos prekių pirkėjų atsiliepimai",
        "hook": "automatinis 5★ pirkėjų nukreipimas į Google Maps profilį"
    },
    {
        "business_name": "Gera Dovana",
        "city": "Vilnius",
        "email": "info@geradovana.lt",
        "website": "https://geradovana.lt",
        "role": "E-komercijos vadovui",
        "industry": "ecommerce",
        "pain_point": "įspūdžio dovanų ir čekių panaudojimo atsiliepimai",
        "hook": "momentinė nuoroda el. paštu po dovanų čekio aktyvavimo"
    },
    {
        "business_name": "Dovanų Sala",
        "city": "Vilnius",
        "email": "info@dovanusala.lt",
        "website": "https://dovanusala.lt",
        "role": "Vadovui",
        "industry": "ecommerce",
        "pain_point": "pirkėjų emocijos ir pasitikėjimas perkant dovanas internetu",
        "hook": "kaip patenkintus pirkėjus paversti 5★ atsiliepimais"
    },
    {
        "business_name": "Kvepalų Sala (Fragrance)",
        "city": "Vilnius",
        "email": "info@kvepalusala.lt",
        "website": "https://kvepalusala.lt",
        "role": "El. parduotuvės vadovei",
        "industry": "ecommerce",
        "pain_point": "kvepalų autentiškumo ir siuntimo greičio vertinimai",
        "hook": "padidinkite pakartotinių pirkimų skaičių su nepriekaištingu 5.0★ reitingu"
    },
    {
        "business_name": "Sportland Lietuva E-Shop",
        "city": "Vilnius",
        "email": "info@sportland.lt",
        "website": "https://sportland.lt",
        "role": "E-komercijos vadovui",
        "industry": "ecommerce",
        "pain_point": "sporto prekių pristatymo greitis ir grąžinimai",
        "hook": "sulaikykite neigiamas pastabas privačiai prieš pirkėjui išeinant į Google"
    },
    {
        "business_name": "Mano Vaistinė Internetu",
        "city": "Vilnius",
        "email": "klientams@manovaistine.lt",
        "website": "https://manovaistine.lt",
        "role": "Internetinės vaistinės vadovei",
        "industry": "ecommerce",
        "pain_point": "sveikatos ir grožio prekių pristatymo diskretiškumas",
        "hook": "diskreti privati forma pirkėjui ir 5★ vieši atsiliepimai"
    },
    {
        "business_name": "Eurovaistinė Internetu",
        "city": "Vilnius",
        "email": "info@eurovaistine.lt",
        "website": "https://eurovaistine.lt",
        "role": "Klientų patirties skyriui",
        "industry": "ecommerce",
        "pain_point": "internetu užsakytų vaistų ir vitaminų atsiėmimo patirtis",
        "hook": "automatinis atsiliepimų surinkimas po siuntos pristatymo"
    },
    {
        "business_name": "Pigu.lt Prekybos Centras Internetu",
        "city": "Vilnius",
        "email": "pagalba@pigu.lt",
        "website": "https://pigu.lt",
        "role": "Partnerystės vadovui",
        "industry": "ecommerce",
        "pain_point": "tūkstančių kasdienių siuntų atsiliepimų valdymas",
        "hook": "išmanus skundų filtravimas prieš Google Maps ir Trustpilot"
    },
    {
        "business_name": "MemberShop Išpardavimai",
        "city": "Vilnius",
        "email": "pagalba@membershop.lt",
        "website": "https://membershop.lt",
        "role": "E-komercijos vadovui",
        "industry": "ecommerce",
        "pain_point": "premium prekių ženklų pristatymo laiko skundai",
        "hook": "išspręskite pirkėjų nusivylimą privačiai ir apsaugokite 5★ reitingą"
    },
    {
        "business_name": 'NewMood Mada',
        "city": 'Vilnius',
        "email": 'pagalba@newmood.lt',
        "website": 'https://newmood.lt',
        "role": 'El. komercijos vadovei',
        "industry": 'ecommerce',
        "pain_point": 'drabužių dydžių keitimo ir grąžinimo procesas',
        "hook": 'kaip po kurjerio pristatymo gauti 5★ vietoj pirkėjo skundo'
    },
    {
        "business_name": 'Danija Avalynė',
        "city": 'Vilnius',
        "email": 'info@danija.lt',
        "website": 'https://danija.lt',
        "role": 'Klientų patirties vadovui',
        "industry": 'ecommerce',
        "pain_point": 'avalynės kokybės ir pristatymo terminų atsiliepimai',
        "hook": 'išmanus pirkėjų srauto filtras po Omniva pristatymo'
    },
    {
        "business_name": 'Sizeer Lietuva',
        "city": 'Vilnius',
        "email": 'klientams@sizeer.lt',
        "website": 'https://sizeer.lt',
        "role": 'E-komercijos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'kedų ir gatvės mados pirkėjų lūkesčiai',
        "hook": 'automatinis 5★ reitingo auginimas po sėkmingo pirkinio'
    },
    {
        "business_name": 'Deichmann Lietuva',
        "city": 'Vilnius',
        "email": 'klientams@deichmann.com',
        "website": 'https://deichmann.com',
        "role": 'Klientų aptarnavimo vadovei',
        "industry": 'ecommerce',
        "pain_point": 'masinės prekybos avalynės atsiliepimai Google',
        "hook": 'sulaikykite neigiamas emocijas privačiai prieš viešą skundą'
    },
    {
        "business_name": 'Denim Dream Internetu',
        "city": 'Vilnius',
        "email": 'eparduotuve@denimdream.lt',
        "website": 'https://denimdream.com',
        "role": 'Prekybos internetu vadovei',
        "industry": 'ecommerce',
        "pain_point": 'premium prekės ženklų pirkėjų aptarnavimo standartai',
        "hook": 'privati vadovo anketa vietoj 1★ skundo Google Maps'
    },
    {
        "business_name": 'Sidonas Apranga',
        "city": 'Kaunas',
        "email": 'info@sidonas.lt',
        "website": 'https://sidonas.lt',
        "role": 'El. parduotuvės vadovui',
        "industry": 'ecommerce',
        "pain_point": 'lietuviškos mados pirkėjų atsiliepimai',
        "hook": 'padėkos nuoroda po Omniva/DPD pristatymo'
    },
    {
        "business_name": 'About You Lietuva',
        "city": 'Vilnius',
        "email": 'aptarnavimas@aboutyou.lt',
        "website": 'https://aboutyou.lt',
        "role": 'Lietuvos rinkos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'siuntų vėlavimai piko metu ir vieši skundai',
        "hook": 'momentinis 5★ nukreipimas patenkintiems pirkėjams'
    },
    {
        "business_name": 'Reserved Lietuva',
        "city": 'Vilnius',
        "email": 'support.lt@reserved.com',
        "website": 'https://reserved.com',
        "role": 'Klientų aptarnavimo vadovei',
        "industry": 'ecommerce',
        "pain_point": 'greitosios mados pristatymo terminai',
        "hook": 'aukščiausias Google ir Trustpilot reitingas el. parduotuvei'
    },
    {
        "business_name": 'Lindex Lietuva',
        "city": 'Vilnius',
        "email": 'klientuaptarnavimas@lindex.com',
        "website": 'https://lindex.com',
        "role": 'E-parduotuvės komandai',
        "industry": 'ecommerce',
        "pain_point": 'moteriškų ir vaikiškų prekių pirkėjų atsiliepimai',
        "hook": 'privatus ryšys su pirkėju prieš atsiliepimo publikavimą'
    },
    {
        "business_name": 'Ivo Nikkolo Lietuva',
        "city": 'Vilnius',
        "email": 'info@ivonikkolo.lt',
        "website": 'https://ivonikkolo.lt',
        "role": 'Prekės ženklo vadovei',
        "industry": 'ecommerce',
        "pain_point": 'premium drabužių pirkėjų pasitikėjimas internetu',
        "hook": '5★ reputacijos apsaugos sistema be fizinio stovelio'
    },
    {
        "business_name": 'RDE.LT Technika',
        "city": 'Vilnius',
        "email": 'info@rde.lt',
        "website": 'https://rde.lt',
        "role": 'El. prekybos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'buitinės technikos garantinis aptarnavimas ir kurjerių darbas',
        "hook": 'apsaugokite el. parduotuvę nuo 1★ skundų dėl kurjerių'
    },
    {
        "business_name": 'Bigbox.lt Elektronika',
        "city": 'Kaunas',
        "email": 'info@bigbox.lt',
        "website": 'https://bigbox.lt',
        "role": 'E-komercijos direktoriui',
        "industry": 'ecommerce',
        "pain_point": 'elektronikos prekių atsiliepimai ir konkurencija Google',
        "hook": 'pakelkite el. parduotuvės reitingą virš konkurentų'
    },
    {
        "business_name": '1a.lt Prekybos Centras',
        "city": 'Vilnius',
        "email": 'info@1a.lt',
        "website": 'https://1a.lt',
        "role": 'Klientų patirties vadovui',
        "industry": 'ecommerce',
        "pain_point": 'didelių siuntų srautų valdymas ir skundai',
        "hook": 'automatizuota po-pirkimo padėkos nuoroda'
    },
    {
        "business_name": 'Ermitažas Internetu',
        "city": 'Vilnius',
        "email": 'klientams@ermitazas.lt',
        "website": 'https://ermitazas.lt',
        "role": 'El. prekybos departamentui',
        "industry": 'ecommerce',
        "pain_point": 'statybinių ir buities prekių pristatymo pažeidimai',
        "hook": 'privati forma vadovui išspręsti pažeistą pakuotę'
    },
    {
        "business_name": 'Moki-Veži Internetu',
        "city": 'Vilnius',
        "email": 'info@mokivezi.lt',
        "website": 'https://mokivezi.lt',
        "role": 'E-komercijos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'sodo ir remonto prekių pirkėjų atsiliepimai',
        "hook": 'surinkite 5★ atsiliepimus po kiekvieno pristatymo'
    },
    {
        "business_name": 'Lemona Electronics',
        "city": 'Kaunas',
        "email": 'info@lemona.lt',
        "website": 'https://lemona.lt',
        "role": 'Prekybos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'komponentų ir elektronikos dalių suderinamumo pastabos',
        "hook": 'techninės pastabos tiesiai vadybininkui be viešo skundo'
    },
    {
        "business_name": 'Anodas Elektronika',
        "city": 'Šiauliai',
        "email": 'info@anodas.lt',
        "website": 'https://anodas.lt',
        "role": 'Vadovui',
        "industry": 'ecommerce',
        "pain_point": 'robotikos ir modulių pristatymo atsiliepimai',
        "hook": 'reputacijos augimas specializuotose paieškose'
    },
    {
        "business_name": 'Skytech Technika',
        "city": 'Vilnius',
        "email": 'info@skytech.lt',
        "website": 'https://skytech.lt',
        "role": 'El. parduotuvės vadovui',
        "industry": 'ecommerce',
        "pain_point": 'kompiuterių komponentų garantinio aptarnavimo skundai',
        "hook": 'patenkinti IT specialistai nukreipiami į Google Maps'
    },
    {
        "business_name": 'Kilobaitas IT',
        "city": 'Kaunas',
        "email": 'pagalba@kilobaitas.lt',
        "website": 'https://kilobaitas.lt',
        "role": 'Klientų aptarnavimo komandai',
        "industry": 'ecommerce',
        "pain_point": 'kompiuterių surinkimo ir logistikos atsiliepimai',
        "hook": 'išsaugokite lojalų pirkėją privačiu bendravimu'
    },
    {
        "business_name": 'Neriba.lt Buitinė Technika',
        "city": 'Vilnius',
        "email": 'info@neriba.lt',
        "website": 'https://neriba.lt',
        "role": 'Direktoriui',
        "industry": 'ecommerce',
        "pain_point": 'stambios buitinės technikos užnešimo ir pristatymo problemos',
        "hook": 'apsaugokite įmonės reitingą nuo kurjerių nesklandumų'
    },
    {
        "business_name": 'Drogas Lietuva',
        "city": 'Vilnius',
        "email": 'klientams@drogas.lt',
        "website": 'https://drogas.lt',
        "role": 'E-komercijos vadovei',
        "industry": 'ecommerce',
        "pain_point": 'kosmetikos ir higienos prekių pakuočių pažeidimai',
        "hook": 'privati forma pirkėjui vietoj viešo skundo internete'
    },
    {
        "business_name": 'Eurokos Internetu',
        "city": 'Kaunas',
        "email": 'eparduotuve@eurokos.lt',
        "website": 'https://eurokos.lt',
        "role": 'El. prekybos direktorei',
        "industry": 'ecommerce',
        "pain_point": 'grožio prekių pristatymo greitis ir atsiliepimai',
        "hook": 'automatinis 5★ srautas oficialiame Google profilyje'
    },
    {
        "business_name": 'Douglas Lietuva',
        "city": 'Vilnius',
        "email": 'klauskite@douglas.lt',
        "website": 'https://douglas.lt',
        "role": 'E-parduotuvės komandai',
        "industry": 'ecommerce',
        "pain_point": 'prabangių kvepalų ir kosmetikos pirkėjų lūkesčiai',
        "hook": 'aukščiausios klasės reputacijos filtras'
    },
    {
        "business_name": 'Kristiana Parfumerija',
        "city": 'Vilnius',
        "email": 'info@kristiana.lt',
        "website": 'https://kristiana.lt',
        "role": 'Klientų patirties vadovei',
        "industry": 'ecommerce',
        "pain_point": 'išskirtinių dovanų ir kvepalų pirkėjų atsiliepimai',
        "hook": 'diskretiškas atsiliepimų surinkimas po pirkimo'
    },
    {
        "business_name": 'Camelia Vaistinė Internetu',
        "city": 'Kaunas',
        "email": 'info@camelia.lt',
        "website": 'https://camelia.lt',
        "role": 'E-vaistinės vadovui',
        "industry": 'ecommerce',
        "pain_point": 'vaistų ir sveikatos prekių pristatymo jautrumas',
        "hook": '100% konfidencialus pastabų sprendimas be viešumo'
    },
    {
        "business_name": 'Gintarinė Vaistinė Internetu',
        "city": 'Kaunas',
        "email": 'vaistine@gintarine.lt',
        "website": 'https://gintarine.lt',
        "role": 'Skaitmeninės prekybos vadovei',
        "industry": 'ecommerce',
        "pain_point": 'sveikatos prekių atsiliepimai ir pirkėjų pasitikėjimas',
        "hook": 'patenkinti pirkėjai kuria nepriekaištingą reitingą'
    },
    {
        "business_name": 'Benu Vaistinė Internetu',
        "city": 'Vilnius',
        "email": 'klientams@benu.lt',
        "website": 'https://benu.lt',
        "role": 'E-komercijos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'vaistinės prekių pristatymo terminai',
        "hook": 'automatinis 5★ atsiliepimų srautas'
    },
    {
        "business_name": 'Apotheka Vaistinė',
        "city": 'Vilnius',
        "email": 'info@apotheka.lt',
        "website": 'https://apotheka.lt',
        "role": 'Vadovei',
        "industry": 'ecommerce',
        "pain_point": 'sveikatinimo prekių pirkėjų atsiliepimai',
        "hook": 'išmanus atsiliepimų surinkimas po Omniva siuntos'
    },
    {
        "business_name": 'Norfos Vaistinė',
        "city": 'Vilnius',
        "email": 'info@norfosvaistine.lt',
        "website": 'https://norfosvaistine.lt',
        "role": 'E-vaistinės komandai',
        "industry": 'ecommerce',
        "pain_point": 'greitas atsiliepimų valdymas po pirkimo',
        "hook": 'skundų prevencija ir reitingo augimas'
    },
    {
        "business_name": 'Bio Sala Ekologiškos Prekės',
        "city": 'Vilnius',
        "email": 'info@biosala.lt',
        "website": 'https://biosala.lt',
        "role": 'Direktorei',
        "industry": 'ecommerce',
        "pain_point": 'ekologiškų produktų galiojimo ir pakuočių skundai',
        "hook": 'išspręskite situaciją asmeniškai ir išsaugokite pirkėją'
    },
    {
        "business_name": 'Pegasas Knygynas',
        "city": 'Vilnius',
        "email": 'info@pegasas.lt',
        "website": 'https://pegasas.lt',
        "role": 'El. knygyno vadovui',
        "industry": 'ecommerce',
        "pain_point": 'knygų pažeidimai transportuojant kurjeriais',
        "hook": 'privati forma pirkėjui pakeisti knygą be viešo 1★'
    },
    {
        "business_name": 'Vaga Knygynas Internetu',
        "city": 'Vilnius',
        "email": 'info@vaga.lt',
        "website": 'https://vaga.lt',
        "role": 'E-komercijos komandai',
        "industry": 'ecommerce',
        "pain_point": 'literatūros mylėtojų atsiliepimai ir reitingas',
        "hook": '5★ rekomendacijos Google tinkle po kiekvieno užsakymo'
    },
    {
        "business_name": 'Knygų Klubas',
        "city": 'Vilnius',
        "email": 'info@knyguklubas.lt',
        "website": 'https://knyguklubas.lt',
        "role": 'Klubo vadovei',
        "industry": 'ecommerce',
        "pain_point": 'prenumeratų ir leidinių pristatymo klausimai',
        "hook": 'išlaikykite lojalius skaitytojus asmenišku dėmesiu'
    },
    {
        "business_name": 'Patogu Pirkti Knygynas',
        "city": 'Vilnius',
        "email": 'info@patogupirkti.lt',
        "website": 'https://patogupirkti.lt',
        "role": 'Vadovui',
        "industry": 'ecommerce',
        "pain_point": 'knygų pristatymo greičio lūkesčiai',
        "hook": 'daugiau 5★ atsiliepimų Google paieškoje'
    },
    {
        "business_name": 'Hobbyshop Stalo Žaidimai',
        "city": 'Vilnius',
        "email": 'info@hobbyshop.lt',
        "website": 'https://hobbyshop.lt',
        "role": 'El. parduotuvės vadovui',
        "industry": 'ecommerce',
        "pain_point": 'stalo žaidimų komplektacijos pastabos',
        "hook": 'momentinis trūkstamų detalių išsprendimas privačiai'
    },
    {
        "business_name": 'Žaislų Planeta',
        "city": 'Vilnius',
        "email": 'info@zaisluplaneta.lt',
        "website": 'https://zaisluplaneta.lt',
        "role": 'Klientų aptarnavimo komandai',
        "industry": 'ecommerce',
        "pain_point": 'vaikiškų žaislų kokybės ir vėlavimo skundai prieš šventes',
        "hook": 'apsaugokite el. parduotuvę nuo emocinių 1★ skundų'
    },
    {
        "business_name": 'Baby City Vaikų Prekės',
        "city": 'Vilnius',
        "email": 'info@babycity.lt',
        "website": 'https://babycity.lt',
        "role": 'E-komercijos vadovei',
        "industry": 'ecommerce',
        "pain_point": 'vežimėlių ir autokėdučių pristatymo terminai',
        "hook": 'patenkintos mamos sukuria nepriekaištingą 5★ reitingą'
    },
    {
        "business_name": 'Kotryna Group',
        "city": 'Vilnius',
        "email": 'info@kotryna.lt',
        "website": 'https://kotryna.lt',
        "role": 'Prekybos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'vaikiškų prekių prekybos tinklo atsiliepimai',
        "hook": 'reputacijos apsauga po internetinių pirkimų'
    },
    {
        "business_name": 'StaloZaidimai.eu',
        "city": 'Vilnius',
        "email": 'info@stalozaidimai.eu',
        "website": 'https://stalozaidimai.eu',
        "role": 'Vadovui',
        "industry": 'ecommerce',
        "pain_point": 'kolekcinių žaidimų pakuotės saugumas',
        "hook": 'surinkite 5★ iš entuziastų be stovelio poreikio'
    },
    {
        "business_name": 'Decathlon Lietuva',
        "city": 'Vilnius',
        "email": 'pagalba@decathlon.lt',
        "website": 'https://decathlon.lt',
        "role": 'Klientų patirties vadovui',
        "industry": 'ecommerce',
        "pain_point": 'sporto inventoriaus pristatymas ir garantiniai klausimai',
        "hook": 'automatinė po-pirkimo nuoroda el. paštu ir SMS'
    },
    {
        "business_name": 'Sportpoint Sporto Prekės',
        "city": 'Vilnius',
        "email": 'info@sportpoint.lt',
        "website": 'https://sportpoint.lt',
        "role": 'Vadovui',
        "industry": 'ecommerce',
        "pain_point": 'bėgimo batelių ir sporto aprangos atsiliepimai',
        "hook": 'patenkinti sportininkai kelia Jūsų reitingą Google'
    },
    {
        "business_name": 'Fanshop Lietuva',
        "city": 'Kaunas',
        "email": 'info@fanshop.lt',
        "website": 'https://fanshop.lt',
        "role": 'E-parduotuvės komandai',
        "industry": 'ecommerce',
        "pain_point": 'krepšinio ir futbolo atributikos pirkėjų atsiliepimai',
        "hook": 'lojalumo ir 5★ atsiliepimų augimas'
    },
    {
        "business_name": 'Pet24 Gyvūnų Prekės',
        "city": 'Vilnius',
        "email": 'info@pet24.lt',
        "website": 'https://pet24.lt',
        "role": 'El. parduotuvės vadovui',
        "industry": 'ecommerce',
        "pain_point": 'gyvūnų maisto pakuočių pažeidimai kurjerių metu',
        "hook": 'išspręskite maisto maišo pažeidimą privačiai be skundo'
    },
    {
        "business_name": 'Kika Lietuva Internetu',
        "city": 'Kaunas',
        "email": 'klientams@kika.lt',
        "website": 'https://kika.lt',
        "role": 'E-komercijos vadovei',
        "industry": 'ecommerce',
        "pain_point": 'naminių gyvūnėlių prekių pristatymo greitis',
        "hook": 'paverskite laimingus šeimininkus 5★ Google vertintojais'
    },
    {
        "business_name": 'Zooplus Lietuva',
        "city": 'Vilnius',
        "email": 'service@zooplus.lt',
        "website": 'https://zooplus.lt',
        "role": 'Klientų aptarnavimo komandai',
        "industry": 'ecommerce',
        "pain_point": 'tarptautinių siuntų vėlavimai ir vieši skundai',
        "hook": 'nukreipkite nusivylimą į privačią formą vadovui'
    },
    {
        "business_name": 'Vet1 Gyvūnų Vaistinė',
        "city": 'Vilnius',
        "email": 'info@vet1.lt',
        "website": 'https://vet1.lt',
        "role": 'Veterinarijos komandai',
        "industry": 'ecommerce',
        "pain_point": 'gydomųjų pašarų pristatymo jautrumas',
        "hook": 'pasitikėjimo ir 5★ atsiliepimų stiprinimas'
    },
    {
        "business_name": 'Žūklys Žūklės Prekės',
        "city": 'Kaunas',
        "email": 'info@zuklys.lt',
        "website": 'https://zuklys.lt',
        "role": 'Vadovui',
        "industry": 'ecommerce',
        "pain_point": 'žūklės įrangos ir meškerių transportavimo rizikos',
        "hook": 'automatinis žvejų atsiliepimų surinkimas po Omniva'
    },
    {
        "business_name": 'Salmo Žūklė',
        "city": 'Vilnius',
        "email": 'info@salmo.lt',
        "website": 'https://salmo.lt',
        "role": 'Prekybos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'žūklės reikmenų garantinis aptarnavimas',
        "hook": 'apsaugokite el. parduotuvę nuo piktų komentarų'
    },
    {
        "business_name": 'Bottlery Internetu',
        "city": 'Vilnius',
        "email": 'info@bottlery.eu',
        "website": 'https://bottlery.eu',
        "role": 'E-komercijos vadovei',
        "industry": 'ecommerce',
        "pain_point": 'dūžtančių butelių ir dovanų pakuočių transportavimas',
        "hook": 'pažeidimų kompensavimas privačiai be viešo skundo'
    },
    {
        "business_name": 'Livin Natūralūs Produktai',
        "city": 'Vilnius',
        "email": 'info@livin.lt',
        "website": 'https://livin.lt',
        "role": 'El. prekybos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'ekologiškų produktų terminų ir pakuočių skundai',
        "hook": 'išsaugokite sąmoningą pirkėją mandagia privačia forma'
    },
    {
        "business_name": 'Kavos Draugas Internetu',
        "city": 'Vilnius',
        "email": 'labas@kavosdraugas.lt',
        "website": 'https://kavosdraugas.lt',
        "role": 'Klientų laimės vadovui',
        "industry": 'ecommerce',
        "pain_point": 'kavos aparatų priežiūros ir kavos pupelių atsiliepimai',
        "hook": '5★ kavos mylėtojų atsiliepimai Google tinkle'
    },
    {
        "business_name": "Gurman's Kava ir Arbata",
        "city": 'Vilnius',
        "email": 'info@gurmans.lt',
        "website": 'https://gurmans.lt',
        "role": 'Direktoriui',
        "industry": 'ecommerce',
        "pain_point": 'arbatos ir kavos rinkinių dovanų pirkėjų atsiliepimai',
        "hook": 'nuoroda po pirkimo el. paštu be stovelio poreikio'
    },
    {
        "business_name": 'Rūta Šokoladas Internetu',
        "city": 'Šiauliai',
        "email": 'info@ruta.lt',
        "website": 'https://ruta.lt',
        "role": 'E-parduotuvės komandai',
        "industry": 'ecommerce',
        "pain_point": 'šokolado gaminių išvaizda po vasaros ar žiemos kurjerių',
        "hook": 'išspręskite pažeistą saldumynų dėžutę privačiai'
    },
    {
        "business_name": 'Pergalė Saldainiai',
        "city": 'Vilnius',
        "email": 'info@pergale.lt',
        "website": 'https://pergale.lt',
        "role": 'Prekybos vadovui',
        "industry": 'ecommerce',
        "pain_point": 'lietuviškų saldumynų pirkėjų pasitikėjimas internetu',
        "hook": 'surinkite 5★ atsiliepimus po kiekvienos šventinės siuntos'
    },
    {
        "business_name": 'Majai Riešutai ir Džiovinti Vaisiai',
        "city": 'Kaunas',
        "email": 'info@majai.lt',
        "website": 'https://majai.lt',
        "role": 'Vadovui',
        "industry": 'ecommerce',
        "pain_point": 'užsakymų komplektavimo tikslumas ir kurjeriai',
        "hook": 'greitas atsiliepimų filtras po siuntos atsiėmimo'
    },
    {
        "business_name": 'Assorti Gourmet Internetu',
        "city": 'Vilnius',
        "email": 'info@assorti.lt',
        "website": 'https://assorti.lt',
        "role": 'E-komercijos direktorei',
        "industry": 'ecommerce',
        "pain_point": 'išskirtinio maisto pristatymo temperatūrinis režimas',
        "hook": 'aukščiausios klasės reputacijos valdymas be viešų skundų'
    },
    {
        "business_name": 'Melga Autoservisas ir Padangos',
        "city": 'Kaunas',
        "email": 'info@melga.lt',
        "website": 'https://melga.lt',
        "role": 'Servisų tinklo vadovui',
        "industry": 'services',
        "pain_point": 'sezoninio padangų keitimo eilių atsiliepimai',
        "hook": 'sulaikykite neigiamas emocijas registratūroje'
    },
    {
        "business_name": 'Tanagra Autoservisai',
        "city": 'Vilnius',
        "email": 'info@tanagra.lt',
        "website": 'https://tanagra.lt',
        "role": 'Servisų departamento direktoriui',
        "industry": 'services',
        "pain_point": 'autodalių ir meistrų darbo vertinimas',
        "hook": 'momentinis skundų filtras registratūroje'
    },
    {
        "business_name": 'Eoltas Autoservisai',
        "city": 'Kaunas',
        "email": 'info@eoltas.lt',
        "website": 'https://eoltas.lt',
        "role": 'Paslaugų vadovui',
        "industry": 'services',
        "pain_point": 'meistrų darbo kokybės atsiliepimai Google Maps',
        "hook": 'pakelkite autoserviso reitingą virš konkurentų'
    },
    {
        "business_name": 'Bosch Car Service Lietuva',
        "city": 'Vilnius',
        "email": 'info@boschcarservice.lt',
        "website": 'https://boschcarservice.lt',
        "role": 'Vadovui',
        "industry": 'services',
        "pain_point": 'premium automobilių diagnostikos lūkesčiai',
        "hook": 'aukščiausios klasės reputacijos apsauga'
    },
    {
        "business_name": 'Automeistrai Vilnius',
        "city": 'Vilnius',
        "email": 'info@automeistrai.lt',
        "website": 'https://automeistrai.lt',
        "role": 'Serviso direktoriui',
        "industry": 'services',
        "pain_point": 'vairuotojų atsiliepimai po važiuoklės remonto',
        "hook": 'QR stovelis prie atsiskaitymo kasos'
    },
    {
        "business_name": 'Dagris Autoservisas',
        "city": 'Vilnius',
        "email": 'info@dagris.lt',
        "website": 'https://dagris.lt',
        "role": 'Vadovui',
        "industry": 'services',
        "pain_point": 'automobilių paruošimo techninei apžiūrai vertinimai',
        "hook": 'apsauga nuo atsitiktinių 1★ skundų'
    },
    {
        "business_name": 'Autoaibė Servisų Centras',
        "city": 'Šiauliai',
        "email": 'info@autoaibe.lt',
        "website": 'https://autoaibe.lt',
        "role": 'Vadovui',
        "industry": 'services',
        "pain_point": 'regiono vairuotojų pasitikėjimas Google',
        "hook": 'daugiau privačių klientų iš Google paieškos'
    },
    {
        "business_name": 'Juta Autoservisas',
        "city": 'Kaunas',
        "email": 'info@juta.lt',
        "website": 'https://juta.lt',
        "role": 'Direktoriui',
        "industry": 'services',
        "pain_point": 'oficialaus atstovo remonto kokybės atsiliepimai',
        "hook": 'patenkinti klientai per 3 sek. atveria Google Maps'
    },
    {
        "business_name": 'Figaro Grožio Salonų Tinklas',
        "city": 'Vilnius',
        "email": 'info@figaro.lt',
        "website": 'https://figaro.lt',
        "role": 'Salono vadovei',
        "industry": 'services',
        "pain_point": 'kirpėjų ir manikiūro meistrų vertinimai',
        "hook": 'apsaugokite saloną nuo emocinių lankytojų skundų'
    },
    {
        "business_name": 'Grožio Salonas Yury',
        "city": 'Vilnius',
        "email": 'info@yury.lt',
        "website": 'https://yury.lt',
        "role": 'Studijos vadovui',
        "industry": 'services',
        "pain_point": 'premium grožio paslaugų atsiliepimai',
        "hook": 'estetiškas akrilinis stovelis prie administratorės'
    },
    {
        "business_name": 'Simona Grožio Centras',
        "city": 'Kaunas',
        "email": 'info@simonagrozis.lt',
        "website": 'https://simonagrozis.lt',
        "role": 'Vadovei',
        "industry": 'services',
        "pain_point": 'kosmetologijos procedūrų lūkesčiai',
        "hook": 'pastabos tiesiai vadovei, o 5★ viešai Google'
    },
    {
        "business_name": 'Estetus Klinika',
        "city": 'Vilnius',
        "email": 'info@estetus.lt',
        "website": 'https://estetus.lt',
        "role": 'Klinikos vadovei',
        "industry": 'services',
        "pain_point": 'lazerinės ir estetinės medicinos pacientų atsiliepimai',
        "hook": 'aukščiausias pasitikėjimas ir 5★ reitingas'
    },
    {
        "business_name": 'Sugihara Grožio ir Terapijos Centras',
        "city": 'Vilnius',
        "email": 'info@sugihara.lt',
        "website": 'https://sugihara.lt',
        "role": 'Klientų patirties vadovei',
        "industry": 'services',
        "pain_point": 'SPA ir gydomųjų procedūrų vertinimas',
        "hook": 'diskretiškas atsiliepimų surinkimas po procedūros'
    },
    {
        "business_name": 'Grand Spa Lietuva',
        "city": 'Druskininkai',
        "email": 'info@grandspa.lt',
        "website": 'https://grandspa.lt',
        "role": 'Viešbučio direktoriui',
        "industry": 'services',
        "pain_point": 'poilsiautojų atsiliepimai Google ir Booking.com',
        "hook": 'išspręskite svečių pastabas registratūroje'
    },
    {
        "business_name": 'Vytautas Mineral Spa',
        "city": 'Birštonas',
        "email": 'info@vytautasmineralspa.lt',
        "website": 'https://vytautasmineralspa.lt',
        "role": 'Vadovybei',
        "industry": 'services',
        "pain_point": 'kurorto svečių lūkesčiai ir atsiliepimai',
        "hook": 'saugus 5★ atsiliepimų auginimas'
    },
    {
        "business_name": 'Eglės Sanatorija',
        "city": 'Druskininkai',
        "email": 'info@sanatorija.lt',
        "website": 'https://sanatorija.lt',
        "role": 'Klientų aptarnavimo vadovui',
        "industry": 'services',
        "pain_point": 'sanatorinio gydymo pacientų atsiliepimai',
        "hook": 'momentinis pastabų filtravimas'
    },
    {
        "business_name": 'Gradiali Sanatorija Palanga',
        "city": 'Palanga',
        "email": 'info@gradiali.com',
        "website": 'https://gradiali.com',
        "role": 'Sanatorijos vadovei',
        "industry": 'services',
        "pain_point": 'pajūrio poilsiautojų atsiliepimai ir reitingas',
        "hook": 'paverskite poilsiautojus viešais ambasadoriais'
    },
    {
        "business_name": 'Amberton Viešbučių Grupė',
        "city": 'Vilnius',
        "email": 'info@amberton.lt',
        "website": 'https://amberton.lt',
        "role": 'Generaliniam direktoriui',
        "industry": 'services',
        "pain_point": 'viešbučio svečių atsiliepimai Google Maps',
        "hook": 'nulinis skundų skaičius viešojoje erdvėje'
    }
]

def generate_slug(name: str) -> str:
    nfkd = unicodedata.normalize('NFKD', name)
    no_acc = "".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', no_acc).strip().lower()
    slug = re.sub(r'[\s-]+', '-', clean)
    return slug[:40]

def get_uncontacted_ecommerce_leads(limit: int = 25) -> List[Dict[str, Any]]:
    """Grąžina e-komercijos įmones, kurioms dar nebuvo siųstas laiškas."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT email FROM campaign_leads")
    contacted_emails = set(row[0].strip().lower() for row in c.fetchall() if row[0])
    conn.close()

    results = []
    for lead in ECOMMERCE_LEADS_CATALOG:
        email = lead["email"].strip().lower()
        if email not in contacted_emails:
            slug = generate_slug(lead["business_name"])
            results.append({
                **lead,
                "slug": slug,
                "preview_url": f"https://verslomatika.lt/r/{slug}",
                "claim_url": f"https://verslomatika.lt/checkout?slug={slug}",  # aktyvavimas per claim tokeną laiške (ROADMAP A3)
                "qr_url": f"https://verslomatika.lt/api/qr?slug={slug}"
            })
            if len(results) >= limit:
                break
    return results
