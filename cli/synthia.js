#!/usr/bin/env node
// synthia CLI: thin wrapper over lib/. MCP server in mcp/server.js wraps the same functions.

import { parseArgs } from 'node:util';
import { ensureCatalog, searchCatalog, getReference } from '../lib/catalog.js';
import { projectNew, projectStatus, bookmarksImport, resolveWorkflow } from '../lib/project.js';
import { gauntletRun } from '../lib/gauntlet.js';
import { videoCheck } from '../lib/videocheck.js';

const USAGE = `synthia - Synthia 4.0 studio CLI

  synthia motion search <query> [--stack S] [--tag T] [--limit N] [--refresh]
  synthia motion get <slug>
  synthia motion import <file> --project <path>
  synthia new <W1|W4> <client-slug>
  synthia status <project-path>
  synthia gauntlet <project-path>
  synthia video check <file-or-dir> [--max-seconds 30] [--ratios 9:16,1:1,16:9] [--require-audio]
`;

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

async function main(argv) {
  const [area, command, ...rest] = argv;

  if (area === 'motion' && command === 'search') {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { stack: { type: 'string' }, tag: { type: 'string' }, limit: { type: 'string' }, refresh: { type: 'boolean', default: false } },
    });
    const query = positionals.join(' ').trim();
    if (!query) fail('usage: synthia motion search <query>');
    const catalog = await ensureCatalog({ refresh: values.refresh });
    const results = searchCatalog(catalog.videos, {
      query,
      stack: values.stack,
      tag: values.tag,
      limit: values.limit ? Number(values.limit) : undefined,
    });
    console.log(JSON.stringify(results, null, 2));
    console.error(`${results.length} result(s), catalog ${catalog.fromCache ? 'from cache' : 'fetched'} (${catalog.videos.length} videos)`);
    return;
  }

  if (area === 'motion' && command === 'get') {
    const [slug] = rest;
    if (!slug) fail('usage: synthia motion get <slug>');
    const catalog = await ensureCatalog({});
    const video = getReference(catalog.videos, { slug });
    if (!video) fail(`no catalog item with slug "${slug}"`, 2);
    console.log(JSON.stringify(video, null, 2));
    return;
  }

  if (area === 'motion' && command === 'import') {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { project: { type: 'string' } },
    });
    const [file] = positionals;
    if (!file || !values.project) fail('usage: synthia motion import <file> --project <path>');
    const catalog = await ensureCatalog({});
    const result = await bookmarksImport({ file, projectPath: values.project }, catalog.videos);
    console.log(`appended ${result.matched.length} ledger row(s) to ${result.ledgerPath}`);
    for (const slug of result.matched) console.log(`  matched: ${slug}`);
    for (const line of result.unmatched) console.log(`  no catalog match: ${line}`);
    return;
  }

  if (area === 'new') {
    const [workflow, clientSlug] = [command, rest[0]];
    if (!workflow || !clientSlug) fail('usage: synthia new <workflow, e.g. W1 or W7> <client-slug>');
    const wfDir = await resolveWorkflow(workflow).catch((err) => fail(err.message));
    const result = await projectNew({ workflow: wfDir, clientSlug });
    console.log(`created ${result.projectPath}`);
    for (const stage of result.stages) console.log(`  ${stage}/`);
    return;
  }

  if (area === 'status') {
    if (!command) fail('usage: synthia status <project-path>');
    const result = await projectStatus({ projectPath: command });
    for (const row of result.stages) console.log(`${row.state.padEnd(7)} ${row.stage}`);
    for (const violation of result.violations) console.log(violation);
    if (result.violations.length > 0) process.exit(2);
    return;
  }

  if (area === 'gauntlet') {
    if (!command) fail('usage: synthia gauntlet <project-path>');
    const result = await gauntletRun({ projectPath: command });
    for (const row of result.results) console.log(`${row.pass ? 'PASS' : 'FAIL'} ${row.file}`);
    if (result.video) {
      for (const row of result.video.files ?? []) {
        console.log(`${row.pass ? 'PASS' : 'FAIL'} ${row.file}${row.failures?.length ? ` - ${row.failures.join('; ')}` : ''}`);
      }
      if (result.video.error) console.log(`FAIL video_check - ${result.video.error}`);
    }
    console.log(`report: ${result.reportPath}`);
    if (!result.ok) {
      const why = [];
      if (result.highCount > 0) why.push(`${result.highCount} high-severity finding(s)`);
      if (result.video && !result.video.ok) why.push('video_check failed');
      fail(`gauntlet failed: ${why.join(', ') || 'see report'}`, 1);
    }
    console.log('gauntlet passed');
    return;
  }

  if (area === 'video' && command === 'check') {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        'max-seconds': { type: 'string' },
        ratios: { type: 'string' },
        'require-audio': { type: 'boolean', default: false },
      },
    });
    const [target] = positionals;
    if (!target) fail('usage: synthia video check <file-or-dir> [--max-seconds 30] [--ratios 9:16,1:1,16:9] [--require-audio]');
    const input = {
      targetPath: target,
      requireAudio: values['require-audio'],
    };
    if (values['max-seconds'] !== undefined) {
      const n = Number(values['max-seconds']);
      if (!Number.isFinite(n) || n <= 0) fail(`--max-seconds must be a positive number, got "${values['max-seconds']}"`, 2);
      input.maxSeconds = n;
    }
    if (values.ratios !== undefined) input.ratios = values.ratios.split(',').map((r) => r.trim()).filter(Boolean);
    const result = await videoCheck(input);
    for (const row of result.files) {
      const detail = row.pass
        ? `${row.durationSeconds}s ${row.width}x${row.height} (${row.matchedRatio}) ${row.fps}fps audio:${row.hasAudio}`
        : row.failures.join('; ');
      console.log(`${row.pass ? 'PASS' : 'FAIL'} ${row.file} - ${detail}`);
    }
    console.log(`report: ${result.reportPath}`);
    if (!result.ok) process.exit(1);
    console.log('video_check passed');
    return;
  }

  process.stderr.write(USAGE);
  process.exit(area ? 2 : 0);
}

main(process.argv.slice(2)).catch((err) => fail(err.message ?? String(err)));
