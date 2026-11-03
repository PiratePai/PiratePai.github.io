"""Content versions for shared, same-origin static resources."""
import hashlib
import difflib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def asset_url(path, prefix='../'):
    file = ROOT / path
    # Git checkouts use CRLF on Windows and LF on Linux; versions must agree.
    content = file.read_text(encoding='utf-8').encode('utf-8') if file.suffix in ('.css', '.js') else file.read_bytes()
    version = hashlib.sha256(content).hexdigest()[:12]
    return f'{prefix}{path}?v={version}'


def preserve_line_endings(original, updated):
    old, new = original.splitlines(True), updated.splitlines(True)
    old_keys = [line.rstrip('\r\n') for line in old]
    new_keys = [line.rstrip('\r\n') for line in new]
    result = []
    for op, a, b, c, d in difflib.SequenceMatcher(None, old_keys, new_keys, autojunk=False).get_opcodes():
        result.extend(old[a:b] if op == 'equal' else new[c:d])
    return ''.join(result)
