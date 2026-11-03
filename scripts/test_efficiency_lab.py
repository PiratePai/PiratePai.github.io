"""Regression cases where apparently better metrics hide failures or lost work."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'examples/efficiency-lab'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, LAB / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


metrics = module('metrics', 'evaluate.py')
recovery = module('recovery', 'recovery_demo.py')


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((LAB / 'synthetic/manifest.json').read_text())
        self.requests = metrics.read_jsonl(LAB / 'synthetic/requests.jsonl')
        self.tasks = metrics.read_jsonl(LAB / 'synthetic/tasks.jsonl')

    def test_failed_requests_remain_in_slo_denominator(self):
        result = metrics.request_summary(self.requests, self.manifest)
        self.assertEqual(result['failure_rate'], 1 / 6)
        self.assertEqual(result['slo_attainment_all_requests'], 3 / 6)
        self.assertEqual(result['slo_goodput_requests_per_s'], 0.3)
        self.assertEqual(result['quality_and_slo_goodput_requests_per_s'], 0.2)
        self.assertEqual(result['output_throughput_tokens_per_s'], 2.1)

    def test_single_token_has_no_tpot_and_missing_quality_is_unknown(self):
        self.requests[0]['quality_pass'] = None
        result = metrics.request_summary(self.requests, self.manifest)
        self.assertEqual(result['tpot_multi_token_requests_ms']['n'], 4)
        self.assertIsNone(result['quality_and_slo_goodput_requests_per_s'])
        self.assertEqual(result['ttft_including_client_queue_ms']['p99'], 450)

    def test_dropping_timeout_or_duplicate_request_is_rejected(self):
        with self.assertRaises(ValueError):
            metrics.request_summary(self.requests[:-1], self.manifest)
        self.requests[-1]['request_id'] = 'r1'
        with self.assertRaises(ValueError):
            metrics.request_summary(self.requests, self.manifest)

    def test_invalid_time_and_nan_do_not_silently_improve_results(self):
        for key, value in [('first_token_ms', -1), ('end_ms', 10001), ('output_tokens', 1.5), ('last_token_ms', float('nan'))]:
            rows = copy.deepcopy(self.requests)
            rows[0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                metrics.request_summary(rows, self.manifest)

    def test_failed_task_cost_is_not_discarded(self):
        result = metrics.task_summary(self.tasks, self.manifest)
        self.assertEqual(result['best-of-4']['total_cost_units'], 20)
        self.assertEqual(result['best-of-4']['cost_per_success'], 20 / 3)
        self.assertEqual(result['adaptive']['cost_per_success'], 4)

    def test_incomplete_task_cohort_and_successful_timeout_are_rejected(self):
        with self.assertRaises(ValueError):
            metrics.task_summary(self.tasks[:-1], self.manifest)
        self.tasks[7]['success'] = True
        with self.assertRaises(ValueError):
            metrics.task_summary(self.tasks, self.manifest)

    def test_zero_success_is_not_zero_cost(self):
        for row in self.tasks:
            row['success'] = False
        result = metrics.task_summary(self.tasks, self.manifest)
        self.assertIsNone(result['single']['cost_per_success'])
        self.assertEqual(result['single']['total_cost_units'], 4)

    def test_committed_teaching_result(self):
        expected = json.loads((LAB / 'synthetic/expected.json').read_text(encoding='utf-8'))
        self.assertEqual(metrics.evaluate(LAB / 'synthetic'), expected)


class RecoveryTests(unittest.TestCase):
    def test_replay_after_tool_commit_preserves_single_effect(self):
        with tempfile.TemporaryDirectory() as folder:
            recovery.initialize(folder)
            with self.assertRaises(recovery.InjectedCrash):
                recovery.advance(folder, crash_after_tool=True)
            self.assertEqual(recovery.snapshot(folder), {'business_effect': 1, 'checkpoint_status': 'pending'})
            receipt = recovery.advance(folder)
            self.assertEqual(recovery.advance(folder), receipt)
            self.assertEqual(recovery.snapshot(folder), {'business_effect': 1, 'checkpoint_status': 'completed'})

    def test_same_id_different_action_is_not_silently_accepted(self):
        with tempfile.TemporaryDirectory() as folder:
            recovery.initialize(folder)
            recovery.mock_tool(folder, 'task-1/step-1', 1)
            with self.assertRaises(ValueError):
                recovery.mock_tool(folder, 'task-1/step-1', 2)
            self.assertEqual(recovery.snapshot(folder)['business_effect'], 1)


if __name__ == '__main__':
    unittest.main()
