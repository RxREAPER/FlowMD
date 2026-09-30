import re

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('community_medicine: {')
end_idx = text.find('ophthalmology: {')
cm_slice = text[start_idx:end_idx]

chapters = re.findall(r'name:\s*\'([^\']+)\',\s*topics:\s*\[', cm_slice)
topics = re.findall(r'id:\s*\'([^\']+)\',\s*name:\s*\'([^\']+)\',\s*rating:\s*([\d.]+),\s*mcqCount:\s*(\d+)', cm_slice)

print(f"Community Medicine Chapters found ({len(chapters)}):")
for i, ch in enumerate(chapters, 1):
    print(f"  {i}. {ch}")

print(f"\nTotal Topics parsed: {len(topics)}")
total_mcqs = sum(int(m[3]) for m in topics)
print(f"Total MCQs parsed: {total_mcqs}")
