import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Update admin-controls.tsx
path_ac = r'C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\src\components\admin-controls.tsx'
with open(path_ac, 'r', encoding='utf-8') as f:
    c = f.read()

old_btn = "checkout?'Pradėti 14 dienų nemokamą bandymą'"
new_btn = "checkout?'Aktyvuoti paskyrą (14 d. nemokamai)'"
if old_btn in c:
    c = c.replace(old_btn, new_btn)
    with open(path_ac, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated admin-controls.tsx button to 'Aktyvuoti paskyrą (14 d. nemokamai)'")
else:
    print("Pattern not found in admin-controls.tsx")

# 2. Update morning_campaign_runner.py
path_cr = r'C:\Users\Lenovo\Documents\Agentai\core\morning_campaign_runner.py'
with open(path_cr, 'r', encoding='utf-8') as f:
    c_cr = f.read()

c_cr = c_cr.replace("Aktyvuoti pultą (14 d. nemokamai)", "Aktyvuoti paskyrą (14 d. nemokamai)")
c_cr = c_cr.replace("Aktyvuoti Jūsų valdymo pultą (14 d. nemokamai)", "Aktyvuoti Jūsų paskyrą (14 d. nemokamai)")
c_cr = c_cr.replace("Aktyvuoti Jūsų valdymo pultą", "Aktyvuoti Jūsų paskyrą")

with open(path_cr, 'w', encoding='utf-8') as f:
    f.write(c_cr)
print("Updated morning_campaign_runner.py to 'Aktyvuoti paskyrą'")

# 3. Update test_send_to_user.py
path_ts = r'C:\Users\Lenovo\Documents\Agentai\test_send_to_user.py'
with open(path_ts, 'r', encoding='utf-8') as f:
    c_ts = f.read()
c_ts = c_ts.replace("Aktyvuoti pultą", "Aktyvuoti paskyrą")
with open(path_ts, 'w', encoding='utf-8') as f:
    f.write(c_ts)
print("Updated test_send_to_user.py")
