import re

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's split by subjects
subject_splits = re.split(r'\{\s*"id":\s*"([a-zA-Z0-9_]+)",\s*"subject":\s*"([^"]+)"', text)

# subject_splits[0] is header
for i in range(1, len(subject_splits), 3):
    s_id = subject_splits[i]
    s_name = subject_splits[i+1]
    s_body = subject_splits[i+2]
    
    # count chapters
    chaps = re.findall(r'"name":\s*"([A-Z0-9\s,&()–-]+)"', s_body)
    vids = re.findall(r'"id":\s*"([a-zA-Z0-9_]+__v\d+)"', s_body)
    print(f"Subject: {s_name} ({s_id}) -> {len(chaps)} chapters, {len(vids)} videos")
    if s_id in ['medicine', 'paediatrics', 'orthopaedics', 'psychiatry']:
        for c in chaps:
            print(f"   Chapter: {c}")
