import re

with open('verslomatika_v2_live.js', 'rb') as f:
    raw = f.read()

matches = re.findall(rb'https://reputacija\.verslomatika\.lt[^\s"\'<>]+', raw)
print('Count in bundle:', len(matches))
for u in set(matches):
    print(" -", u.decode('latin1'))
