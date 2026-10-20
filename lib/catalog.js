// MotionVideo public catalog: fetch once per 24h, cache on disk, search locally.
// Only https://motionvideo.xyz/api/catalog/ is used (their llms.txt lists it for agents).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { validate } from './validate.js';

export const CATALOG_URL = 'https://motionvideo.xyz/api/catalog/';
export const USER_AGENT = 'synthia-cli/4.0 (https://github.com/executiveusa/Synthia-2026-4.0)';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const ensureCatalogSchema = {
  type: 'object',
  properties: {
    refresh: { type: 'boolean' },
    cachePath: { type: 'string', minLength: 1 },
    now: { type: 'number' },
  },
};

async function readCache(cachePath) {
  try {
    const raw = await readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.videos)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isCatalogShape(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.importedAt === 'string' &&
    Array.isArray(data.videos) &&
    data.videos.every(
      (v) => v && typeof v.slug === 'string' && typeof v.title === 'string'
    )
  );
}

// Returns { videos, fetchedAt, fromCache, requestsMade }.
// fetchImpl defaults to global fetch; inject a stub in tests.
export async function ensureCatalog(input = {}, fetchImpl = fetch) {
  const { refresh = false, cachePath = path.join(process.cwd(), '.cache', 'motion-catalog.json'), now = Date.now() } =
    validate(ensureCatalogSchema, input);

  const cached = await readCache(cachePath);
  if (!refresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { videos: cached.videos, fetchedAt: cached.fetchedAt, fromCache: true, requestsMade: 0 };
  }

  const res = await fetchImpl(CATALOG_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    if (cached) return { videos: cached.videos, fetchedAt: cached.fetchedAt, fromCache: true, requestsMade: 1, stale: true };
    throw new Error(`catalog fetch failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!isCatalogShape(data)) {
    if (cached) return { videos: cached.videos, fetchedAt: cached.fetchedAt, fromCache: true, requestsMade: 1, stale: true };
    throw new Error('catalog response no longer matches the documented {importedAt, videos[]} shape');
  }

  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify({ fetchedAt: now, importedAt: data.importedAt, videos: data.videos }), 'utf8');
  return { videos: data.videos, fetchedAt: now, fromCache: false, requestsMade: 1 };
}

export const searchCatalogSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 1 },
    stack: { type: 'string' },
    tag: { type: 'string' },
    limit: { type: 'integer', minimum: 1 },
  },
};

function haystack(video) {
  return [video.title ?? '', video.prompt ?? '', ...(video.contentTags ?? [])].join('\n').toLowerCase();
}

export function searchCatalog(videos, input) {
  const { query, stack, tag, limit = 10 } = validate(searchCatalogSchema, input);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = videos.filter((v) => {
    if (stack && String(v.stack ?? '').toLowerCase() !== stack.toLowerCase()) return false;
    if (tag && !(v.contentTags ?? []).some((t) => String(t).toLowerCase() === tag.toLowerCase())) return false;
    const hay = haystack(v);
    return words.every((w) => hay.includes(w));
  });
  return matches.slice(0, limit).map((v) => ({
    slug: v.slug,
    title: v.title,
    stack: v.stack ?? null,
    contentTags: v.contentTags ?? [],
    prompt: v.prompt ?? null,
    preview: v.preview ?? null,
  }));
}

export const getReferenceSchema = {
  type: 'object',
  required: ['slug'],
  properties: { slug: { type: 'string', minLength: 1 } },
};

export function getReference(videos, input) {
  const { slug } = validate(getReferenceSchema, input);
  const video = videos.find((v) => v.slug === slug);
  if (!video) return null;
  return video;
}
