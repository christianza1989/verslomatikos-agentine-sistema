import re

path = r'C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\src\components\admin-controls.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

old_needle = '{checkout&&!demo&&<div className="form-row"><label>Prisijungimo slaptažodis<input required name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128}/><small>Mažiausiai 12 simbolių.</small></label><label>Pakartokite slaptažodį<input required name="password_confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128}/></label></div>}{checkout&&demo&&<p className="local-note">Testui tinka ir <code>https://www.google.com/maps</code>. Tikram naudojimui įveskite savo klinikos atsiliepimų nuorodą.</p>}'

new_val = '{checkout&&<div className="form-row"><label>Prisijungimo slaptažodis<input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128}/><small>Mažiausiai 8 simboliai.</small></label><label>Pakartokite slaptažodį<input required name="password_confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128}/></label></div>}'

if old_needle in c:
    c = c.replace(old_needle, new_val)
    print('Replaced password section')
else:
    print('Password section not found')

old_btn = "checkout?(demo?'Sukurti testinę kliniką':'Pereiti į Stripe · 14 d. bandymas')"
new_btn = "checkout?'Pradėti 14 dienų nemokamą bandymą'"
if old_btn in c:
    c = c.replace(old_btn, new_btn)
    print('Replaced button label')
else:
    print('Button label not found')

old_fine = "{checkout&&<p className=\"form-fineprint\">{demo?'Jokios kortelės ir jokio nuskaitymo. Tai vietinė demonstracija.':'Po 14 dienų – 49 €/mėn. Prenumeratos sąlygos pateikiamos Stripe atsiskaitymo lange.'}</p>}"
new_fine = "{checkout&&<p className=\"form-fineprint\">14 dienų nemokamas bandymas be jokios banko kortelės. Po bandomojo laikotarpio pasirinksite Jums tinkamą planą.</p>}"
if old_fine in c:
    c = c.replace(old_fine, new_fine)
    print('Replaced fineprint')
else:
    print('Fineprint not found')

old_check = 'if(checkout&&!demo&&body.password!==body.password_confirm)'
new_check = 'if(checkout&&body.password!==body.password_confirm)'
if old_check in c:
    c = c.replace(old_check, new_check)
    print('Replaced check')
else:
    print('Check not found')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Update admin controls complete!')
