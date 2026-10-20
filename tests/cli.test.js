import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadFixtureCatalog, tempDir, REPO_ROOT } from './helpers.js';

const run = promisify(execFile);
const CLI = path.join(REPO_ROOT, 'cli', 'synthia.js');

// Seeds a fresh cache in a temp cwd so the CLI never touches the network.
async function seededCwd() {
  const cwd = await tempDir('synthia-cli-');
  const data = await loadFixtureCatalog();
  await mkdir(path.join(cwd, '.cache'), { recursive: true });
  await writeFile(
    path.join(cwd, '.cache', 'motion-catalog.json'),
    JSON.stringify({ fetchedAt: Date.now(), importedAt: data.importedAt, videos: data.videos })
  );
  return cwd;
}

test('cli: motion search returns <= --limit items with slug and preview, from cache', async () => {
  const cwd = await seededCwd();
  const { stdout } = await run('node', [CLI, 'motion', 'search', 'kinetic type', '--limit', '5'], { cwd });
  const results = JSON.parse(stdout);
  assert.equal(results.length, 2);
  assert.ok(results.length <= 5);
  for (const r of results) {
    assert.ok(r.slug);
    assert.ok(r.preview);
  }
});

test('cli: motion get returns one full catalog item', async () => {
  const cwd = await seededCwd();
  const { stdout } = await run('node', [CLI, 'motion', 'get', 'kinetic-type-reel'], { cwd });
  const item = JSON.parse(stdout);
  assert.equal(item.slug, 'kinetic-type-reel');
  assert.equal(item.width, 1920);
});

test('cli: bad usage exits non-zero', async () => {
  await assert.rejects(run('node', [CLI, 'bogus'], { cwd: REPO_ROOT }));
});
