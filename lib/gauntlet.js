// 05_gauntlet machine check: the-extractor over every .md/.txt in a project's
// stage outputs except 01_inspect. Fails on any high-severity finding.
// Rubric scoring stays a human/reviewer step and is not written here.

import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { validate } from './validate.js';
import { videoCheck, collectVideoFiles } from './videocheck.js';

const execFileAsync = promisify(execFile);

export const gauntletRunSchema = {
  type: 'object',
  required: ['projectPath'],
  properties: {
    projectPath: { type: 'string', minLength: 1 },
    extractorPath: { type: 'string' },
  },
};

async function collectFiles(dir, base, out) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(full, base, out);
    } else if (/\.(md|txt)$/i.test(entry.name)) {
      const rel = path.relative(base, full);
      if (rel.split(path.sep).includes('01_inspect')) continue;
      out.push(full);
    }
  }
}

// execImpl(file) must resolve to the extractor's JSON stdout for that file.
// probeImpl(file) must resolve to ffprobe's JSON stdout; injected by tests.
export async function gauntletRun(input, execImpl, probeImpl) {
  const { projectPath, extractorPath = path.join(process.cwd(), 'upstream', 'the-extractor', 'extractor.mjs') } =
    validate(gauntletRunSchema, input);

  const run =
    execImpl ??
    (async (file) => {
      const { stdout } = await execFileAsync('node', [extractorPath, 'audit', file, '--format', 'json'], { maxBuffer: 16 * 1024 * 1024 });
      return stdout;
    });

  const files = [];
  for (const stage of await readdir(projectPath, { withFileTypes: true }).catch(() => [])) {
    if (!stage.isDirectory() || !/^\d\d_/.test(stage.name)) continue;
    await collectFiles(path.join(projectPath, stage.name, 'output'), projectPath, files);
  }
  files.sort();

  const results = [];
  let highCount = 0;
  for (const file of files) {
    let findings = [];
    let error = null;
    try {
      findings = JSON.parse(await run(file)).findings ?? [];
    } catch (err) {
      error = String(err.message ?? err);
    }
    const highs = findings.filter((f) => f.severity === 'high').length;
    highCount += highs;
    results.push({ file: path.relative(projectPath, file), pass: highs === 0 && !error, highFindings: highs, findings, error });
  }

  // W7 commercials: check rendered drafts from the files themselves (<=30 s).
  let video = null;
  if (/-W7$/.test(path.basename(projectPath))) {
    const draftsDir = path.join(projectPath, '04_build', 'output', 'drafts');
    const draftVideos = await collectVideoFiles(draftsDir).catch(() => []);
    if (draftVideos.length > 0) {
      try {
        video = await videoCheck({ targetPath: draftsDir, maxSeconds: 30 }, probeImpl);
      } catch (err) {
        video = { ok: false, error: String(err.message ?? err), files: [] };
      }
    }
  }

  const ok = highCount === 0 && results.every((r) => !r.error) && (!video || video.ok);

  const outDir = path.join(projectPath, '05_gauntlet', 'output');
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'EXTRACTOR.json');
  await writeFile(reportPath, JSON.stringify({ projectPath, highCount, ok, results, video }, null, 2), 'utf8');

  return { reportPath, ok, highCount, results, video };
}
