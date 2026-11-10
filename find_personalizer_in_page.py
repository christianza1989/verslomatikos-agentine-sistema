with open("reputation_page_part.txt", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r"Personalizer", text, re.IGNORECASE)]
print("Matches for Personalizer in page:", len(matches))
for idx in matches:
    print(text[max(0, idx-50):min(len(text), idx+100)])
