"""Build the static article/section search index, without third-party packages."""

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'search-index.json'


def clean(text):
    return re.sub(r'\s+', ' ', text).strip()


class Article(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.heading = None
        self.title = ''
        self.sections = []
        self.current = None
        self.feed(source)
        self.flush()

    def blocked(self):
        return any(blocked for _, blocked, _ in self.stack)

    def flush(self):
        if self.current:
            self.current['text'] = clean(' '.join(self.current['parts']))
            self.current.pop('parts')
            self.sections.append(self.current)
        self.current = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        blocked = tag in ('style', 'script', 'svg', 'nav', 'footer', 'noscript', 'template')
        classes = attrs.get('class', '').split()
        blocked |= any(c in ('toc', 'reader-ui', 'meta') for c in classes)
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append((tag, blocked, attrs.get('id', '')))
        if not self.blocked() and tag in ('h1', 'h2', 'h3', 'h4'):
            anchor = attrs.get('id', '')
            if not anchor and tag == 'h2':
                anchor = next((id for parent, _, id in reversed(self.stack) if parent in ('section', 'article') and id), '')
            self.heading = {'tag': tag, 'id': anchor, 'parts': []}

    def handle_endtag(self, tag):
        if self.heading and tag == self.heading['tag']:
            heading = clean(' '.join(self.heading['parts']))
            anchor = self.heading['id']
            if tag == 'h1':
                self.title = heading
            elif anchor and anchor != 'refs':
                self.flush()
                self.current = {'heading': heading, 'anchor': anchor, 'parts': []}
            elif tag == 'h2' and anchor == 'refs':
                self.flush()
            elif self.current:
                self.current['parts'].append(heading)
            self.heading = None
        if self.current and tag in ('p', 'div', 'li', 'td', 'pre', 'h2', 'h3', 'h4'):
            self.current['parts'].append(' ')
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if self.blocked():
            return
        if self.heading:
            self.heading['parts'].append(data)
        elif self.current:
            self.current['parts'].append(data)


def build():
    documents = []
    for path in sorted((ROOT / 'posts').glob('*.html')):
        source = path.read_text(encoding='utf-8')
        article = Article(source)
        if not article.title or not article.sections:
            raise ValueError(f'Article has no title or searchable sections: {path.name}')
        documents.append({
            'url': 'posts/' + path.name,
            'title': article.title,
            'sourceHash': hashlib.sha256(source.encode('utf-8')).hexdigest(),
            'sections': article.sections,
        })
    return json.dumps({'version': 1, 'documents': documents}, ensure_ascii=False, separators=(',', ':')) + '\n'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    output = build()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != output:
            raise SystemExit('Search index is stale; run python scripts/build-search-index.py')
    else:
        OUTPUT.write_text(output, encoding='utf-8', newline='\n')
    count = len(json.loads(output)['documents'])
    print(f'PASS search index: {count} articles, {len(output.encode("utf-8")):,} bytes')
