import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('obstetrics___gynaecology:')
end_idx = text.find('// Auto-expand question datasets', idx)
obg_block = text[idx:end_idx]

# Check how many question objects are explicitly written in obg_block
q_texts = re.findall(r'text:\s*\'([^\']+)\'', obg_block)
print(f"Total explicitly written questions in OBGYN block: {len(q_texts)}")
for i, q in enumerate(q_texts[:10], 1):
    print(f"Q{i}: {q[:80]}...")
