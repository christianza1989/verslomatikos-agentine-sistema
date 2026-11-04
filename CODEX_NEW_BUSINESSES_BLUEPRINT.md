# CODEX NAUJŲ VERSLŲ PROGRAMAVIMO GIDAS (MASTER BLUEPRINT)

Šis failas skirtas **Codex (arba bet kuriam AI programuotojui)**. Jame pateiktos tikslios techninės instrukcijos, kodo struktūros ir API integracijos, kad Codex galėtų savarankiškai per vieną sesiją suprogramuoti bet kurį iš žemiau esančių verslų modelių.

---

## 1. ReputationPro SaaS (Google Reviews 5★ Filtravimas & AI Atsakiklis)
* **Katalogo kelias:** `c:/Users/Lenovo/Documents/Agentai/configs/reputation_saas.json`
* **Tikslas:** Sukurti Next.js portalą verslams, kur jie gauna unikalų QR kodą ir nuorodą, filtruojančią atsiliepimus.
* **Techninis stekas:** Next.js (App Router), Tailwind CSS, Supabase / SQLite, Stripe Checkout, Google Business Profile API.

### Duomenų Bazės Schema:
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  google_place_id TEXT NOT NULL,
  google_review_url TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'trialing', -- 'trialing', 'active', 'past_due'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE internal_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  rating INT NOT NULL, -- 1, 2 arba 3
  feedback_text TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Review Gate Frontend Logika (`/r/[slug]/page.tsx`):
```tsx
export default function ReviewGate({ params }: { params: { slug: string } }) {
  const [rating, setRating] = useState<number | null>(null);

  const handleRatingSelect = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      // Nukreipiama TIESIAI į oficialią Google Reviews formą
      window.location.href = client.google_review_url;
    } else {
      // Rodyti vidinę privačią formą – neigiamas atsiliepimas NEPATENKA į Google
      setShowPrivateFeedbackModal(true);
    }
  };
  // UI su 5 didelėmis žvaigždutėmis ir klausimu „Kaip vertinate apsilankymą pas mus?“
}
```

---

## 2. MeistraiPRO / Niche Directory Network (SEO B2B Portalas)
* **Katalogo kelias:** `c:/Users/Lenovo/Documents/Agentai/configs/niche_directories.json`
* **Tikslas:** Programmatic SEO portalas su tūkstančiais puslapių pagal miestus ir paslaugas bei WhatsApp lead'ų persiuntimu PRO nariams.
* **Maršrutai:**
  * `/[miestas]/[paslauga]` (pvz., `/vilnius/santechnikas`, `/kaunas/elektrikas`)
  * `/specialistas/[slug]` (viešas portfolio profilis su mygtuku „Gauti kainą“)
  * `/claim/[token]` (meistro profilio patvirtinimas ir PRO narystės aktyvavimas)

### WhatsApp Lead Dispatcher Skriptas (`core/lead_dispatcher.py`):
```python
def dispatch_lead(lead_data: dict):
    # Randa PRO narius tame mieste
    pro_members = db.query("SELECT * FROM specialists WHERE city = ? AND service = ? AND is_pro = TRUE", (lead_data['city'], lead_data['service']))
    
    for member in pro_members:
        msg = f"🔔 NAUJAS KLIENTO UŽSAKYMAS ({lead_data['city']})!\nPaslauga: {lead_data['service']}\nAprašymas: {lead_data['desc']}\nKliento tel.: {lead_data['phone']}\nSkambinkite dabar!"
        send_whatsapp_message(member['phone'], msg)
        
    # Nemokamiems nariams siunčiamas apkarpytas pranešimas
    free_members = db.query("SELECT * FROM specialists WHERE city = ? AND service = ? AND is_pro = FALSE", (lead_data['city'], lead_data['service']))
    for member in free_members:
        msg = f"⚠️ Gavote naują užklausą mieste {lead_data['city']}, bet jūsų profilis yra NEMOKAMAS. Norėdami matyti kliento numerį, aktyvuokite PRO už 25 €: https://meistraipro.lt/upgrade"
        send_sms(member['phone'], msg)
```

---

## 3. ReviveLeads AI (Database Reactivation as a Service)
* **Katalogo kelias:** `c:/Users/Lenovo/Documents/Agentai/configs/database_reactivation.json`
* **Tikslas:** Įkelti CSV su 1,000 senų kontaktų ir paleisti autonominį 2-way SMS pokalbių variklį.
* **Techninis stekas:** Python FastAPI, Twilio / MessageBird SMS API, OpenAI/Claude API, Google Calendar API.

### AI Pokalbio Valdymo Promptas:
```
Tu esi profesionali ir itin draugiška klinikos administratorė Rasa.
Tavo tikslas: atgaivinti ryšį su senu pacientu ir suderinti vizito laiką.
Taisyklės:
1. Niekada nesiųsk ilgų tekstų – ne daugiau 2 sakinių vienoje žinutėje.
2. Nenaudok reklaminio tono („SUPER AKCIJA!“). Rašyk taip, lyg rašytum asmeniškai iš savo telefono.
3. Jei pacientas atsako teigiamai, pasiūlyk 2 konkrečius laikus (pvz., „Ketvirtadienį 14:00 arba penktadienį 11:30?“).
4. Kai laikas patvirtintas, įrašyk į kalendorių ir padėkok.
```

---

## 4. CallGuard AI (Missed-Call Text-Back)
* **Katalogo kelias:** `c:/Users/Lenovo/Documents/Agentai/configs/missed_call_ai.json`
* **Tikslas:** Užfiksuoti praleistą skambutį ir per 5 sekundes nusiųsti SMS, pradedančią AI pokalbį.
* **Integracija:** Twilio Webhook įvykiui `CallStatus = no-answer` arba `busy`.

### Webhook Pavyzdys (`api/missed_call_webhook.py`):
```python
from fastapi import FastAPI, Form
from twilio.rest import Client

app = FastAPI()
twilio_client = Client("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN")

@app.post("/webhook/call-status")
def handle_call_status(CallStatus: str = Form(...), From: str = Form(...), To: str = Form(...)):
    if CallStatus in ["no-answer", "busy", "failed"]:
        # Išsiunčiama momentinė SMS per 3 sekundes
        sms_text = "Sveiki! Šiuo metu atlieku skubų remontą ir negalėjau pakelti ragelio. Kuo galėčiau padėti? Parašykite trumpai čia."
        twilio_client.messages.create(body=sms_text, from_=To, to=From)
        # Pradedama pokalbio sekimo sesija duomenų bazėje
        create_active_lead_session(phone=From, service_number=To)
    return {"status": "ok"}
```

---

## 5. Kaip Codex Paleidžia Bet Kurį Verslą
Kai nurodysite Codex: *„Codex, suprogramuok MVP verslui [Verslo Pavadinimas]“*, Codex privalo:
1. Perskaityti atitinkamą JSON failą iš `configs/`.
2. Sukurti `src/` katalogą su Next.js arba FastAPI kodu.
3. Sukurti SQLite/Supabase migraciją.
4. Sukurti `.env.example` failą su reikalingais API raktais.
5. Paleisti vietinį serverį ir atlikti testinį pirkimo/užklausos srautą.
