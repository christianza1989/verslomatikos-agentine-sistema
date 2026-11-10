with open("verslomatika_reputacija_landing.html", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r"checkout", text)]
print("Matches in verslomatika_reputacija_landing.html:", len(matches))
for idx in matches[:5]:
    print(text[max(0, idx-50):min(len(text), idx+100)])
