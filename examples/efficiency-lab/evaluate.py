"""Audit request and task ledgers with Python's standard library.

No model calls, generated performance numbers, or external dependencies.
See README.md for timestamp, cohort, percentile, and cost conventions.
"""
import argparse
import json
import math
from collections import defaultdict
from pathlib import Path


def number(value, label, minimum=0):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < minimum:
        raise ValueError(f'{label}: expected finite number >= {minimum}')
    return value


def integer(value, label, minimum=0):
    number(value, label, minimum)
    if not isinstance(value, int):
        raise ValueError(f'{label}: expected integer')
    return value


def percentile(values, p):
    """Nearest-rank percentile; an empty sample is unknown, never zero."""
    if not values:
        return None
    return sorted(values)[max(0, math.ceil(p * len(values)) - 1)]


def distribution(values):
    return {'n': len(values), **{f'p{p}': percentile(values, p / 100) for p in (50, 95, 99)}}


def request_summary(rows, manifest):
    duration = number(manifest['duration_ms'], 'duration_ms', 1)
    expected = integer(manifest['planned_requests'], 'planned_requests', 1)
    if len(rows) != expected:
        raise ValueError('Request cohort incomplete: include failed, timed-out and cancelled requests')
    slo = manifest['slo_ms']
    for metric in ('ttft', 'tpot', 'e2e'):
        number(slo[metric], metric, 0)
    seen, ttfts, tpots, e2es, queues = set(), [], [], [], []
    successful = qualified = tokens = quality_known = quality_good = 0
    for row in rows:
        rid = row['request_id']
        if not isinstance(rid, str) or not rid or rid in seen:
            raise ValueError('Request IDs must be nonempty and unique')
        seen.add(rid)
        times = [number(row[k], k) for k in ('scheduled_ms', 'sent_ms', 'end_ms')]
        scheduled, sent, end = times
        if not scheduled <= sent <= end <= duration:
            raise ValueError(f'{rid}: invalid timestamp order or observation window')
        if type(row['success']) is not bool:
            raise ValueError(f'{rid}: success must be a boolean')
        output = integer(row['output_tokens'], 'output_tokens')
        quality = row.get('quality_pass')
        if quality is not None and type(quality) is not bool:
            raise ValueError(f'{rid}: quality_pass must be boolean or null')
        queues.append(sent - scheduled)
        if not row['success']:
            continue
        if output < 1:
            raise ValueError(f'{rid}: successful generation needs at least one output token')
        first = number(row['first_token_ms'], 'first_token_ms')
        last = number(row['last_token_ms'], 'last_token_ms')
        if not sent <= first <= last <= end:
            raise ValueError(f'{rid}: invalid token timestamps')
        if output == 1 and first != last:
            raise ValueError(f'{rid}: a single token has one arrival timestamp')
        ttft, e2e = first - scheduled, end - scheduled
        tpot = (last - first) / (output - 1) if output > 1 else None
        ttfts.append(ttft)
        e2es.append(e2e)
        if tpot is not None:
            tpots.append(tpot)
        successful += 1
        tokens += output
        meets = ttft <= slo['ttft'] and e2e <= slo['e2e'] and (tpot is None or tpot <= slo['tpot'])
        qualified += meets
        if quality is not None:
            quality_known += 1
            quality_good += meets and quality
    return {
        'cohort_requests': expected,
        'successful_requests': successful,
        'failure_rate': (expected - successful) / expected,
        'request_throughput_per_s': successful * 1000 / duration,
        'output_throughput_tokens_per_s': tokens * 1000 / duration,
        'slo_goodput_requests_per_s': qualified * 1000 / duration,
        'slo_attainment_all_requests': qualified / expected,
        'quality_evaluated_successful_requests': quality_known,
        'quality_and_slo_goodput_requests_per_s': quality_good * 1000 / duration if quality_known == successful and successful > 0 else None,
        'ttft_including_client_queue_ms': distribution(ttfts),
        'tpot_multi_token_requests_ms': distribution(tpots),
        'e2e_successful_requests_ms': distribution(e2es),
        'client_queue_all_requests_ms': distribution(queues),
    }


def task_summary(rows, manifest):
    deadline = number(manifest['task_deadline_ms'], 'task_deadline_ms', 1)
    strategies = manifest['strategies']
    tasks = manifest['task_ids']
    if not strategies or len(set(strategies)) != len(strategies) or not tasks or len(set(tasks)) != len(tasks):
        raise ValueError('Manifest needs unique, nonempty strategy and task lists')
    grouped = defaultdict(list)
    seen = set()
    for row in rows:
        key = (row['strategy'], row['task_id'])
        if key in seen or key[0] not in strategies or key[1] not in tasks:
            raise ValueError('Duplicate or unexpected task/strategy pair')
        seen.add(key)
        number(row['cost_units'], 'cost_units')
        number(row['latency_ms'], 'latency_ms')
        if type(row['success']) is not bool:
            raise ValueError('Task success must be a boolean from the final-state evaluator')
        if row['status'] not in ('completed', 'failed', 'timeout', 'cancelled'):
            raise ValueError('Unknown task status')
        if row['success'] and row['status'] != 'completed':
            raise ValueError('Unfinished task cannot be successful')
        grouped[row['strategy']].append(row)
    if seen != {(s, t) for s in strategies for t in tasks}:
        raise ValueError('Task cohort incomplete: every strategy must include every task, including failures')
    result = {}
    for strategy in strategies:
        group = grouped[strategy]
        successes = sum(r['success'] for r in group)
        qualified = sum(r['success'] and r['latency_ms'] <= deadline for r in group)
        cost = sum(r['cost_units'] for r in group)
        result[strategy] = {
            'tasks': len(group), 'successes': successes,
            'success_rate': successes / len(group),
            'success_within_deadline_rate': qualified / len(group),
            'total_cost_units': cost,
            'cost_per_success': cost / successes if successes else None,
            'cost_per_success_within_deadline': cost / qualified if qualified else None,
            'latency_all_attempts_ms': distribution([r['latency_ms'] for r in group]),
        }
    return result


def read_jsonl(path):
    return [json.loads(line) for line in Path(path).read_text(encoding='utf-8').splitlines() if line.strip()]


def evaluate(folder):
    folder = Path(folder)
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    return {
        'evidence_kind': manifest['evidence_kind'], 'cost_unit': manifest['cost_unit'],
        'percentile_method': 'nearest-rank; successful requests only unless explicitly labelled',
        'requests': request_summary(read_jsonl(folder / 'requests.jsonl'), manifest),
        'tasks': task_summary(read_jsonl(folder / 'tasks.jsonl'), manifest),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    parser.add_argument('--check', type=Path, help='Compare with a committed expected ledger result')
    args = parser.parse_args()
    result = evaluate(args.folder)
    if args.check:
        expected = json.loads(args.check.read_text(encoding='utf-8'))
        if result != expected:
            raise SystemExit('Ledger summary differs from expected result')
        print('PASS: deterministic teaching ledger; not a GPU or model benchmark')
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
