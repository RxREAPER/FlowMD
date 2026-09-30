import re
import json

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Find medicine subject
med_match = re.search(r'\{\s*"id":\s*"medicine",\s*"subject":\s*"Medicine".*?\}\s*,\s*\{\s*"id":\s*"surgery"', text, re.DOTALL)
if med_match:
    med_text = med_match.group(0)
    chaps = re.findall(r'"name":\s*"([^"]+)"', med_text)
    print(f"Medicine chapters found ({len(chaps)}):")
    for c in chaps:
        print(f" - {c}")
else:
    print("Medicine block not found via regex, searching simply:")
    for m in re.finditer(r'"id":\s*"medicine".*?chapters":\s*\[(.*?)\]\s*\}', text, re.DOTALL):
        print("Found:", m.group(0)[:500])
