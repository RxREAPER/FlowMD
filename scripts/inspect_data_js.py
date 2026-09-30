import re
import json

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Strip `const syllabusData = ` and trailing `;`
text_clean = re.sub(r'^(?:const|var|let)\s+syllabusData\s*=\s*', '', text.strip()).rstrip(';')

try:
    data = json.loads(text_clean)
    print(f"Loaded {len(data)} subjects from data.js:")
    for s in data:
        print(f" - id: '{s.get('id')}', subject: '{s.get('subject')}'")
except Exception as e:
    print("JSON parse failed, finding via regex:", e)
    for m in re.finditer(r'"id":\s*"([^"]+)",\s*"subject":\s*"([^"]+)"', text):
        print(f" - id: '{m.group(1)}', subject: '{m.group(2)}'")
