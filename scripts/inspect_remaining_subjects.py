import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# find subjects
import re
pattern = r'\{\s*"id":\s*"([^"]+)",\s*"subject":\s*"([^"]+)".*?"chapters":\s*(\[.*?\])\s*\}'
matches = re.finditer(r'\{\s*"id":\s*"([a-zA-Z0-9_]+)",\s*"subject":\s*"([^"]+)"', text)

subjects_info = {}
for m in matches:
    s_id = m.group(1)
    s_name = m.group(2)
    start_pos = m.start()
    # find chapters
    chap_match = re.search(r'"chapters":\s*(\[.*?\])\s*\}', text[start_pos:], re.DOTALL)
    if chap_match:
        chaps_text = chap_match.group(1)
        chap_names = re.findall(r'"name":\s*"([^"]+)"', chaps_text)
        vid_count = len(re.findall(r'"id":\s*"[^"]+"', chaps_text))
        subjects_info[s_id] = {
            'name': s_name,
            'chapters': len(chap_names),
            'chapter_names': chap_names,
            'videos': vid_count
        }

for s_id in ['medicine', 'paediatrics', 'orthopaedics', 'psychiatry']:
    if s_id in subjects_info:
        info = subjects_info[s_id]
        print(f"=== {info['name']} ({s_id}) ===")
        print(f"Chapters ({info['chapters']}):")
        for c in info['chapter_names']:
            print(f"  - {c}")
