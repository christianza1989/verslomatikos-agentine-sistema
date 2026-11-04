with open('C:/Users/Lenovo/Documents/Agentai/apps/reputationpro/src/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '<a href="https://verslomatika.lt/reputacija/" className="btn btn-primary">\n                <span>Apie ReputationPro</span>\n                <ExternalLink size={15} />\n              </a>'

replacement = '<Link href="/checkout" className="btn btn-primary">\n                <span>Aktyvuoti paskyrą (14 d. nemokamai)</span>\n                <ArrowUpRight size={15} />\n              </Link>\n              <a href="https://verslomatika.lt/reputacija/" className="btn btn-secondary">\n                <span>Apie sprendimą</span>\n                <ExternalLink size={15} />\n              </a>'

if target in text:
    text = text.replace(target, replacement)
elif target.replace('\n', '\r\n') in text:
    text = text.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))
else:
    print('Target not found directly, checking partial')
    text = text.replace('<span>Apie ReputationPro</span>', '<span>Aktyvuoti paskyrą (14 d. nemokamai)</span>')

with open('C:/Users/Lenovo/Documents/Agentai/apps/reputationpro/src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated CTA in page.tsx!')
