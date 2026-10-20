import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { projectNew, projectStatus, bookmarksImport, lineToSlug } from '../lib/project.js';
import { loadFixtureCatalog, tempRepoRoot, tempDir, FIXTURES } from './helpers.js';

test('project_new W1 creates all 7 stage folders, then refuses a second run', async () => {
  const root = await tempRepoRoot();
  const created = await projectNew({ workflow: 'W1-trust-audit', clientSlug: 'test-client' }, root);
  assert.deepEqual(created.stages, ['00_lock', '01_inspect', '02_audit', '05_gauntlet', '06_approval', '07_deliver', '08_learn']);
  const entries = await readdir(created.projectPath, { withFileTypes: true });
  const stageDirs = entries.filter((e) => e.isDirectory() && /^\d\d_/.test(e.name));
  assert.equal(stageDirs.length, 7);
  await assert.rejects(() => projectNew({ workflow: 'W1-trust-audit', clientSlug: 'test-client' }, root), /already exists/);
});

test('project_new refuses planned workflows (no stage folders) and bad slugs', async () => {
  const root = await tempRepoRoot();
  await mkdir(path.join(root, 'workflows', 'W2-landing-page'), { recursive: true });
  await writeFile(path.join(root, 'workflows', 'W2-landing-page', 'README.md'), 'planned\n');
  await assert.rejects(() => projectNew({ workflow: 'W2-landing-page', clientSlug: 'acme' }, root), /no stage folders/);
  await assert.rejects(() => projectNew({ workflow: 'W1-trust-audit', clientSlug: 'Bad Slug!' }, root), /lowercase/);
});

test('project_status lists pending stages, done after output, and the approval violation', async () => {
  const root = await tempRepoRoot();
  const { projectPath } = await projectNew({ workflow: 'W1-trust-audit', clientSlug: 'stat-client' }, root);

  const initial = await projectStatus({ projectPath });
  assert.equal(initial.stages.length, 7);
  assert.ok(initial.stages.every((s) => s.state === 'pending'));
  assert.deepEqual(initial.violations, []);

  await writeFile(path.join(projectPath, '01_inspect', 'output', 'notes.md'), 'baseline\n');
  const afterWork = await projectStatus({ projectPath });
  assert.equal(afterWork.stages.find((s) => s.stage === '01_inspect').state, 'done');

  await writeFile(path.join(projectPath, '07_deliver', 'output', 'final.md'), 'shipped\n');
  const violation = await projectStatus({ projectPath });
  assert.equal(violation.violations.length, 1);
  assert.match(violation.violations[0], /VIOLATION/);

  await writeFile(path.join(projectPath, '06_approval', 'output', 'APPROVAL.md'), 'approved\n');
  const approved = await projectStatus({ projectPath });
  assert.deepEqual(approved.violations, []);
});

test('lineToSlug accepts slugs and video URLs, skips blanks and comments', () => {
  assert.equal(lineToSlug('kinetic-type-reel'), 'kinetic-type-reel');
  assert.equal(lineToSlug('https://motionvideo.xyz/v/soft-3d-product-spin'), 'soft-3d-product-spin');
  assert.equal(lineToSlug('https://motionvideo.xyz/v/slug-x?utm=share'), 'slug-x');
  assert.equal(lineToSlug('   '), null);
  assert.equal(lineToSlug('# comment'), null);
});

test('bookmarks_import appends 2 ledger rows and reports 1 unmatched line', async () => {
  const { videos } = await loadFixtureCatalog();
  const projectPath = await tempDir('synthia-proj-');
  const result = await bookmarksImport({ file: path.join(FIXTURES, 'bookmarks.txt'), projectPath }, videos);
  assert.deepEqual(result.matched.sort(), ['kinetic-type-reel', 'soft-3d-product-spin']);
  assert.deepEqual(result.unmatched, ['not-a-real-slug-zzz']);

  const ledger = await import('node:fs/promises').then((fs) => fs.readFile(result.ledgerPath, 'utf8'));
  assert.equal((ledger.match(/^REFERENCE: /gm) ?? []).length, 2);
  assert.equal((ledger.match(/^PRINCIPLE TO EXTRACT:$/gm) ?? []).length, 2);
  assert.equal((ledger.match(/^COPYING RISK:$/gm) ?? []).length, 2);
  assert.match(ledger, /motionvideo\.xyz/);
});

test('resolveWorkflow reads workflows from disk: short id, full name, planned and unknown', async () => {
  const { resolveWorkflow } = await import('../lib/project.js');
  const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  assert.equal(await resolveWorkflow('W1', repo), 'W1-trust-audit');
  assert.equal(await resolveWorkflow('W7', repo), 'W7-commercial');
  assert.equal(await resolveWorkflow('W7-commercial', repo), 'W7-commercial');
  await assert.rejects(() => resolveWorkflow('W2', repo), /planned, not built/);
  await assert.rejects(() => resolveWorkflow('W99', repo), /unknown workflow/);
  await assert.rejects(() => resolveWorkflow('rm -rf', repo), /must look like/);
});
