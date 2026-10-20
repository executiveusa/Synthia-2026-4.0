// Project scaffolding and status. A project is a copy of a workflow folder
// under projects/<client-slug>-<W>/ (git-ignored client material).

import { cp, readdir, mkdir, access, appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validate } from './validate.js';

export const projectNewSchema = {
  type: 'object',
  required: ['workflow', 'clientSlug'],
  properties: {
    workflow: { type: 'string', minLength: 1 },
    clientSlug: { type: 'string', minLength: 1 },
  },
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

async function stageFolders(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory() && /^\d\d_/.test(e.name)).map((e) => e.name).sort();
}

// Resolve "W7" or "W7-commercial" to a workflow folder on disk. The folders are
// the source of truth: a workflow is "built" when it has numbered stage folders.
export async function resolveWorkflow(id, rootDir = process.cwd()) {
  if (typeof id !== 'string' || !/^W\d+(-[a-z0-9-]+)?$/.test(id)) {
    throw new Error(`workflow "${id}" must look like W7 or W7-commercial`);
  }
  const wfRoot = path.join(rootDir, 'workflows');
  const dirs = (await readdir(wfRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && /^W\d+-/.test(e.name)).map((e) => e.name).sort();
  const built = [];
  for (const d of dirs) if ((await stageFolders(path.join(wfRoot, d))).length > 0) built.push(d);
  const match = dirs.find((d) => d === id || d.startsWith(`${id}-`));
  if (!match) throw new Error(`unknown workflow "${id}" (built: ${built.join(', ') || 'none'})`);
  if (!built.includes(match)) throw new Error(`workflow "${match}" is planned, not built: it has no stage folders (built: ${built.join(', ')})`);
  return match;
}

export async function projectNew(input, rootDir = process.cwd()) {
  const { workflow, clientSlug } = validate(projectNewSchema, input);
  if (!SLUG_RE.test(clientSlug)) {
    throw new Error(`client slug "${clientSlug}" must be lowercase letters, digits and dashes`);
  }
  const source = path.join(rootDir, 'workflows', workflow);
  const stages = await stageFolders(source).catch(() => []);
  if (stages.length === 0) {
    throw new Error(`workflow "${workflow}" has no stage folders yet (planned workflows W2, W3, W5, W6 are refused)`);
  }
  const shortId = workflow.split('-')[0];
  const target = path.join(rootDir, 'projects', `${clientSlug}-${shortId}`);
  try {
    await access(target);
    throw new Error(`refusing: ${target} already exists`);
  } catch (err) {
    if (err && err.message && err.message.startsWith('refusing:')) throw err;
  }
  await cp(source, target, { recursive: true });
  return { projectPath: target, stages };
}

export const projectStatusSchema = {
  type: 'object',
  required: ['projectPath'],
  properties: { projectPath: { type: 'string', minLength: 1 } },
};

async function outputHasWork(outputDir) {
  const entries = await readdir(outputDir).catch(() => []);
  return entries.some((name) => name !== '.gitkeep');
}

export async function projectStatus(input) {
  const { projectPath } = validate(projectStatusSchema, input);
  const stages = await stageFolders(projectPath);
  if (stages.length === 0) throw new Error(`no stage folders under ${projectPath}`);
  const rows = [];
  for (const stage of stages) {
    const done = await outputHasWork(path.join(projectPath, stage, 'output'));
    rows.push({ stage, state: done ? 'done' : 'pending' });
  }
  const approval = rows.find((r) => r.stage === '06_approval');
  const deliver = rows.find((r) => r.stage === '07_deliver');
  const violations = [];
  if ((!approval || approval.state !== 'done') && deliver && deliver.state === 'done') {
    violations.push('VIOLATION: 07_deliver has output but 06_approval is missing or pending');
  }
  return { projectPath, stages: rows, violations };
}

export const bookmarksImportSchema = {
  type: 'object',
  required: ['file', 'projectPath'],
  properties: {
    file: { type: 'string', minLength: 1 },
    projectPath: { type: 'string', minLength: 1 },
  },
};

// A line is a MotionVideo slug, or a URL whose last path segment is the slug.
export function lineToSlug(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const withoutQuery = trimmed.split(/[?#]/)[0];
  const segment = withoutQuery.replace(/\/+$/, '').split('/').pop();
  return segment && /^[a-z0-9][a-z0-9-]*$/i.test(segment) ? segment : null;
}

// Ledger fields from SPINE.md section 02_research. PRINCIPLE TO EXTRACT and
// COPYING RISK stay blank: those are human judgment.
function ledgerRow(video) {
  return [
    '',
    `REFERENCE: ${video.title} (slug: ${video.slug})`,
    `SOURCE: ${video.preview ?? 'MotionVideo catalog'}`,
    `WHAT IS RELEVANT: prompt, stack and contentTags - ${JSON.stringify({ stack: video.stack ?? null, contentTags: video.contentTags ?? [] })}; prompt: ${video.prompt ?? ''}`,
    "WHAT IS NOT: the finished video itself - another creator's work, reference only, never copied or resold",
    'PRINCIPLE TO EXTRACT:',
    'COPYING RISK:',
    '',
  ].join('\n');
}

export async function bookmarksImport(input, videos) {
  const { file, projectPath } = validate(bookmarksImportSchema, input);
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const bySlug = new Map(videos.map((v) => [v.slug, v]));
  const matched = [];
  const unmatched = [];
  for (const line of lines) {
    const slug = lineToSlug(line);
    if (!slug) continue;
    const video = bySlug.get(slug);
    if (video) matched.push(video);
    else unmatched.push(line.trim());
  }
  const ledgerDir = path.join(projectPath, '02_research', 'output');
  await mkdir(ledgerDir, { recursive: true });
  const ledgerPath = path.join(ledgerDir, 'LEDGER.md');
  try {
    await access(ledgerPath);
  } catch {
    await appendFile(ledgerPath, '# Reference ledger\n\nFields per SPINE.md 02_research. PRINCIPLE TO EXTRACT and COPYING RISK are filled in by a human.\n', 'utf8');
  }
  if (matched.length > 0) {
    await appendFile(ledgerPath, matched.map(ledgerRow).join('\n'), 'utf8');
  }
  return { ledgerPath, matched: matched.map((v) => v.slug), unmatched };
}
