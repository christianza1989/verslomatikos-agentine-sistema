import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_APP = r'C:\Users\Lenovo\Documents\Agentai\apps\reputationpro'

# 1. Update checkout/page.tsx
chk_path = os.path.join(BASE_APP, 'src', 'app', 'checkout', 'page.tsx')
with open(chk_path, 'r', encoding='utf-8') as f:
    chk = f.read()

chk = chk.replace("Starter (Grožio salonams, meistrams)", "Starter (Smulkiam verslui, meistrams)")
chk = chk.replace("Pro Klinika (Odontologams, servisams)", "Pro (Klinikoms, servisams, studijoms)")
chk = chk.replace("1 klinika arba serviso centras", "1 veiklos vieta, klinika ar studija")
chk = chk.replace("Asmeninis QR kodas ir tiesioginė paciento nuoroda", "Asmeninis QR kodas ir tiesioginė kliento nuoroda")
chk = chk.replace("Fizinis prabangus akrilinis QR stovelis registratūrai (nemokamai)", "Fizinis prabangus akrilinis QR stovelis (nemokamai)")
chk = chk.replace("Asmeninė registratūros sąranka ir paruošimas spaudai", "Asmeninė sąranka ir paruošimas spaudai")

chk = chk.replace("Pradėkime nuo<br />\n            Jūsų klinikos.", "Pradėkime nuo<br />\n            Jūsų verslo.")
chk = chk.replace("Pradėkime nuo<br />Jūsų klinikos.", "Pradėkime nuo<br />Jūsų verslo.")
chk = chk.replace("<h2>Klinikos / Verslo registracija</h2>", "<h2>Verslo paskyros aktyvavimas</h2>")

with open(chk_path, 'w', encoding='utf-8') as f:
    f.write(chk)
print("Updated checkout/page.tsx")

# 2. Update admin-controls.tsx
ac_path = os.path.join(BASE_APP, 'src', 'components', 'admin-controls.tsx')
with open(ac_path, 'r', encoding='utf-8') as f:
    ac = f.read()

ac = ac.replace("<label>Klinikos pavadinimas<input", "<label>Įmonės / Klinikos pavadinimas<input")
ac = ac.replace('placeholder="Jūsų klinika"', 'placeholder="Jūsų įmonė ar klinika"')
ac = ac.replace("<label>Klinikos el. paštas<input", "<label>Kontaktinis el. paštas<input")
ac = ac.replace('placeholder="info@klinika.lt"', 'placeholder="info@imone.lt"')
ac = ac.replace("'Pridėti kliniką'", "'Pridėti įmonę'")

with open(ac_path, 'w', encoding='utf-8') as f:
    f.write(ac)
print("Updated admin-controls.tsx")

# 3. Update review-gate.tsx
rg_path = os.path.join(BASE_APP, 'src', 'components', 'review-gate.tsx')
with open(rg_path, 'r', encoding='utf-8') as f:
    rg = f.read()

rg = rg.replace("{isMemocastingDemo ? 'Kaip vertinate savo patirtį?' : 'Kaip praėjo Jūsų vizitas?'}", "'Kaip vertinate savo patirtį?'")
rg = rg.replace("Kaip praėjo Jūsų vizitas?", "Kaip vertinate savo patirtį?")
rg = rg.replace("{isMemocastingDemo ? 'Įvertinkite patirtį nuo 1 iki 5 žvaigždučių' : 'Įvertinkite vizitą nuo 1 iki 5 žvaigždučių'}", "'Įvertinkite patirtį nuo 1 iki 5 žvaigždučių'")
rg = rg.replace("Tai demonstracinis Jūsų įmonės puslapis.", "Demonstracinis puslapis.")
rg = rg.replace("'Siųsti klinikos vadovui'", "'Siųsti vadovui'")
rg = rg.replace("Jūsų žinutė išsaugota klinikos vadovo dėžutėje. Jei palikote telefono numerį, klinika galės su Jumis susisiekti.", "Jūsų žinutė išsaugota vadovo dėžutėje. Jei palikote telefono numerį, vadovas galės su Jumis susisiekti.")

with open(rg_path, 'w', encoding='utf-8') as f:
    f.write(rg)
print("Updated review-gate.tsx")

# 4. Update admin/page.tsx
adm_path = os.path.join(BASE_APP, 'src', 'app', 'admin', 'page.tsx')
with open(adm_path, 'r', encoding='utf-8') as f:
    adm = f.read()

adm = adm.replace("<span>KLINIKOS ERDVĖ</span>", "<span>VALDYMO ERDVĖ</span>")
adm = adm.replace("Pacientų balsai. Aiškūs tolesni žingsniai.", "Klientų atsiliepimai ir vadovo veiksmai.")
adm = adm.replace("Pacientų pastabos vadovui", "Klientų pastabos vadovui")
adm = adm.replace("<h2>Pacientų įvertinimai</h2>", "<h2>Klientų įvertinimai</h2>")
adm = adm.replace("Atverti paciento puslapį", "Atverti atsiliepimų puslapį")
adm = adm.replace("<h2>Klinikos nustatymai</h2>", "<h2>Įmonės nustatymai</h2>")
adm = adm.replace("Pridėkite pirmą kliniką.", "Pridėkite pirmą įmonę.")
adm = adm.replace("Pridėti dar vieną kliniką", "Pridėti dar vieną įmonę")
adm = adm.replace("Testinė klinika:", "Testinis profilis:")

with open(adm_path, 'w', encoding='utf-8') as f:
    f.write(adm)
print("Updated admin/page.tsx")

print("All branding universalized successfully!")
