import codecs

try:
    with codecs.open('src/index.css', 'r', encoding='mbcs', errors='ignore') as f:
        content = f.read()
except:
    with codecs.open('src/index.css', 'r', encoding='utf-16', errors='ignore') as f:
        content = f.read()

with codecs.open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
