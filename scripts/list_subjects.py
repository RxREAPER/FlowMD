import re

with open('data.js', 'r', encoding='utf-8') as f:
    dtext = f.read()

subj_matches = re.findall(r'\{\s*"id":\s*"([^"]+)",\s*"subject":\s*"([^"]+)"', dtext)

print(f"--- 20 Subjects in data.js ---")
for idx, (sid, sname) in enumerate(subj_matches, 1):
    print(f"{idx:2}. id: '{sid}', subject: '{sname}'")
