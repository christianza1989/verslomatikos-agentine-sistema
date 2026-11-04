import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Login to get token
login_url = "http://127.0.0.1:3000/api/auth/login"
login_payload = {
    "email": "info@vilniaussypsena.lt",
    "password": "SaugiRegistracija2026!"
}
login_data = json.dumps(login_payload).encode("utf-8")
login_req = urllib.request.Request(
    login_url,
    data=login_data,
    headers={"Content-Type": "application/json", "Origin": "http://127.0.0.1:3000"},
    method="POST"
)

with urllib.request.urlopen(login_req) as res:
    cookie_header = res.headers.get("Set-Cookie")
    # extract rp_owner_session=...
    token_part = [part for part in cookie_header.split(";") if "rp_owner_session=" in part][0].strip()
    print(f"Extracted session cookie: {token_part}")

# 2. Access Admin with explicit Cookie header
admin_url = "http://127.0.0.1:3000/admin?clinic=vilniaus-sypsena-pro"
admin_req = urllib.request.Request(admin_url, headers={"Cookie": token_part})

try:
    with urllib.request.urlopen(admin_req) as res:
        html = res.read().decode("utf-8")
        print(f"Admin Access URL: {res.geturl()}")
        print(f"Contains 'Vilniaus Šypsena Pro': {'Vilniaus Šypsena Pro' in html}")
        print(f"Contains 'Vadovo dėžutė': {'Vadovo dėžutė' in html}")
        print(f"Contains 'Pakvieskite pasidalinti': {'Pakvieskite pasidalinti' in html}")
        print(f"Contains 'Atsisiųsti QR kodą': {'Atsisiųsti QR kodą' in html}")
except Exception as e:
    print(f"Admin request failed: {e}")

# 3. Access QR code download
qr_url = "http://127.0.0.1:3000/api/admin/qr?slug=vilniaus-sypsena-pro"
qr_req = urllib.request.Request(qr_url, headers={"Cookie": token_part})

try:
    with urllib.request.urlopen(qr_req) as res:
        data = res.read()
        print(f"QR Status: {res.status}")
        print(f"QR Content-Type: {res.headers.get('Content-Type')}")
        print(f"QR Byte size: {len(data)} bytes")
except Exception as e:
    print(f"QR download failed: {e}")
