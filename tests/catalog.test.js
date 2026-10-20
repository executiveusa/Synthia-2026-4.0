import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ensureCatalog, searchCatalog, getReference } from '../lib/catalog.js';
import { loadFixtureCatalog, tempDir, stubFetchOk } from './helpers.js';

test('search matches query against title, prompt and contentTags; limit applies', async () => {
  const { videos } = await loadFixtureCatalog();
  const results = searchCatalog(videos, { query: 'kinetic type', limit: 5 });
  assert.equal(results.length, 2);
  assert.ok(results.length <= 5);
  for (const r of results) {
    assert.ok(r.slug);
    assert.ok(r.preview);
    assert.deepEqual(Object.keys(r).sort(), ['contentTags', 'preview', 'prompt', 'slug', 'stack', 'title']);
  }
  assert.equal(searchCatalog(videos, { query: 'kinetic type', limit: 1 }).length, 1);
});

test('search filters by stack and tag', async () => {
  const { videos } = await loadFixtureCatalog();
  assert.deepEqual(searchCatalog(videos, { query: 'type', stack: 'remotion' }).map((r) => r.slug).sort(), ['kinetic-type-counter', 'kinetic-type-reel']);
  assert.deepEqual(searchCatalog(videos, { query: 'type', stack: 'blender' }), []);
  assert.deepEqual(searchCatalog(videos, { query: 'type', tag: 'data' }).map((r) => r.slug), ['kinetic-type-counter']);
});

test('every query word must match', async () => {
  const { videos } = await loadFixtureCatalog();
  assert.deepEqual(searchCatalog(videos, { query: 'kinetic blender' }), []);
});

test('cache: second ensureCatalog within 24h makes no network request', async () => {
  const data = await loadFixtureCatalog();
  const { fetchImpl, calls } = stubFetchOk(data);
  const cachePath = path.join(await tempDir(), 'catalog.json');

  const first = await ensureCatalog({ cachePath, now: 1_000_000 }, fetchImpl);
  assert.equal(first.fromCache, false);
  assert.equal(first.videos.length, 3);
  assert.equal(calls(), 1);

  const second = await ensureCatalog({ cachePath, now: 1_000_000 + 60_000 }, fetchImpl);
  assert.equal(second.fromCache, true);
  assert.equal(second.requestsMade, 0);
  assert.equal(calls(), 1, 'no second network request within 24h');

  const third = await ensureCatalog({ cachePath, now: 1_000_000 + 25 * 60 * 60 * 1000 }, fetchImpl);
  assert.equal(third.fromCache, false, 'refetch after 24h');
  assert.equal(calls(), 2);
});

test('refresh forces a refetch inside the 24h window', async () => {
  const data = await loadFixtureCatalog();
  const { fetchImpl, calls } = stubFetchOk(data);
  const cachePath = path.join(await tempDir(), 'catalog.json');
  await ensureCatalog({ cachePath, now: 5_000 }, fetchImpl);
  const again = await ensureCatalog({ cachePath, now: 6_000, refresh: true }, fetchImpl);
  assert.equal(again.fromCache, false);
  assert.equal(calls(), 2);
});

test('stale cache is served when the fetch fails or the shape changed', async () => {
  const data = await loadFixtureCatalog();
  const { fetchImpl } = stubFetchOk(data);
  const cachePath = path.join(await tempDir(), 'catalog.json');
  await ensureCatalog({ cachePath, now: 1_000 }, fetchImpl);

  const failing = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const stale = await ensureCatalog({ cachePath, now: 1_000 + 25 * 60 * 60 * 1000 }, failing);
  assert.equal(stale.stale, true);
  assert.equal(stale.videos.length, 3);

  const empty = path.join(await tempDir(), 'catalog.json');
  await assert.rejects(() => ensureCatalog({ cachePath: empty }, failing), /HTTP 503/);

  const wrongShape = async () => ({ ok: true, status: 200, json: async () => ({ nope: true }) });
  await assert.rejects(() => ensureCatalog({ cachePath: empty }, wrongShape), /shape/);
});

test('getReference returns one full item or null', async () => {
  const { videos } = await loadFixtureCatalog();
  const item = getReference(videos, { slug: 'kinetic-type-reel' });
  assert.equal(item.title, 'Kinetic type launch reel');
  assert.equal(getReference(videos, { slug: 'missing' }), null);
});
