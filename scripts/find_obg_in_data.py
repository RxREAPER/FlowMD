import json
import re

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find lines containing obstetrics or gynaecology
for i, line in enumerate(text.splitlines(), 1):
    if 'obstetrics' in line.lower() or 'gynaecology' in line.lower() or 'obg' in line.lower():
        print(f"Line {i}: {line[:120]}")
