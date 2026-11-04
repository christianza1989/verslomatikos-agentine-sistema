import os

for k in ['OPENAI_API_KEY', 'GROK_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY']:
    val = os.environ.get(k, '')
    print(f"{k}: {'SET (' + str(len(val)) + ' chars)' if val else 'NOT SET'}")
