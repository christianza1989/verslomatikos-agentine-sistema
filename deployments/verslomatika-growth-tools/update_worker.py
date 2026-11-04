import json
from pathlib import Path

deploy_dir = Path(r"C:\Users\Lenovo\Documents\Agentai\deployments\verslomatika-growth-tools")
tools_html = deploy_dir.joinpath("index.html").read_text(encoding="utf-8")
rep_html = Path(r"C:\Users\Lenovo\Documents\Agentai\verslomatika_reputacija_landing.html").read_text(encoding="utf-8")

if "rel=\"canonical\"" not in rep_html:
    rep_html = rep_html.replace("<meta name=\"viewport\"", "<link rel=\"canonical\" href=\"https://verslomatika.lt/reputacija/\">\n  <meta name=\"viewport\"", 1)

tools_json = json.dumps(tools_html, ensure_ascii=False)
rep_json = json.dumps(rep_html, ensure_ascii=False)

worker_code = f"""const TOOLS_HTML = {tools_json};
const REPUTATION_HTML = {rep_json};

export default {{
  async fetch(request) {{
    const url = new URL(request.url);
    if (url.pathname === '/verslo-augimo-irankiai') {{
      url.pathname += '/';
      return Response.redirect(url.toString(), 308);
    }}
    if (url.pathname === '/reputacija') {{
      url.pathname += '/';
      return Response.redirect(url.toString(), 308);
    }}
    if (url.pathname === '/verslo-augimo-irankiai/') {{
      if (request.method !== 'GET' && request.method !== 'HEAD') {{
        return new Response('Method not allowed', {{status: 405, headers: {{Allow: 'GET, HEAD'}}}});
      }}
      return new Response(request.method === 'HEAD' ? null : TOOLS_HTML, {{
        headers: {{
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }}
      }});
    }}
    if (url.pathname === '/reputacija/') {{
      if (request.method !== 'GET' && request.method !== 'HEAD') {{
        return new Response('Method not allowed', {{status: 405, headers: {{Allow: 'GET, HEAD'}}}});
      }}
      return new Response(request.method === 'HEAD' ? null : REPUTATION_HTML, {{
        headers: {{
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }}
      }});
    }}
    return new Response('Not found', {{status: 404}});
  }}
}};
"""

deploy_dir.joinpath("worker.mjs").write_text(worker_code, encoding="utf-8", newline="\n")
deploy_dir.joinpath("reputacija.html").write_text(rep_html, encoding="utf-8", newline="\n")
print(f"Updated worker.mjs written successfully! Size: {len(worker_code)} chars")
