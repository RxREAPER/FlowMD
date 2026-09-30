import re

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('ophthalmology:')
if idx != -1:
    print(text[idx:idx+800])
else:
    print("ophthalmology: not found")
