import json, re, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    qbank_text = f.read()

# Subject definitions
pattern = r'([a-zA-Z0-9_]+):\s*\{\s*id:\s*\'[^\']+\',\s*name:\s*\'([^\']+)\',\s*faculty:\s*\'([^\']+)\''
subjects_found = re.findall(pattern, qbank_text)

print("Curated Subjects in qbank-data.js:")
grand_total_mcqs = 0
for s_id, s_name, faculty in subjects_found:
    sub_start = qbank_text.find(f"{s_id}: {{")
    next_match = re.search(r'\n    [a-zA-Z0-9_]+:\s*\{', qbank_text[sub_start+10:])
    sub_end = sub_start + 10 + next_match.start() if next_match else qbank_text.find('// Auto-expand question datasets', sub_start)
    if sub_end == -1: sub_end = len(qbank_text)
    sub_slice = qbank_text[sub_start:sub_end]
    
    # Extract topics: can have questions array length or explicit mcqCount
    mcq_counts = [int(m) for m in re.findall(r'mcqCount:\s*(\d+)', sub_slice)]
    
    # Also if topics have questions: [...] without mcqCount (like radiology/anesthesia)
    if not mcq_counts:
        # count topics by id
        topic_matches = re.findall(r'\{\s*id:\s*\'[^\']+\',\s*name:', sub_slice)
        q_matches = re.findall(r'questionNumber:\s*\d+', sub_slice)
        topic_count = len(topic_matches)
        mcq_total = len(q_matches)
    else:
        topic_count = len(mcq_counts)
        mcq_total = sum(mcq_counts)
        
    chapters = re.findall(r'name:\s*\'([A-Z0-9\s,&()–-]+)\',\s*topics:\s*\[', sub_slice)
    grand_total_mcqs += mcq_total
    print(f"  - {s_name} ({s_id}): {len(chapters)} chapters, {topic_count} topics, {mcq_total} MCQs | {faculty}")

print(f"\nGRAND TOTAL MCQs ACROSS ALL CURATED SUBJECTS: {grand_total_mcqs}")
