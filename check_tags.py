import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "https://verslomatika.lt/checkout"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

for tag in ['h1', 'h2', 'form']:
    matches = re.findall(rf'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL)
    print(f"Tag <{tag}> ({len(matches)}):")
    for m in matches[:5]:
        clean = ' '.join(re.sub(r'<[^>]+>', ' ', m).split())
        print(f"  - {clean}")
