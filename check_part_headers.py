import re

with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

parts = raw.split(b"--f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729")
for p in parts[:15]:
    m = re.search(rb'Content-Disposition: [^\r\n]+', p)
    if m:
        print(m.group(0).decode('latin1'))
