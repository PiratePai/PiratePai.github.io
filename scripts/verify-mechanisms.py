"""Small CPU-only examples for the surveys; no model-performance claims.

Run: python scripts/verify-mechanisms.py
Uses only the standard library. Sampling checks one fixed-context distribution;
it does not prove a sequence decoder or an adaptive production scheduler correct.
"""
import math
import random


def transpose(a):
    return [list(row) for row in zip(*a)]


def matmul(a, b):
    assert len(a[0]) == len(b), "incompatible matrix shapes"
    return [[sum(x*y for x, y in zip(row, col)) for col in zip(*b)] for row in a]


def close(a, b, tolerance=1e-11):
    assert len(a) == len(b)
    for x, y in zip(a, b):
        if isinstance(x, list):
            close(x, y, tolerance)
        else:
            assert abs(x-y) <= tolerance, (x, y)


def verify_linear_attention():
    rng = random.Random(42)
    q, k = [[[rng.uniform(-1, 1) for _ in range(3)] for _ in range(6)] for _ in range(2)]
    v = [[rng.uniform(-1, 1) for _ in range(2)] for _ in range(6)]
    phi = lambda x: x + 1 if x > 0 else math.exp(x)  # ELU(x)+1
    q, k = [[list(map(phi, row)) for row in tensor] for tensor in (q, k)]
    parallel = []
    for t, qt in enumerate(q):
        scores = [sum(a*b for a, b in zip(qt, kj)) for kj in k[:t+1]]
        parallel.append([sum(scores[j]*v[j][d] for j in range(t+1))/sum(scores) for d in range(2)])
    state, normalizer, recurrent = [[0.0]*2 for _ in range(3)], [0.0]*3, []
    for qt, kt, vt in zip(q, k, v):
        for d in range(3):
            normalizer[d] += kt[d]
            for c in range(2):
                state[d][c] += kt[d]*vt[c]
        denom = sum(a*b for a, b in zip(qt, normalizer))
        recurrent.append([sum(qt[d]*state[d][c] for d in range(3))/denom for c in range(2)])
    close(parallel, recurrent)
    print("PASS normalized causal kernel attention: recurrent == parallel")


def verify_gated_delta():
    # Paper orientation S:[d_v,d_k], deliberately non-square.
    s, k, v = [[0.2, -0.5, 0.8], [0.7, 0.1, -0.3]], [0.3, 0.4, 0.2], [0.6, -0.2]
    alpha, beta = 0.8, 0.25
    right = [[(1 if i == j else 0)-beta*k[i]*k[j] for j in range(3)] for i in range(3)]
    product = matmul(s, right)
    matrix = [[alpha*product[i][j]+beta*v[i]*k[j] for j in range(3)] for i in range(2)]
    old_read = [sum(a*b for a, b in zip(row, k)) for row in s]
    error_form = [[alpha*s[i][j]+beta*(v[i]-alpha*old_read[i])*k[j] for j in range(3)] for i in range(2)]
    close(matrix, error_form)
    print("PASS Gated DeltaNet right-multiplication == gated error update")


def verify_awq_and_quantization():
    x, w, scales = [[1, 2, -1], [0.5, 1, 3]], [[1, 4], [2, -1], [3, 0.5]], [2, 0.5, 4]
    xs = [[a/scales[i] for i, a in enumerate(row)] for row in x]
    sw = [[a*scales[i] for a in row] for i, row in enumerate(w)]
    close(matmul(x, w), matmul(xs, sw))
    values = [-2, -0.8, 0.2, 1.6]
    signed = [max(-2, min(1, round(x))) for x in values]
    unsigned = [max(0, min(3, round(x)+2)) for x in values]
    assert signed == [-2, -1, 0, 1] == [x-2 for x in unsigned]
    print("PASS AWQ scaling before quantization; signed/unsigned encoding agreement")


def verify_sampling():
    p, q = [0.5, 0.3, 0.1, 0.05, 0.05], [0.6, 0.2, 0.1, 0.05, 0.05]
    overlap = sum(min(a, b) for a, b in zip(p, q))
    residual = [max(0, a-b) for a, b in zip(p, q)]
    # Exact probability mass decomposition: accepted mass + rejected mass.
    result = [min(a, b)+(1-overlap)*r/sum(residual) for a, b, r in zip(p, q, residual)]
    close(result, p)
    rng, counts, accepted = random.Random(1234), [0]*len(p), 0
    for _ in range(100_000):
        candidate = rng.choices(range(len(q)), weights=q)[0]
        if rng.random() < min(1, p[candidate]/q[candidate]):
            token = candidate
            accepted += 1
        else:
            token = rng.choices(range(len(p)), weights=residual)[0]
        counts[token] += 1
    close([n/100_000 for n in counts], p, 0.004)
    assert abs(accepted/100_000-overlap) < 0.004
    print("PASS single-context rejection sampling: exact mass identity + empirical frequency/acceptance")


def verify_budgets():
    # MoE auxiliary loss: a valid top-1 counterexample to the alleged lower bound.
    probs = [(0.51, 0.49)]*4+[(0.01, 0.99)]
    loads = [sum(row.index(max(row)) == i for row in probs)/len(probs) for i in range(2)]
    means = [sum(row[i] for row in probs)/len(probs) for i in range(2)]
    close([2*sum(f*p for f, p in zip(loads, means))], [0.892])
    assert 2*sum(f*p for f, p in zip(loads, means)) < 1
    expert = 40*384*3*5120*2304
    weight_gb = expert*0.5/1e9+(552.7-expert/1e9)
    assert abs(weight_gb-280.91) < 0.01
    for tokens, expected in [(16400, 1.044), (37800, 3.568)]:
        pf = (2*20.1e9*tokens+4*tokens*tokens*7168*50)/1e15
        assert abs(pf-expected) < 0.001
    e = sum(0.9**i for i in range(8))
    close([e], [(1-0.9**8)/(1-0.9)])
    assert abs(e/1.7-3.35) < 0.001
    assert 2*4096*32*8*128*2 == 512*1024**2
    assert abs(7/23-0.30435) < 0.00001
    print("PASS load-loss counterexample, weight/DiT/KV/bubble/speculation budgets")


if __name__ == '__main__':
    verify_linear_attention()
    verify_gated_delta()
    verify_awq_and_quantization()
    verify_sampling()
    verify_budgets()
