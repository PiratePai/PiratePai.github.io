"""Validate local links/assets, unique anchors and inline JavaScript syntax.

Run from any directory: python scripts/check-site.py
Requires Python standard library and Node.js (for JavaScript syntax only).
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from collections import Counter
import subprocess
import tempfile
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links, self.assets, self.scripts = path, [], [], [], []
        self.script = None
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if a.get('src'):
            self.assets.append(a['src'])
        if tag == 'link' and a.get('rel') in ('stylesheet', 'preload', 'icon'):
            self.assets.append(a['href'])
        if tag == 'script' and not a.get('src') and a.get('type', '') not in ('application/json', 'application/ld+json'):
            self.script = ''

    def handle_data(self, data):
        if self.script is not None:
            self.script += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(self.script)
            self.script = None


def main():
    pages = {p.resolve(): Page(p) for p in [ROOT/'index.html', *sorted((ROOT/'posts').glob('*.html'))]}
    errors, script_count = [], 0
    for path, page in pages.items():
        for id, count in Counter(page.ids).items():
            if count > 1:
                errors.append(f'{path.name}: duplicate id {id}')
        for link in page.links + page.assets:
            u = urlsplit(link)
            if u.scheme or u.netloc or not u.path and not u.fragment:
                continue
            target = (ROOT/u.path.lstrip('/') if u.path.startswith('/') else path.parent/unquote(u.path)).resolve() if u.path else path
            if not target.exists():
                errors.append(f'{path.name}: missing local target {link}')
            elif u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
                errors.append(f'{path.name}: missing anchor {link}')
            elif target.suffix.lower() == '.svg':
                try:
                    if ET.parse(target).getroot().tag != '{http://www.w3.org/2000/svg}svg':
                        errors.append(f'{path.name}: missing SVG namespace in {link}')
                except ET.ParseError as error:
                    errors.append(f'{path.name}: invalid SVG {link}: {error}')
        for source in page.scripts:
            if not source.strip():
                continue
            with tempfile.TemporaryDirectory() as temp:
                js = Path(temp)/'inline.js'
                js.write_text(source, encoding='utf-8')
                result = subprocess.run(['node', '--check', str(js)], capture_output=True, text=True, encoding='utf-8')
                if result.returncode:
                    errors.append(f'{path.name}: JavaScript syntax: {result.stderr}')
            script_count += 1
    if errors:
        print('\n'.join(errors))
        return 1
    for js in sorted((ROOT / 'scripts').glob('*.js')):
        result = subprocess.run(['node', '--check', str(js)], capture_output=True, text=True, encoding='utf-8')
        if result.returncode:
            print(result.stderr)
            return 1
    print(f'PASS {len(pages)} pages: local links/assets, unique anchors, {script_count} inline blocks and shared JavaScript syntax')
    return 0


if __name__ == '__main__':
    sys.exit(main())
