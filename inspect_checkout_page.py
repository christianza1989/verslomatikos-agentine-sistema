import urllib.request
import re

url = "https://verslomatika.lt/checkout"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
        print("HTML length:", len(html))
        print("Head:", html[:500])
        print("Body text preview:")
        # extract text inside body
        text = re.sub(r'<[^>]+>', ' ', html)
        clean_text = ' '.join(text.split())
        print(clean_text[:600])
except Exception as e:
    print("Error:", e)
