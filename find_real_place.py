import urllib.request
import urllib.parse
import re

url = "https://www.google.com/maps/search/" + urllib.parse.quote("Baldų turgus Vilnius Sodybų g. 30")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "lt,en;q=0.9"
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

# Find /maps/place/...
places = re.findall(r'/maps/place/([^/]+)/', html)
print("Places found:", len(places))
for p in set(places[:10]):
    print("Place:", urllib.parse.unquote(p))

# Look for google.com/maps link patterns
links = re.findall(r'https?://[^\s"\'<>]*(?:maps|goo\.gl|g\.page)[^\s"\'<>]*', html)
print("Map links:", len(links))
for l in set(links[:10]):
    print("Link:", l)

# Look for 0x hex numbers
hexes = re.findall(r'0x[0-9a-fA-F]{12,18}', html)
print("Hex tokens found:", len(hexes))
for h in set(hexes[:10]):
    print("Hex:", h)
