import urllib.request
import ssl
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Connect via Cloudflare's IP to verify what the internet sees
# IP of Cloudflare: 104.21.35.136
url = "https://reputacija.verslomatika.lt/checkout?slug=baldu-turgus&name=Bald%C5%B3%20turgus"

# We use standard urllib - let's see if default DNS resolves it now
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        print("STATUS:", resp.status)
        html = resp.read().decode('utf-8', errors='ignore')
        print("HTML length:", len(html))
        print("Contains 'Sukurkite savo paskyrą':", "Sukurkite savo paskyrą" in html)
        print("Contains 'Baldų turgus':", "Baldų turgus" in html)
except Exception as e:
    print("Default DNS error:", e)

# Test with IP resolution to confirm tunnel end-to-end
import socket
ctx = ssl.create_default_context()
with socket.create_connection(('104.21.35.136', 443), timeout=5) as sock:
    with ctx.wrap_socket(sock, server_hostname='reputacija.verslomatika.lt') as ssock:
        http_req = (
            "GET /checkout?slug=baldu-turgus&name=Bald%C5%B3%20turgus HTTP/1.1\r\n"
            "Host: reputacija.verslomatika.lt\r\n"
            "User-Agent: Mozilla/5.0\r\n"
            "Connection: close\r\n\r\n"
        ).encode('utf-8')
        ssock.sendall(http_req)
        response = b""
        while True:
            chunk = ssock.recv(4096)
            if not chunk:
                break
            response += chunk
        resp_text = response.decode('utf-8', errors='ignore')
        print("\n--- Direct CF Tunnel Request ---")
        print("Status Line:", resp_text.splitlines()[0])
        print("Contains 'Sukurkite savo paskyrą':", "Sukurkite savo paskyrą" in resp_text)
        print("Contains 'baldu-turgus':", "baldu-turgus" in resp_text)
