import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('ophthalmology:')
if idx != -1:
    next_match = re.search(r'\n    [a-zA-Z0-9_]+:\s*\{', text[idx+15:])
    end_idx = idx + 15 + next_match.start() if next_match else text.find('// Auto-expand question datasets', idx)
    sub_slice = text[idx:end_idx]
    
    topics = re.findall(r"name:\s*'([^']+)',\s*\n\s*rating:\s*([0-9.]+),\s*\n\s*mcqCount:\s*([0-9]+)", sub_slice)
    print(f"Total Ophthalmology topics found: {len(topics)}")
    total_mcqs = 0
    for i, (name, rating, count) in enumerate(topics, 1):
        total_mcqs += int(count)
        print(f"#{i:02d} {name} (Rating: {rating}, {count} MCQs)")
    print(f"\nTotal MCQs: {total_mcqs}")
else:
    print("Ophthalmology not found in qbank-data.js")
