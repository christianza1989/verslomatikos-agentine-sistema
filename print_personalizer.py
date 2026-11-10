with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

parts = raw.split(b"--f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729")
for p in parts:
    if b'name="./ssr/_next/static/ReputationLeadPersonalizer-CjCI3OoG.js"' in p:
        print("=== ReputationLeadPersonalizer code ===")
        print(p.decode('latin1'))
    if b'name="ssr/_next/static/ReputationLeadPersonalizer-CjCI3OoG.js.map"' in p:
        print("=== ReputationLeadPersonalizer MAP ===")
        print(p[:1500].decode('latin1'))
