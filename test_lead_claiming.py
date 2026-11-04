import urllib.request
import json

url = "http://127.0.0.1:3000/api/checkout"
headers = {
    "Content-Type": "application/json",
    "Origin": "http://127.0.0.1:3000"
}
payload = {
    "business_name": "Vilniaus Implantologijos Centras (VIC)",
    "email": "info@vic.lt",
    "slug": "vilniaus-implantologijos-centras-vic",
    "google_review_url": "https://maps.google.com/?cid=11223344",
    "password": "ManoSaugiKlinika2026!",
    "password_confirm": "ManoSaugiKlinika2026!"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as res:
        print(f"Claim Status: {res.status}")
        print(f"Claim Body: {res.read().decode('utf-8')}")
        print(f"Set-Cookie: {res.headers.get('Set-Cookie', '')[:60]}...")
except urllib.error.HTTPError as e:
    print(f"Claim failed {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
