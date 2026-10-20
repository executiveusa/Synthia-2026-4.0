import { mkdtemp, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function loadFixtureCatalog() {
  return JSON.parse(await readFile(path.join(FIXTURES, 'catalog.json'), 'utf8'));
}

export async function tempDir(prefix = 'synthia-test-') {
  return mkdtemp(path.join(tmpdir(), prefix));
}

// Copies a workflow into a temp repo root so project tests never touch the real projects/.
export async function tempRepoRoot() {
  const root = await tempDir('synthia-repo-');
  await cp(path.join(REPO_ROOT, 'workflows'), path.join(root, 'workflows'), { recursive: true });
  return root;
}

export function stubFetchOk(data) {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => data };
  };
  return { fetchImpl, calls: () => calls };
}
