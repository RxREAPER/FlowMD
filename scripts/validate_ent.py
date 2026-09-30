import re

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('otorhinolaryngology__ent_: {')
end_idx = text.find('dermatology: {')
ent_slice = text[start_idx:end_idx]

chapters = re.findall(r'name:\s*\'([^\']+)\',\s*topics:\s*\[', ent_slice)

pattern = r'id:\s*\'([^\']+)\',\s*name:\s*(?:"([^"]+)"|\'([^\']+)\'),\s*rating:\s*([\d.]+),\s*mcqCount:\s*(\d+)'
matches = re.findall(pattern, ent_slice)

print(f"ENT Chapters found ({len(chapters)}):")
for i, ch in enumerate(chapters, 1):
    print(f"  {i}. {ch}")

print(f"\nTotal Topics parsed: {len(matches)}")
total_mcqs = 0
for i, m in enumerate(matches, 1):
    topic_id = m[0]
    name = m[1] or m[2]
    rating = m[3]
    mcqs = int(m[4])
    total_mcqs += mcqs
    print(f"  #{i:02d}: {name} | Rating: {rating} | MCQs: {mcqs}")

print(f"\nTotal MCQs: {total_mcqs}")
