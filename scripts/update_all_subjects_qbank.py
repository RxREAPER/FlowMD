import json, re

def update_all():
    with open('js/core/qbank-data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Deduplicate repeated biochemistry blocks
    # Find all occurrences of biochemistry: {
    first_bio = content.find("    biochemistry: {")
    if first_bio != -1:
        second_bio = content.find("    biochemistry: {", first_bio + 20)
        if second_bio != -1:
            third_bio = content.find("    biochemistry: {", second_bio + 20)
            # Find the end of third_bio
            end_search = third_bio if third_bio != -1 else second_bio
            # Find the closing of this block before '  };'
            closing = content.find("\n  };", end_search)
            if closing != -1:
                content = content[:second_bio].rstrip().rstrip(',') + '\n' + content[closing:]

    with open('js/core/qbank-data.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Successfully deduplicated qbank-data.js!")

if __name__ == '__main__':
    update_all()
