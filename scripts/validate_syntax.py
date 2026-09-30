def check_js_syntax(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        source = f.read()

    i = 0
    n = len(source)
    stack = []
    brackets = {'(': ')', '{': '}', '[': ']'}
    line = 1
    col = 1
    
    while i < n:
        ch = source[i]
        if ch == '\n':
            line += 1
            col = 1
            i += 1
            continue
            
        # Single line comment
        if ch == '/' and i + 1 < n and source[i+1] == '/':
            while i < n and source[i] != '\n':
                i += 1
            continue
            
        # Multi line comment
        if ch == '/' and i + 1 < n and source[i+1] == '*':
            i += 2
            while i + 1 < n and not (source[i] == '*' and source[i+1] == '/'):
                if source[i] == '\n':
                    line += 1
                    col = 1
                i += 1
            i += 2
            continue
            
        # Strings
        if ch in ('"', "'", '`'):
            quote = ch
            i += 1
            col += 1
            while i < n and source[i] != quote:
                if source[i] == '\\':
                    i += 2
                    col += 2
                else:
                    if source[i] == '\n':
                        line += 1
                        col = 1
                    else:
                        col += 1
                    i += 1
            i += 1
            col += 1
            continue
            
        if ch in '({[':
            stack.append((ch, line, col, i))
        elif ch in ')}]':
            if not stack:
                print(f"Unexpected closing {ch} at line {line}, col {col}, index {i}")
                return False
            top, t_line, t_col, t_idx = stack.pop()
            if ch != brackets[top]:
                print(f"Mismatched bracket: {top} from line {t_line}:{t_col} closed by {ch} at line {line}:{col}")
                return False
        i += 1
        col += 1
        
    if stack:
        print(f"Unclosed brackets left: {len(stack)}")
        for s in stack[:10]:
            print(f"  Unclosed {s[0]} at line {s[1]}:{s[2]}")
        return False
    print(f"Syntax check for {filename}: ALL BRACKETS MATCH CLEANLY!")
    return True

for fname in [
    'js/core/qbank-data.js',
    'js/core/qbank-store.js',
    'js/features/views/curriculum.js',
    'js/features/views/dashboard.js',
    'js/features/views/qbank.js',
    'js/features/views/mcq-practice.js',
    'app.js'
]:
    check_js_syntax(fname)
