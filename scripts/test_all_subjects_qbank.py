import re
import json

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all subject ids and subjects
subjects = re.findall(r'"id":\s*"([^"]+)",\s*"subject":\s*"([^"]+)"', text)
print(f"Found {len(subjects)} subjects in data.js:")

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    qbank_text = f.read()

for s_id, s_name in subjects:
    # Check if in CURATED_QBANKS
    in_curated = f"{s_id}:" in qbank_text or f"CURATED_QBANKS.{s_id}" in qbank_text
    print(f" - {s_name} ({s_id}): Curated={'YES' if in_curated else 'Dynamic via Syllabus'}")
