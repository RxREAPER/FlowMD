import json

# Let's inspect qbank-data.js to verify getSubjectQBank functionality and check how each subject from syllabusData maps to qbank
with open('data.js', 'r', encoding='utf-8') as f:
    dtext = f.read()

import re
# Find all subject IDs in data.js
subj_matches = re.findall(r'\{\s*"id":\s*"([^"]+)",\s*"subject":\s*"([^"]+)"', dtext)
print(f"Total subjects in data.js: {len(subj_matches)}")

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    qb_text = f.read()

# Let's extract CURATED_QBANKS keys
curated_keys = re.findall(r'(\w+):\s*\{\s*id:\s*[\'"](\w+)[\'"]', qb_text)
print(f"Curated QBank keys found: {len(curated_keys)}")
for k, cid in curated_keys:
    print(f"  key: {k:30} id: {cid}")

