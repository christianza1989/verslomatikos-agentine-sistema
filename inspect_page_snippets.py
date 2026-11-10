import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("reputation_page_part.txt", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r"checkout", text)]
print("Total occurrences of checkout:", len(matches))
for idx in matches[:10]:
    start = max(0, idx - 100)
    end = min(len(text), idx + 200)
    print("--- SNIPPET ---")
    print(text[start:end])
