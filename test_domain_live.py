import urllib.request
import ssl

ctx = ssl.create_default_context()
url = "https://reputacija.verslomatika.lt/checkout"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

# We test with urllib using default DNS or with custom resolver
try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        print("Status:", resp.status)
        print("URL:", resp.geturl())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.headers.get('Location'))
except Exception as e:
    print("Error:", e)
