import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, cp, access } from 'node:fs/promises';
import { videoCheck, parseRatio, FFPROBE_MISSING } from '../lib/videocheck.js';
import { gauntletRun } from '../lib/gauntlet.js';
import { projectNew } from '../lib/project.js';
import { tempDir, tempRepoRoot, REPO_ROOT } from './helpers.js';

const run = promisify(execFile);
const CLI = path.join(REPO_ROOT, 'cli', 'synthia.js');

let ffmpegOk = false;
let fixtures = null; // { dir, ok9x16, long31, squareSilent }

async function makeFixtures(dir) {
  const enc = ['-preset', 'ultrafast', '-pix_fmt', 'yuv420p'];
  const ok9x16 = path.join(dir, 'ok-9x16.mp4');
  const long31 = path.join(dir, 'long-31s.mp4');
  const squareSilent = path.join(dir, 'square-silent.mp4');
  await run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=1080x1920:d=2:r=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', ...enc, '-c:a', 'aac', '-shortest', ok9x16]);
  await run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=1080x1920:d=31:r=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=31', ...enc, '-c:a', 'aac', '-shortest', long31]);
  await run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=1000x1000:d=2:r=30',
    ...enc, '-an', squareSilent]);
  return { dir, ok9x16, long31, squareSilent };
}

before(async () => {
  try {
    await run('ffmpeg', ['-version']);
    await run('ffprobe', ['-version']);
    ffmpegOk = true;
    fixtures = await makeFixtures(await tempDir('synthia-video-fixtures-'));
  } catch {
    ffmpegOk = false;
  }
});

const skipNoFfmpeg = (t) => {
  if (!ffmpegOk) {
    t.skip('ffmpeg/ffprobe not installed - skipping ffmpeg-dependent test (video_check never guesses durations)');
    return true;
  }
  return false;
};

// --- pure logic, no ffmpeg needed ---

test('parseRatio parses W:H and rejects garbage', () => {
  assert.equal(parseRatio('9:16').value, 9 / 16);
  assert.equal(parseRatio(' 16:9 ').label, '16:9');
  assert.throws(() => parseRatio('abc'), /must look like/);
});

test('videoCheck: stubbed probe applies duration, ratio, fps and audio rules', async () => {
  const dir = await tempDir('synthia-vc-stub-');
  const fake = path.join(dir, 'fake.mp4');
  await writeFile(fake, 'stub - bytes are never read, the probe is injected');
  const probe = (over) => JSON.stringify({
    format: { duration: '2.000' },
    streams: [
      { codec_type: 'video', width: 1080, height: 1920, avg_frame_rate: '30/1' },
      { codec_type: 'audio' },
    ],
    ...over,
  });
  const pass = await videoCheck({ targetPath: fake, ratios: ['9:16'] }, async () => probe({}));
  // file does not exist on disk, but a stubbed probe still reports from ffprobe JSON
  assert.equal(pass.files[0].pass, true);

  const silent = JSON.stringify({ format: { duration: '2.0' }, streams: [{ codec_type: 'video', width: 1000, height: 1000, avg_frame_rate: '25/1' }] });
  const noAudio = await videoCheck({ targetPath: fake, ratios: ['1:1'], requireAudio: true }, async () => silent);
  assert.equal(noAudio.files[0].pass, false);
  assert.ok(noAudio.files[0].failures.some((f) => f.includes('no audio stream')));

  const lowFps = JSON.stringify({ format: { duration: '2.0' }, streams: [{ codec_type: 'video', width: 1920, height: 1080, avg_frame_rate: '12/1' }, { codec_type: 'audio' }] });
  const fpsFail = await videoCheck({ targetPath: fake, ratios: ['16:9'] }, async () => lowFps);
  assert.equal(fpsFail.files[0].pass, false);
  assert.ok(fpsFail.files[0].failures.some((f) => f.includes('fps')));
});

// --- ffmpeg fixture tests (skipped with a clear message when ffmpeg is absent) ---

test('acceptance 1: 31 s fixture fails --max-seconds 30; 2 s 1080x1920 passes --ratios 9:16', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const long = await videoCheck({ targetPath: fixtures.long31, maxSeconds: 30, ratios: ['9:16'] });
  assert.equal(long.ok, false);
  assert.ok(long.files[0].failures.some((f) => f.includes('exceeds max 30s')), JSON.stringify(long.files[0].failures));

  const ok = await videoCheck({ targetPath: fixtures.ok9x16, maxSeconds: 30, ratios: ['9:16'] });
  assert.equal(ok.ok, true);
  assert.equal(ok.files[0].matchedRatio, '9:16');
  assert.equal(ok.files[0].hasAudio, true);
});

test('acceptance 2: 1000x1000 clip passes --ratios 1:1 and fails --ratios 9:16', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const pass = await videoCheck({ targetPath: fixtures.squareSilent, ratios: ['1:1'] });
  assert.equal(pass.ok, true);
  assert.equal(pass.files[0].matchedRatio, '1:1');

  const fail = await videoCheck({ targetPath: fixtures.squareSilent, ratios: ['9:16'] });
  assert.equal(fail.ok, false);
  assert.ok(fail.files[0].failures.some((f) => f.includes('matches none of')));
});

test('acceptance 3: --require-audio fails the silent fixture', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const res = await videoCheck({ targetPath: fixtures.squareSilent, ratios: ['1:1'], requireAudio: true });
  assert.equal(res.ok, false);
  assert.ok(res.files[0].failures.some((f) => f.includes('no audio stream')));
});

test('video_check.json is written next to the inputs (dir input)', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const dir = await tempDir('synthia-vc-dir-');
  await cp(fixtures.ok9x16, path.join(dir, 'clip.mp4'));
  const res = await videoCheck({ targetPath: dir, ratios: ['9:16', '1:1'] });
  assert.equal(res.reportPath, path.join(dir, 'video_check.json'));
  const report = JSON.parse(await readFile(res.reportPath, 'utf8'));
  assert.equal(report.ok, true);
  assert.equal(report.files.length, 1);
});

test('cli: synthia video check exits 0 on pass and 1 on fail', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const okRun = await run('node', [CLI, 'video', 'check', fixtures.ok9x16, '--ratios', '9:16']);
  assert.match(okRun.stdout, /PASS/);

  await assert.rejects(
    run('node', [CLI, 'video', 'check', fixtures.long31, '--max-seconds', '30', '--ratios', '9:16']),
    (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stdout, /FAIL/);
      return true;
    }
  );
});

test('acceptance 4: synthia gauntlet on a W7 project with the 31 s draft exits non-zero', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const root = await tempRepoRoot();
  const { projectPath } = await projectNew({ workflow: 'W7-commercial', clientSlug: 'vc-client' }, root);
  const drafts = path.join(projectPath, '04_build', 'output', 'drafts');
  await cp(fixtures.long31, path.join(drafts, 'draft.mp4'));

  const cleanExtract = async () => JSON.stringify({ findings: [] });
  const dirty = await gauntletRun({ projectPath }, cleanExtract);
  assert.equal(dirty.ok, false, '31 s draft fails the W7 gauntlet');
  assert.ok(dirty.video);
  assert.equal(dirty.video.ok, false);
  const report = JSON.parse(await readFile(dirty.reportPath, 'utf8'));
  assert.equal(report.video.ok, false, 'video result is included in EXTRACTOR.json under "video"');

  await cp(fixtures.ok9x16, path.join(drafts, 'draft.mp4'));
  const clean = await gauntletRun({ projectPath }, cleanExtract);
  assert.equal(clean.ok, true, 'compliant draft passes the W7 gauntlet');
});

test('ffprobe missing fails with an install message, never a guess', async (t) => {
  if (skipNoFfmpeg(t)) return;
  const dir = await tempDir('synthia-vc-noprobe-');
  await cp(fixtures.ok9x16, path.join(dir, 'clip.mp4'));
  const enoent = Object.assign(new Error('spawn ffprobe ENOENT'), { code: 'ENOENT' });
  await assert.rejects(videoCheck({ targetPath: dir }, async () => { throw enoent; }), /ffprobe not found.*Install ffmpeg/s);
});
