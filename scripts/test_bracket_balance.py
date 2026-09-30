def check_brackets(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    in_string = None
    in_comment = False
    escape = False
    
    # Quick sanity check on balance
    counts = {
        '{': code.count('{'), '}': code.count('}'),
        '[': code.count('['), ']': code.count(']'),
        '(': code.count('('), ')': code.count(')')
    }
    print(f"{filename} bracket balance: {counts}")
    return counts['{'] == counts['}'] and counts['['] == counts[']'] and counts['('] == counts[')']

files = [
    'js/core/qbank-data.js',
    'js/core/qbank-store.js',
    'js/features/views/qbank.js',
    'js/features/views/mcq-practice.js',
    'js/features/views/curriculum.js',
    'js/features/views/subject-detail.js',
    'js/features/views/dashboard.js'
]

for f in files:
    bal = check_brackets(f)
    print(f" - {f}: {'BALANCED' if bal else 'CHECK NEEDED'}")
