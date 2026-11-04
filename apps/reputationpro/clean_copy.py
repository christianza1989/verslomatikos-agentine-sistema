import sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. Update checkout/page.tsx
checkout_path = 'C:/Users/Lenovo/Documents/Agentai/apps/reputationpro/src/app/checkout/page.tsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("name: 'Starter (Smulkiam verslui, meistrams)'", "name: 'Starter'")
text = text.replace("name: 'Pro (Klinikoms, servisams, studijoms)'", "name: 'Pro'")
text = text.replace("name: 'Metinis (Su nemokamu akriliniu QR stoveliu)'", "name: 'Metinis'")
text = text.replace("'1 veiklos vieta, klinika ar studija'", "'1 veiklos vieta ar padalinys'")
text = text.replace("'1 filialas / paslaugų vieta'", "'1 veiklos vieta ar padalinys'")

with open(checkout_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated checkout/page.tsx")

# 2. Update admin-controls.tsx
controls_path = 'C:/Users/Lenovo/Documents/Agentai/apps/reputationpro/src/components/admin-controls.tsx'
with open(controls_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<label>Įmonės / Klinikos pavadinimas', '<label>Įmonės pavadinimas')
text = text.replace('placeholder="Jūsų įmonė ar klinika"', 'placeholder="Jūsų įmonės pavadinimas"')
text = text.replace('<label className="clinic-picker">Verslas / Klinika', '<label className="clinic-picker">Pasirinkite įmonę')
text = text.replace('aria-label="Pasirinkite įmonę ar kliniką"', 'aria-label="Pasirinkite įmonę"')

with open(controls_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated admin-controls.tsx")
