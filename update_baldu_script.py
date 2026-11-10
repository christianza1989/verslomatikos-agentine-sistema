path = r"E:\Verslomatika\send_balduturgus_email.py"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

old_code = '''    demo_page_url = f"https://verslomatika.lt/r/{slug}?google_review_url={urllib.parse.quote(direct_review_url)}"
    pricing_page_url = "https://verslomatika.lt/reputacija/#kainos"'''

new_code = '''    demo_page_url = f"https://verslomatika.lt/r/{slug}?google_review_url={urllib.parse.quote(direct_review_url)}"
    lead_query = f"slug={urllib.parse.quote(slug)}&name={urllib.parse.quote(b_name)}&email={urllib.parse.quote(to_email)}&google_review_url={urllib.parse.quote(direct_review_url)}"
    pricing_page_url = f"https://verslomatika.lt/reputacija?{lead_query}#kainos"'''

if old_code in code:
    code = code.replace(old_code, new_code, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Updated send_balduturgus_email.py successfully!")
else:
    print("old_code not found in send_balduturgus_email.py")
