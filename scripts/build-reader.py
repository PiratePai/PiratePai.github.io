"""Reference the versioned, same-origin reader from all articles.

Run after editing chapter-reader.css/js. --check verifies generated files.
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import re
import colorsys
from site_assets import asset_url, preserve_line_endings

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- chapter-reader:start -->'
END = '<!-- chapter-reader:end -->'
OLD_REVEAL = re.compile(r'<script>\s*\(function\(\)\{function reveal\(\).*?</script>', re.S)


def diagram_color(value, stroke=False):
    raw = value.lstrip('#')
    if len(raw) == 3:
        raw = ''.join(c * 2 for c in raw)
    rgb = [int(raw[i:i+2], 16) / 255 for i in (0, 2, 4)]
    h, light, saturation = colorsys.rgb_to_hls(*rgb)
    if saturation < .22 or max(rgb) - min(rgb) < .12:
        return 'var(--d-line)' if stroke else 'var(--d-surface)'
    hue = h * 360
    color = 'red' if hue < 15 or hue > 340 else 'amber' if hue < 75 else 'green' if hue < 185 else 'blue' if hue < 255 else 'purple'
    return 'var(--d-' + color + ('' if stroke else '-soft') + ')'


def style_diagrams(source, slug):
    """Give authored SVGs isolated styles and theme tokens; never alter paper images."""
    serial = 0
    def decorate(match):
        nonlocal serial
        serial += 1
        svg = match.group()
        opening = svg[:svg.index('>')+1]
        ident = re.search(r'\bid="([^"]+)"', opening)
        ident = ident[1] if ident else f'diagram-{slug}-{serial}'
        if 'data-handbook-diagram' not in opening:
            svg = svg.replace('<svg', f'<svg data-handbook-diagram="true"' + ('' if ' id=' in opening else f' id="{ident}"'), 1)
        def scope(m):
            css = re.sub(r'([^{}]+)\{', lambda x: ','.join(sel.strip() if sel.strip().startswith('#'+ident+' ') else '#'+ident+' '+sel.strip() for sel in x[1].split(','))+'{', m[1])
            return '<style>'+css+'</style>'
        svg = re.sub(r'<style[^>]*>(.*?)</style>', scope, svg, flags=re.S)
        svg = re.sub(r'\b(fill|stroke|stop-color)="(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)"', lambda m:m[1]+'="'+diagram_color(m[2],m[1]=='stroke')+'"', svg)
        svg = re.sub(r'\b(fill|stroke|stop-color)\s*:\s*(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)\b', lambda m:m[1]+':'+diagram_color(m[2],m[1]=='stroke'), svg)
        return svg
    return re.sub(r'<svg\b[^>]*>.*?</svg>', decorate, source, flags=re.S)


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    block = (f'{START}\n'
             f'<link rel="stylesheet" href="{asset_url("assets/reading-theme.css")}">\n'
             f'<link rel="stylesheet" id="chapter-reader-style" href="{asset_url("scripts/chapter-reader.css")}">\n'
             f'<script id="chapter-reader-script" src="{asset_url("scripts/chapter-reader.js")}"></script>\n{END}')
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
        source = style_diagrams(source, path.stem)
        if START in source:
            source = re.sub(re.escape(START) + '.*?' + re.escape(END), lambda _: block, source, flags=re.S)
        else:
            source = source.replace('</body>', block + '\n</body>')
        if source != before:
            changed.append(path.name)
            if not args.check:
                path.write_bytes(preserve_line_endings(raw, source).encode('utf-8'))
    if args.check and changed:
        raise SystemExit('Reader is out of date: ' + ', '.join(changed))
    print(f'{"CHECK" if args.check else "BUILD"}: {len(articles)} articles with shared reader; {len(changed)} changed')


if __name__ == '__main__':
    main()
