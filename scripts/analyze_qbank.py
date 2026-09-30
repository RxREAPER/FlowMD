import json, re

def main():
    with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
        text = f.read()

    # Find CURATED_QBANKS object
    start_pos = text.find('const CURATED_QBANKS = {')
    end_pos = text.find('// Populate any remaining topics in curated Q-Banks', start_pos)
    curated_block = text[start_pos:end_pos]

    # Find all subject keys
    sub_matches = re.findall(r'(\w+):\s*\{\s*id:\s*[\'\"](\w+)[\'\"],\s*name:\s*[\'\"]([^\'\"]+)[\'\"]', curated_block)
    print("Found curated subjects:")
    for key, sid, name in sub_matches:
        # Count topics and MCQs for this subject
        sub_start = curated_block.find(f"{key}: {{")
        # next subject
        next_matches = [curated_block.find(f"{k}: {{", sub_start + 10) for k, _, _ in sub_matches if curated_block.find(f"{k}: {{", sub_start + 10) != -1]
        sub_end = min(next_matches) if next_matches else len(curated_block)
        sub_text = curated_block[sub_start:sub_end]

        chap_names = re.findall(r'name:\s*[\'\"]([A-Z0-9\s,&_\-\(\)\/]+)[\'\"]', sub_text)
        topic_matches = re.findall(r'name:\s*[\'\"]([^\'\"]+)[\'\"],\s*(?:rating:\s*[\d\.]+,\s*)?mcqCount:\s*(\d+)', sub_text)
        total_mcqs = sum(int(count) for _, count in topic_matches)
        print(f" - {name} ({sid}): {len(chap_names)} chapters, {len(topic_matches)} topics, {total_mcqs} Total MCQs")

if __name__ == '__main__':
    main()
