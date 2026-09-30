import re

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

keys = re.findall(r'(\w+):\s*\{\s*id:\s*\'([^\']+)\'', text)
print("Curated subjects defined:", keys)
