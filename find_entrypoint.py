import re

with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

parts = raw.split(b"--f4d26c1c3e5956413529b89e1ac19d0a7fe98706c0c8e7deb4726fc32729")
for p in parts:
    if b'name="index.js"' in p or b'filename="index.js"' in p:
        print("MATCH for index.js:")
        print(p[:300].decode("latin1"))
        print("---")
