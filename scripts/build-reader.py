"""Inline the shared reader into all articles; no runtime dependencies.

Run after editing chapter-reader.css/js. --check verifies generated files.
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import difflib
import re
import base64

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- chapter-reader:start -->'
END = '<!-- chapter-reader:end -->'
OLD_REVEAL = re.compile(r'<script>\s*\(function\(\)\{function reveal\(\).*?</script>', re.S)


class Updates(HTMLParser):
    """Record source offsets; preserve original article markup byte for byte."""
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.stack, self.edits = source, [], []
        self.lines = [0]
        for m in re.finditer('\n', source):
            self.lines.append(m.end())
        self.feed(source)

    def position(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            return
        a, pos = dict(attrs), self.position()
        update = tag == 'details' and 'data-research-updates' in a
        summary = tag == 'summary' and self.stack and self.stack[-1][2]
        if update:
            text = self.get_starttag_text().replace('<details', '<section', 1)
            self.edits.append((pos, pos + len(self.get_starttag_text()), text))
        if summary:
            self.edits.append((pos, pos + len(self.get_starttag_text()), '<h2>'))
        self.stack.append((tag, summary, update))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                _, summary, update = self.stack[i]
                if summary or update:
                    pos = self.position()
                    end = self.source.index('>', pos) + 1
                    self.edits.append((pos, end, '</h2>' if summary else '</section>'))
                del self.stack[i:]
                return


def preserve_lines(before, after, raw):
    """Retain mixed historical line endings in untouched source lines."""
    old, new, original = before.splitlines(True), after.splitlines(True), raw.splitlines(True)
    ending = '\r\n' if raw.count('\r\n') > raw.count('\n') / 2 else '\n'
    result = []
    for op, a, b, c, d in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        if op == 'equal':
            result.extend(original[a:b])
        else:
            result.extend(line.replace('\n', ending) for line in new[c:d])
    return ''.join(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    theme = (ROOT/'assets/reading-theme.css').read_text(encoding='utf-8').strip()
    font = base64.b64encode((ROOT/'assets/fonts/noto-sans-sc-headings.woff2').read_bytes()).decode('ascii')
    theme = theme.replace('url("fonts/noto-sans-sc-headings.woff2")', f'url("data:font/woff2;base64,{font}")')
    css = theme + '\n' + (ROOT/'scripts/chapter-reader.css').read_text(encoding='utf-8').strip()
    js = (ROOT/'scripts/chapter-reader.js').read_text(encoding='utf-8').strip()
    block = f'{START}\n<style id="chapter-reader-style">\n{css}\n</style>\n<script id="chapter-reader-script">\n{js}\n</script>\n{END}'
    changed = []
    articles = sorted((ROOT/'posts').glob('*.html'))
    for path in articles:
        raw = path.read_bytes().decode('utf-8')
        before = raw.replace('\r\n', '\n')
        source = before
        updates = Updates(source)
        for a, b, value in sorted(updates.edits, reverse=True):
            source = source[:a] + value + source[b:]
        source = re.sub(r'(<h2>更新附录[^<]*?)（展开选读）', r'\1', source)
        source = OLD_REVEAL.sub('', source)
        if START in source:
            source = re.sub(re.escape(START) + '.*?' + re.escape(END), lambda _: block, source, flags=re.S)
        else:
            source = source.replace('</body>', block + '\n</body>')
        if source != before:
            changed.append(path.name)
            if not args.check:
                path.write_bytes(preserve_lines(before, source, raw).encode('utf-8'))
    if args.check and changed:
        raise SystemExit('Reader is out of date: ' + ', '.join(changed))
    print(f'{"CHECK" if args.check else "BUILD"}: {len(articles)} standalone articles; {len(changed)} changed')


if __name__ == '__main__':
    main()
