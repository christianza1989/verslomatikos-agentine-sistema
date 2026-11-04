import urllib.request
import json
import sys

url = "http://127.0.0.1:3000/api/checkout"
headers = {
    "Content-Type": "application/json",
    "Origin": "http://127.0.0.1:3000"
}
payload = {
    "business_name": "Vilniaus Šypsena Pro",
    "email": "info@vilniaussypsena.lt",
    "slug": "vilniaus-sypsena-pro",
    "google_review_url": "https://maps.google.com/?cid=987654321",
    "password": "SaugiRegistracija2026!",
    "password_confirm": "SaugiRegistracija2026!"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        status = response.status
        body = response.read().decode("utf-8")
        cookie_header = response.headers.get("Set-Cookie", "")
        print(f"Status: {status}")
        print(f"Response: {body}")
        print(f"Cookie: {cookie_header}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
