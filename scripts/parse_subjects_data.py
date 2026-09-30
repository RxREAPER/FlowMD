import re
import json

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Parse JSON safely
clean_text = re.sub(r'^(?:const|var|let)\s+syllabusData\s*=\s*', '', text.strip()).rstrip(';')

try:
    data = json.loads(clean_text)
    for s in data:
        if s.get('id') in ['medicine', 'paediatrics', 'orthopaedics', 'psychiatry']:
            print(f"=== {s.get('subject')} ({s.get('id')}) ===")
            print(f"Total Chapters: {len(s.get('chapters', []))}")
            for c in s.get('chapters', []):
                print(f" - {c.get('name')} ({len(c.get('videos', []))} videos)")
except Exception as e:
    print("Error parsing data.js:", e)
