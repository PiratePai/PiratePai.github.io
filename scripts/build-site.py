"""Rebuild shared asset references, editorial metadata and search artifacts."""
import argparse
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
scripts = Path(__file__).resolve().parent
for name in ('build-animations.py', 'build-core-visuals.py', 'build-reader.py', 'build-metadata.py', 'build-search-index.py'):
    subprocess.run([sys.executable, str(scripts / name), *(['--check'] if args.check else [])], check=True)
