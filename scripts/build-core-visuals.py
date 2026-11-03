"""Reference shared deterministic diagrams in the four core articles."""
from pathlib import Path
import argparse, re
from site_assets import asset_url, preserve_line_endings
ROOT=Path(__file__).resolve().parents[1]
START,END='<!-- core-visuals:start -->','<!-- core-visuals:end -->'
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
 block=(f'{START}\n<link rel="stylesheet" href="{asset_url("scripts/core-visuals.css")}">\n'
        f'<script src="{asset_url("scripts/core-visuals.js")}"></script>\n{END}')
 changed=[]
 for path in (ROOT/'posts').glob('*.html'):
  raw=path.read_bytes().decode('utf8');s=raw.replace('\r\n','\n')
  if 'data-core-visual=' not in s:continue
  after=re.sub(re.escape(START)+'.*?'+re.escape(END),lambda _:block,s,flags=re.S) if START in s else s.replace('<!-- chapter-reader:start -->',block+'\n<!-- chapter-reader:start -->',1)
  if s!=after:
   changed.append(path.name)
   if not args.check:path.write_bytes(preserve_line_endings(raw, after).encode('utf8'))
 if args.check and changed:raise SystemExit('Core diagrams out of date: '+', '.join(changed))
 print(('CHECK' if args.check else 'BUILD')+f' core diagrams: {len(changed)} changed')
if __name__=='__main__':main()
