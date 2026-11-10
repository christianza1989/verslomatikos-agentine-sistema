import urllib.request
import json
import re

with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

boundary = "f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729"

# Check index.js part
pattern = b'Content-Disposition: form-data; name="index.js"'
replacement = b'Content-Disposition: form-data; name="index.js"; filename="index.js"'
if pattern in raw:
    print("Found index.js part!")

# Also check how other JS parts look
parts = raw.split(b"--" + boundary.encode('ascii'))
print("Total parts:", len(parts))
for p in parts[:10]:
    first_line = p.strip()[:120]
    if first_line:
        print("Part header:", first_line.decode('latin1', errors='ignore'))
