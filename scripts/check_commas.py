import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's find all top-level keys in CURATED_QBANKS
curated_start = code.find('const CURATED_QBANKS = {')
curated_end = code.find('// Aliases', curated_start)
if curated_end == -1:
    curated_end = code.find('function populateSampleQuestions', curated_start)

curated_block = code[curated_start:curated_end]
print("Found CURATED_QBANKS block, length:", len(curated_block))

# Let's check each subject closing bracket
matches = list(re.finditer(r'(\n\s{4}[a-z0-9_]+:\s*\{)', curated_block))
print(f"Found {len(matches)} top-level subject keys in CURATED_QBANKS:")
for idx, m in enumerate(matches):
    key_line = m.group(1).strip()
    # Check text right before this key (within 50 chars)
    if idx > 0:
        prev_text = curated_block[max(0, m.start() - 30):m.start()]
        has_comma = ',' in prev_text
        print(f"  {idx+1:2}. {key_line:35} | Preceded by comma: {has_comma}")
        if not has_comma:
            print(f"     ERROR: Missing comma before {key_line}!")
            print(f"     Context: {repr(prev_text)}")
    else:
        print(f"  {idx+1:2}. {key_line:35} (First key)")

