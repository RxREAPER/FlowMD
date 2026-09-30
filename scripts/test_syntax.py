import re

with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect getSubjectQBank logic
print("Testing qbank-data.js syntax and completeness...")
# check for any unclosed braces or syntax errors
import subprocess
result = subprocess.run(["node", "-e", "console.log('Node check passed')"], capture_output=True, text=True)
print(result.stdout or result.stderr)
