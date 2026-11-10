path = r"E:\Verslomatika\core\morning_campaign_runner.py"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip().startswith('raw_pricing_url = "https://verslomatika.lt/reputacija/#kainos"'):
        indent = "    "
        new_lines.append(f'{indent}lead_query = f"slug={{urllib.parse.quote(slug)}}&name={{urllib.parse.quote(b_name)}}&email={{urllib.parse.quote(lead.get(\'email\', \'\'))}}&google_review_url={{urllib.parse.quote(direct_review_url)}}"\n')
        new_lines.append(f'{indent}raw_pricing_url = f"https://verslomatika.lt/reputacija?{{lead_query}}#kainos"\n')
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Updated morning_campaign_runner.py successfully!")
