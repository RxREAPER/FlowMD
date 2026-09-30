import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('obstetrics___gynaecology:')
if idx != -1:
    end_idx = content.find('getSubjectQBank', idx)
    obg_block = content[idx:end_idx]
    
    # Also extract chapter names
    chaps = re.findall(r"name:\s*'([A-Z\s,&()]+)'", obg_block)
    topics = re.findall(r"name:\s*'([^']+)',\s*\n\s*rating:\s*([0-9.]+),\s*\n\s*mcqCount:\s*([0-9]+)", obg_block)
    print(f"Total topics extracted: {len(topics)}")
    total_mcqs = 0
    for i, (name, rating, count) in enumerate(topics, 1):
        total_mcqs += int(count)
        print(f"#{i:02d} {name} (Rating: {rating}, {count} MCQs)")
    print(f"\nTotal OBGYN MCQs: {total_mcqs}")
else:
    print("OBGYN not found in qbank-data.js")
