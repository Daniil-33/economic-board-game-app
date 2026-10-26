import test from 'node:test';
import assert from 'node:assert/strict';
import { REVIEW_AXES } from '../review/contracts.mjs';
import { runReviewOrchestration } from '../review/orchestrator.mjs';

const input = {
  schemaVersion: 1,
  repository: 'example/project',
  prNumber: 3,
  baseSHA: 'a'.repeat(40),
  headSHA: 'b'.repeat(40),
  diffDigest: 'c'.repeat(64),
  policyRevision: 'd'.repeat(40),
  specRevision: 'e'.repeat(40),
  adrRevision: 'f'.repeat(40),
  knowledgeLockDigest: 'a'.repeat(64),
  applicability: 'infrastructure',
};
const limits = { maxConcurrent: 3, timeoutMs: 100, maxTechnicalRetries: 1 };
function report(axis, runId = 'run-1') {
  return {
    schemaVersion: 1,
    runId,
    axis,
    reviewer: {
      id: axis + '-worker',
      model: 'fixture',
      configDigest: '1'.repeat(64),
      promptDigest: '2'.repeat(64),
    },
    input: structuredClone(input),
    startedAt: '2026-10-26T12:00:00.000Z',
    completedAt: '2026-10-26T12:00:01.000Z',
    coverage: ['fixture'],
    gaps: [],
    disposition: 'pass',
    reason: 'fixture review',
    evidence: [{ kind: 'observed', reference: 'fixture', claim: 'fixture evidence' }],
    findings: [],
  };
}
function workers(fn = (axis) => report(axis)) {
  return Object.fromEntries(REVIEW_AXES.map((axis) => [axis, () => fn(axis)]));
}

test('runs all six workers with bounded concurrency and completes a valid set', async () => {
  let active = 0;
  let peak = 0;
  const result = await runReviewOrchestration({
    input,
    runId: 'run-1',
    limits,
    workers: workers(async (axis) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return report(axis);
    }),
  });
  assert.equal(result.state, 'complete');
  assert.equal(result.reports.length, 6);
  assert.ok(peak <= 3);
  assert.deepEqual(Object.values(result.attempts), [1, 1, 1, 1, 1, 1]);
});

test('retries one technical failure but never retries a malformed report into success', async () => {
  let calls = 0;
  const result = await runReviewOrchestration({
    input,
    runId: 'run-1',
    limits,
    workers: workers(async (axis) => {
      if (axis === 'design' && calls++ === 0) throw new Error('transient');
      return report(axis);
    }),
  });
  assert.equal(result.state, 'complete');
  assert.equal(result.attempts.design, 2);
  const invalid = workers((axis) => {
    const r = report(axis);
    if (axis === 'security') r.runId = 'wrong';
    return r;
  });
  const blocked = await runReviewOrchestration({ input, runId: 'run-1', limits, workers: invalid });
  assert.equal(blocked.state, 'blocked');
  assert.ok(blocked.failures.some((item) => item.axis === 'security'));
});

test('timeouts and missing reports block, while changed inputs supersede the run', async () => {
  const slow = workers(async (axis) => {
    if (axis === 'performance') await new Promise((resolve) => setTimeout(resolve, 500));
    return report(axis);
  });
  const blocked = await runReviewOrchestration({ input, runId: 'run-1', limits, workers: slow });
  assert.equal(blocked.state, 'blocked');
  assert.ok(blocked.failures.some((item) => item.axis === 'performance'));
  let current = true;
  const superseded = await runReviewOrchestration({
    input,
    runId: 'run-2',
    limits,
    workers: workers((axis) => report(axis, 'run-2')),
    isCurrent: async () => current,
  });
  assert.equal(superseded.state, 'complete');
  current = false;
  const after = await runReviewOrchestration({
    input,
    runId: 'run-3',
    limits,
    workers: workers((axis) => report(axis, 'run-3')),
    isCurrent: async () => current,
  });
  assert.equal(after.state, 'superseded');
});

test('rejects unsafe limits and does not expose worker errors', async () => {
  await assert.rejects(
    () =>
      runReviewOrchestration({
        input,
        runId: 'run-1',
        limits: { ...limits, maxConcurrent: 4 },
        workers: workers(),
      }),
    /limits.maxConcurrent/,
  );
  const result = await runReviewOrchestration({
    input,
    runId: 'run-1',
    limits,
    workers: workers(() => {
      throw new Error('PRIVATE_CANARY');
    }),
  });
  assert.equal(result.state, 'blocked');
  assert.ok(!JSON.stringify(result).includes('PRIVATE_CANARY'));
});
