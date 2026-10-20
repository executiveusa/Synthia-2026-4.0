import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile, mkdir, readFile, cp, access } from 'node:fs/promises';
import { gauntletRun } from '../lib/gauntlet.js';
import { projectNew } from '../lib/project.js';
import { tempRepoRoot, REPO_ROOT } from './helpers.js';

test('gauntlet: stubbed exec, high finding fails, clean passes, report written', async () => {
  const root = await tempRepoRoot();
  const { projectPath } = await projectNew({ workflow: 'W1-trust-audit', clientSlug: 'g-client' }, root);
  await writeFile(path.join(projectPath, '02_audit', 'output', 'notes.md'), 'copy\n');
  await writeFile(path.join(projectPath, '01_inspect', 'output', 'skip-me.md'), 'ignored\n');

  const seen = [];
  const execDirty = async (file) => {
    seen.push(file);
    return JSON.stringify({ findings: [{ severity: 'high', rule: 'fake-proof' }] });
  };
  const dirty = await gauntletRun({ projectPath }, execDirty);
  assert.equal(dirty.ok, false);
  assert.equal(dirty.highCount, 1);
  assert.equal(dirty.results.length, 1, '01_inspect output is excluded');
  assert.ok(!seen.some((f) => f.includes('01_inspect')));

  const report = JSON.parse(await readFile(dirty.reportPath, 'utf8'));
  assert.equal(report.ok, false);
  assert.equal(report.results[0].highFindings, 1);

  const clean = await gauntletRun({ projectPath }, async () => JSON.stringify({ findings: [] }));
  assert.equal(clean.ok, true);
});

const EXTRACTOR = path.join(REPO_ROOT, 'upstream', 'the-extractor', 'extractor.mjs');
const SLOP = path.join(REPO_ROOT, 'upstream', 'the-extractor', 'tests', 'fixtures', 'slop.txt');

test('gauntlet: real the-extractor flags planted slop.txt, passes when removed', async (t) => {
  try {
    await access(EXTRACTOR);
    await access(SLOP);
  } catch {
    t.skip('upstream/the-extractor not bootstrapped');
    return;
  }
  const root = await tempRepoRoot();
  const { projectPath } = await projectNew({ workflow: 'W1-trust-audit', clientSlug: 'real-client' }, root);
  const target = path.join(projectPath, '02_audit', 'output', 'slop.txt');
  await cp(SLOP, target);

  const dirty = await gauntletRun({ projectPath, extractorPath: EXTRACTOR });
  assert.equal(dirty.ok, false, 'planted slop fails the gauntlet');
  assert.ok(dirty.highCount > 0);

  await writeFile(target, 'Plain honest sentence about the work.\n');
  const clean = await gauntletRun({ projectPath, extractorPath: EXTRACTOR });
  assert.equal(clean.ok, true, 'clean output passes');
});
