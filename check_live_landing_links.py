import urllib.request
import re

url = 'https://verslomatika.lt/reputacija'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        matches = set(re.findall(r'href=["\']([^"\']+)["\']', html))
        reputacija_links = [m for m in matches if 'reputacija' in m]
        print('Total links:', len(matches))
        print('Reputacija links:')
        for l in sorted(reputacija_links):
            print(' ', l)
except Exception as e:
    print(e)
