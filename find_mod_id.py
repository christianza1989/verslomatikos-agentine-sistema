with open("verslomatika_v2_live.js", "rb") as f:
    raw = f.read()

import re
matches = [m.start() for m in re.finditer(rb'91000a7950fa', raw)]
print("Total occurrences of 91000a7950fa:", len(matches))
for idx in matches:
    print(raw[max(0, idx-100):min(len(raw), idx+150)].decode('latin1', errors='ignore'))
