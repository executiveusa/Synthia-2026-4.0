// video_check: verify rendered video files from the files themselves (ffprobe),
// never from a job status. Used by `synthia video check` and the W7 gauntlet.
// Fails when ffprobe is missing - durations are never guessed.

import { readdir, writeFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { validate } from './validate.js';

const execFileAsync = promisify(execFile);

const VIDEO_EXT = /\.(mp4|mov|webm)$/i;

export const FFPROBE_MISSING =
  'ffprobe not found. Install ffmpeg (e.g. `brew install ffmpeg` or `apt install ffmpeg`) - video_check reads real files and never guesses durations.';

export const videoCheckSchema = {
  type: 'object',
  required: ['targetPath'],
  properties: {
    targetPath: { type: 'string', minLength: 1 },
    maxSeconds: { type: 'number', minimum: 0 },
    ratios: { type: 'array' },
    requireAudio: { type: 'boolean' },
  },
};

export function parseRatio(text) {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(String(text).trim());
  if (!m) throw new Error(`ratio "${text}" must look like 9:16`);
  return { label: `${m[1]}:${m[2]}`, value: Number(m[1]) / Number(m[2]) };
}

function parseFps(rate) {
  if (typeof rate !== 'string') return null;
  const [num, den] = rate.split('/').map(Number);
  if (!Number.isFinite(num)) return null;
  const fps = den ? num / den : num;
  return Number.isFinite(fps) && fps > 0 ? fps : null;
}

// Match within ±1% (relative) of an allowed ratio; returns the matched label or null.
function matchRatio(width, height, allowed) {
  if (!width || !height) return null;
  const actual = width / height;
  for (const r of allowed) {
    if (Math.abs(actual - r.value) / r.value <= 0.01) return r.label;
  }
  return null;
}

export async function collectVideoFiles(targetPath) {
  const info = await stat(targetPath);
  if (info.isFile()) {
    if (!VIDEO_EXT.test(targetPath)) throw new Error(`${targetPath} is not a .mp4/.mov/.webm file`);
    return [targetPath];
  }
  const out = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (VIDEO_EXT.test(entry.name) && entry.name !== 'video_check.json') out.push(full);
    }
  };
  await walk(targetPath);
  return out.sort();
}

// probeImpl(file) must resolve to ffprobe's JSON stdout for that file.
export async function videoCheck(input, probeImpl) {
  const {
    targetPath,
    maxSeconds = 30,
    ratios = ['9:16', '1:1', '16:9'],
    requireAudio = false,
  } = validate(videoCheckSchema, input);

  const allowed = ratios.map(parseRatio);
  const files = await collectVideoFiles(targetPath);
  if (files.length === 0) throw new Error(`no .mp4/.mov/.webm files under ${targetPath}`);

  const run =
    probeImpl ??
    (async (file) => {
      try {
        const { stdout } = await execFileAsync(
          'ffprobe',
          ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
          { maxBuffer: 16 * 1024 * 1024 }
        );
        return stdout;
      } catch (err) {
        if (err && err.code === 'ENOENT') throw new Error(FFPROBE_MISSING);
        throw new Error(`ffprobe failed on ${file}: ${err.message ?? err}`);
      }
    });

  const reports = [];
  for (const file of files) {
    let probe;
    try {
      probe = JSON.parse(await run(file));
    } catch (err) {
      if ((err && err.code === 'ENOENT') || String(err.message ?? err).includes('ffprobe not found')) throw new Error(FFPROBE_MISSING);
      reports.push({ file, pass: false, error: String(err.message ?? err), failures: ['unreadable: ffprobe could not parse this file'] });
      continue;
    }
    const streams = probe.streams ?? [];
    const video = streams.find((s) => s.codec_type === 'video');
    const durationSeconds = Number(probe.format?.duration);
    const width = video?.width ?? null;
    const height = video?.height ?? null;
    const fps = video ? parseFps(video.avg_frame_rate) ?? parseFps(video.r_frame_rate) : null;
    const hasAudio = streams.some((s) => s.codec_type === 'audio');
    const matchedRatio = matchRatio(width, height, allowed);

    const failures = [];
    if (!Number.isFinite(durationSeconds)) failures.push('no duration in ffprobe output');
    else if (durationSeconds > maxSeconds) failures.push(`duration ${durationSeconds.toFixed(2)}s exceeds max ${maxSeconds}s`);
    if (!video) failures.push('no video stream');
    if (video && !matchedRatio) {
      failures.push(`aspect ${width}x${height} matches none of [${allowed.map((r) => r.label).join(', ')}]`);
    }
    if (fps === null) failures.push('no usable fps in ffprobe output');
    else if (fps < 23 || fps > 60) failures.push(`fps ${fps.toFixed(2)} outside 23-60`);
    if (requireAudio && !hasAudio) failures.push('no audio stream (--require-audio)');

    reports.push({
      file,
      durationSeconds: Number.isFinite(durationSeconds) ? Number(durationSeconds.toFixed(3)) : null,
      width,
      height,
      aspectRatio: width && height ? Number((width / height).toFixed(4)) : null,
      matchedRatio,
      fps: fps === null ? null : Number(fps.toFixed(2)),
      hasAudio,
      pass: failures.length === 0,
      failures,
    });
  }

  const info = await stat(targetPath);
  const reportPath = info.isDirectory() ? path.join(targetPath, 'video_check.json') : path.join(path.dirname(targetPath), 'video_check.json');
  const ok = reports.every((r) => r.pass);
  await writeFile(
    reportPath,
    JSON.stringify({ targetPath, maxSeconds, ratios: allowed.map((r) => r.label), requireAudio, ok, files: reports }, null, 2),
    'utf8'
  );
  return { reportPath, ok, files: reports };
}
