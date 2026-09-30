import json
import re

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's extract all subject definitions
subjects = []
for block in re.finditer(r'id:\s*[\'\"]([^\'\"]+)[\'\"]\s*,\s*subject:\s*[\'\"]([^\'\"]+)[\'\"]', text):
    subjects.append({'id': block.group(1), 'name': block.group(2)})

print(f"Total subjects extracted from data.js: {len(subjects)}")
for s in subjects:
    print(f"ID: {s['id']:25} | Name: {s['name']}")
