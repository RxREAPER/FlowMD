with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*\{\s*id:\s*\'([^\']+)\'', text)
for m in matches:
    print(f"Key: {m.group(1)} -> id: '{m.group(2)}' at line {text[:m.start()].count(chr(10))+1}")
