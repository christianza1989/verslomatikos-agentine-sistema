import sys

with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

parts = raw.split(b"--f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729")
for p in parts:
    if b'name="./ssr/_next/static/ReputationLeadPersonalizer-CjCI3OoG.js"' in p:
        with open("reputation_personalizer_part.txt", "w", encoding="utf-8") as out:
            out.write(p.decode("utf-8", errors="ignore"))
        print("Wrote reputation_personalizer_part.txt")
