import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data.js', 'r', encoding='utf-8') as f:
    dtext = f.read()

subj_matches = re.findall(r'\{\s*"id":\s*"([^"]+)",\s*"subject":\s*"([^"]+)"', dtext)

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    qb_text = f.read()

print("Verifying all subjects Q-Bank topics and questions count:")
print("=" * 75)

curated_total_topics = 0
curated_total_mcqs = 0

for sid, sname in subj_matches:
    normKey = re.sub(r'[^a-z0-9_]', '_', sid.lower())
    if 'forensic' in normKey: normKey = 'forensic_medicine'
    elif 'communit' in normKey or normKey == 'psm': normKey = 'community_medicine'
    elif 'anesth' in normKey: normKey = 'anaesthesia'
    elif 'otorhino' in normKey or normKey == 'ent': normKey = 'otorhinolaryngology__ent_'
    elif 'ophthal' in normKey: normKey = 'ophthalmology'
    elif 'biochem' in normKey: normKey = 'biochemistry'
    elif 'surg' in normKey: normKey = 'surgery'
    elif 'obstet' in normKey or 'gyn' in normKey: normKey = 'obstetrics___gynaecology'
    elif 'derma' in normKey: normKey = 'dermatology'
    elif 'path' in normKey: normKey = 'pathology'
    elif 'pharm' in normKey: normKey = 'pharmacology'
    elif 'micro' in normKey: normKey = 'microbiology'
    elif 'physio' in normKey: normKey = 'physiology'
    elif 'anat' in normKey: normKey = 'anatomy'
    elif 'radio' in normKey: normKey = 'radiology'

    subj_start = qb_text.find(f"{normKey}: {{")

    if subj_start != -1:
        block_end = qb_text.find("\n    },\n    ", subj_start)
        if block_end == -1:
            block_end = qb_text.find("\n    }\n  };", subj_start)
        if block_end == -1:
            block_end = subj_start + 100000
        
        subj_block = qb_text[subj_start:block_end]
        mcq_counts = [int(m) for m in re.findall(r'mcqCount:\s*(\d+)', subj_block)]
        topic_count = len(mcq_counts)
        total_mcqs = sum(mcq_counts)
        curated_total_topics += topic_count
        curated_total_mcqs += total_mcqs
        print(f"[CURATED] {sname:28} [{sid:26}] -> {topic_count:3} topics | {total_mcqs:5} MCQs")
    else:
        print(f"[DYNAMIC] {sname:28} [{sid:26}] -> (Dynamic generator via syllabus)")

print("=" * 75)
print(f"Total Curated Topics: {curated_total_topics} | Total Curated MCQs: {curated_total_mcqs}")
