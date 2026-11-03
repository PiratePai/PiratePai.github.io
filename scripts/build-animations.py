"""Load the shared animation runtime before the inline article demos."""
import argparse, re
from pathlib import Path
from site_assets import asset_url, preserve_line_endings
ROOT = Path(__file__).resolve().parents[1]
START, END = '<!-- efficient-animations:start -->', '<!-- efficient-animations:end -->'
def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--check', action='store_true'); args = parser.parse_args()
    # Deliberately parser-blocking: later inline demos depend on PaiMotion.
    block = START+'\n<script src="'+asset_url('scripts/efficient-animations.js')+'"></script>\n'+END
    changed = []
    for path in sorted((ROOT/'posts').glob('*.html')):
        raw = path.read_bytes().decode('utf-8'); before = raw.replace('\r\n', '\n')
        if 'PaiMotion.' not in before: continue
        if START in before:
            after = re.sub(re.escape(START)+'.*?'+re.escape(END), lambda _:block, before, flags=re.S)
        else: after = before.replace('</head>',block+'\n</head>',1)
        if after != before:
            changed.append(path.name)
            if not args.check:
                path.write_bytes(preserve_line_endings(raw, after).encode('utf-8'))
    if args.check and changed: raise SystemExit('Animation runtime out of date: '+', '.join(changed))
    print(('Checked' if args.check else 'Built')+' animation runtime; '+str(len(changed))+' changed')
if __name__ == '__main__': main()
