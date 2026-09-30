import json, re

def main():
    with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
        text = f.read()

    pos = text.find('community_medicine: {')
    end = text.find('ophthalmology: {', pos)
    cm_block = text[pos:end]
    
    # Extract topics
    topic_matches = re.findall(r'id:\s*[\'\"](cm_t\d+_[^\'\"]+)[\'\"],\s*name:\s*[\'\"]([^\'\"]+)[\'\"],.*?mcqCount:\s*(\d+)', cm_block, re.DOTALL)
    chap_matches = re.findall(r'id:\s*[\'\"](cm_[a-z0-9_]+)[\'\"],\s*name:\s*[\'\"]([A-Z0-9\s,&_\-\(\)\/]+)[\'\"]', cm_block)
    
    print(f"Community Medicine in qbank-data.js has {len(chap_matches)} chapters and {len(topic_matches)} topics:")
    total_mcqs = sum(int(c) for _, _, c in topic_matches)
    for i, (tid, tname, count) in enumerate(topic_matches, 1):
        print(f"  {i}. [{tid}] {tname} ({count} MCQs)")
    print(f"\nTOTAL MCQs: {total_mcqs}")

if __name__ == '__main__':
    main()
