"""Local crash recovery demo, not an Agent or remote service benchmark.

The mock tool atomically stores the business effect and its idempotency key.
The Agent checkpoint lives in a separate SQLite database. A crash between the
two commits demonstrates why checkpointing alone is insufficient.
"""
import json
from contextlib import contextmanager
from pathlib import Path
import sqlite3
import tempfile


class InjectedCrash(RuntimeError):
    pass


@contextmanager
def database(path):
    connection = sqlite3.connect(path)
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialize(folder):
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    with database(folder / 'tool.sqlite') as db:
        db.execute('CREATE TABLE IF NOT EXISTS effects (action_key TEXT PRIMARY KEY, amount INTEGER NOT NULL, receipt TEXT NOT NULL)')
    with database(folder / 'agent.sqlite') as db:
        db.execute('CREATE TABLE IF NOT EXISTS steps (action_key TEXT PRIMARY KEY, amount INTEGER NOT NULL, status TEXT NOT NULL, receipt TEXT)')


def mock_tool(folder, action_key, amount):
    """One database transaction covers both the simulated effect and dedup."""
    with database(Path(folder) / 'tool.sqlite') as db:
        db.execute('BEGIN IMMEDIATE')
        old = db.execute('SELECT amount, receipt FROM effects WHERE action_key = ?', (action_key,)).fetchone()
        if old:
            if old[0] != amount:
                raise ValueError('Same logical action key cannot identify a different payload')
            return old[1]
        receipt = f'receipt:{action_key}'
        db.execute('INSERT INTO effects VALUES (?, ?, ?)', (action_key, amount, receipt))
        return receipt


def advance(folder, crash_after_tool=False):
    folder = Path(folder)
    # Stable logical action ID. A real runtime persists this before dispatch.
    key, amount = 'task-1/step-1', 1
    with database(folder / 'agent.sqlite') as db:
        db.execute('INSERT OR IGNORE INTO steps VALUES (?, ?, ?, NULL)', (key, amount, 'pending'))
        step = db.execute('SELECT action_key, amount, status, receipt FROM steps WHERE action_key = ?', (key,)).fetchone()
    if step[2] == 'completed':
        return step[3]
    receipt = mock_tool(folder, step[0], step[1])
    if crash_after_tool:
        raise InjectedCrash('Tool committed; Agent result checkpoint not yet committed')
    with database(folder / 'agent.sqlite') as db:
        db.execute('UPDATE steps SET status = ?, receipt = ? WHERE action_key = ?', ('completed', receipt, key))
    return receipt


def snapshot(folder):
    folder = Path(folder)
    with database(folder / 'tool.sqlite') as db:
        effects = db.execute('SELECT COALESCE(SUM(amount), 0) FROM effects').fetchone()[0]
    with database(folder / 'agent.sqlite') as db:
        status = db.execute('SELECT status FROM steps WHERE action_key = ?', ('task-1/step-1',)).fetchone()
    return {'business_effect': effects, 'checkpoint_status': status[0] if status else None}


def demo():
    with tempfile.TemporaryDirectory(prefix='agent-recovery-') as directory:
        initialize(directory)
        try:
            advance(directory, crash_after_tool=True)
        except InjectedCrash:
            pass
        interrupted = snapshot(directory)
        advance(directory)
        recovered = snapshot(directory)
        assert interrupted == {'business_effect': 1, 'checkpoint_status': 'pending'}
        assert recovered == {'business_effect': 1, 'checkpoint_status': 'completed'}
        return {'evidence_kind': 'local Python/SQLite fault injection; no LLM or remote API',
                'after_crash': interrupted, 'after_recovery': recovered}


if __name__ == '__main__':
    print(json.dumps(demo(), indent=2))
