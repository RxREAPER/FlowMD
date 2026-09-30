import re

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('forensic_medicine: {')
end_idx = text.find('biochemistry: {')
fmt_slice = text[start_idx:end_idx]

chapters = re.findall(r'name:\s*\'([^\']+)\',\s*topics:\s*\[', fmt_slice)
topics = re.findall(r'id:\s*\'([^\']+)\',\s*name:\s*\'([^\']+)\',\s*rating:\s*([\d.]+),\s*mcqCount:\s*(\d+),\s*isPro:\s*(true|false)', fmt_slice)

print(f"Forensic Medicine Chapters found ({len(chapters)}):")
for i, ch in enumerate(chapters, 1):
    print(f"  {i}. {ch}")

print(f"\nTotal Topics parsed: {len(topics)}")
total_mcqs = sum(int(m[3]) for m in topics)
print(f"Total MCQs parsed: {total_mcqs}")
for i, (tid, name, r, m, is_pro) in enumerate(topics, 1):
    badge = 'PRO' if is_pro == 'true' else 'FREE'
    print(f"  #{i:02d}: {name} | Rating: {r} | MCQs: {m} | {badge}")
