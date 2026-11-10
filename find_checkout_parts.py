import re

with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

parts = raw.split(b"--f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729")
for i, p in enumerate(parts):
    if b"reputacija.verslomatika.lt/checkout" in p:
        m = re.search(rb'Content-Disposition: form-data; name="([^"]+)"', p)
        part_name = m.group(1).decode('latin1') if m else f"part_{i}"
        print(f"Part {i}: {part_name} (length {len(p)})")
        # Find lines with checkout
        lines = [line for line in p.splitlines() if b"reputacija.verslomatika.lt/checkout" in line]
        for l in lines[:3]:
            print("  Line:", l[:150].decode('latin1', errors='ignore'))
