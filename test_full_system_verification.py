import urllib.request
import urllib.parse
import json
import http.cookiejar

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

# Test 1: Login with clinic credentials
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

try:
    with opener.open(login_req) as res:
        print(f"Login Status: {res.status}")
        print(f"Login Body: {res.read().decode('utf-8')}")
except Exception as e:
    print(f"Login failed: {e}")

# Test 2: Access admin dashboard with session cookie
admin_url = "http://127.0.0.1:3000/admin?clinic=vilniaus-sypsena-pro"
admin_req = urllib.request.Request(admin_url)
try:
    with opener.open(admin_req) as res:
        html = res.read().decode("utf-8")
        print(f"Admin Access Status: {res.status}")
        print(f"Contains clinic name: {'Vilniaus Šypsena Pro' in html}")
        print(f"Contains QR image: {'/api/admin/qr?slug=vilniaus-sypsena-pro' in html or 'qr-image' in html}")
        print(f"Contains FeedbackInbox: {'Vadovo dėžutė' in html}")
except Exception as e:
    print(f"Admin access failed: {e}")

# Test 3: Access public review page
review_url = "http://127.0.0.1:3000/r/vilniaus-sypsena-pro"
review_req = urllib.request.Request(review_url)
try:
    with opener.open(review_req) as res:
        html = res.read().decode("utf-8")
        print(f"Review Page Status: {res.status}")
        print(f"Review Page contains clinic: {'Vilniaus Šypsena Pro' in html}")
except Exception as e:
    print(f"Review page access failed: {e}")

# Test 4: Download QR code
qr_url = "http://127.0.0.1:3000/api/admin/qr?slug=vilniaus-sypsena-pro"
qr_req = urllib.request.Request(qr_url)
try:
    with opener.open(qr_req) as res:
        print(f"QR Download Status: {res.status}")
        print(f"QR Content Type: {res.headers.get('Content-Type')}")
        print(f"QR Content Length: {len(res.read())} bytes")
except Exception as e:
    print(f"QR download failed: {e}")
