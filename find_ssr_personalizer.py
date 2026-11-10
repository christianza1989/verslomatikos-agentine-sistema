with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

parts = raw.split(b"--f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729")
for p in parts:
    if b'name="./ssr/index.js"' in p:
        idx = p.find(b"ReputationLeadPersonalizer")
        print("Found at idx:", idx)
        print(p[max(0, idx-200):min(len(p), idx+300)].decode('latin1', errors='ignore'))
