import sys
from pathlib import Path

for p in [
    Path(r"C:\Users\Lenovo\Documents\Agentai\verslomatika_verslo_augimo_irankiai.html"),
    Path(r"C:\Users\Lenovo\Documents\Verslomatika puslapis\verslo-augimo-irankiai.html")
]:
    if not p.exists():
        continue
    content = p.read_text(encoding="utf-8")
    content = content.replace("revive.verslomatika.lt", "reviveleads.verslomatika.lt")
    content = content.replace('350 € <span>setup + 15% RevShare</span></div>\n            <a href="#" class="btn-tool">Užsakyti pilotą ↗</a>',
                            '29 € / 49 € / 290 €</div>\n            <a href="https://verslomatika.lt/reviveleads/" class="btn-tool">Sužinoti daugiau ↗</a>')
    content = content.replace('350 € <span>setup + 15% RevShare</span></div>\r\n            <a href="#" class="btn-tool">Užsakyti pilotą ↗</a>',
                            '29 € / 49 € / 290 €</div>\r\n            <a href="https://verslomatika.lt/reviveleads/" class="btn-tool">Sužinoti daugiau ↗</a>')
    p.write_text(content, encoding="utf-8")
    print(f"Updated {p.name}")
