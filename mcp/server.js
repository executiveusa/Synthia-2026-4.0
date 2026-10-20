#!/usr/bin/env node
// Synthia MCP server (stdio). Thin wrapper over the same lib/ functions the CLI uses.
// Uses the low-level Server so tool input schemas stay plain JSON Schema (no extra deps).

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { ensureCatalog, searchCatalog, getReference } from '../lib/catalog.js';
import { projectNew, projectStatus, bookmarksImport, resolveWorkflow } from '../lib/project.js';
import { gauntletRun } from '../lib/gauntlet.js';
import { videoCheck } from '../lib/videocheck.js';

export const TOOLS = [
  {
    name: 'motion_catalog_search',
    description: 'Search the MotionVideo public catalog (cached, refetched at most once per 24h). Returns slug, title, stack, contentTags, prompt, preview URL.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        stack: { type: 'string' },
        tag: { type: 'string' },
        limit: { type: 'integer', minimum: 1 },
        refresh: { type: 'boolean' },
      },
    },
  },
  {
    name: 'motion_reference_get',
    description: 'Get one MotionVideo catalog item in full, from the cache.',
    inputSchema: { type: 'object', required: ['slug'], properties: { slug: { type: 'string' } } },
  },
  {
    name: 'bookmarks_import',
    description: 'Import a text file of MotionVideo slugs or video URLs (one per line) into a project research ledger. Reports lines with no catalog match.',
    inputSchema: {
      type: 'object',
      required: ['file', 'project'],
      properties: { file: { type: 'string' }, project: { type: 'string' } },
    },
  },
  {
    name: 'project_new',
    description: 'Copy a built workflow (e.g. W1, W4, W7) into projects/<client-slug>-<W>/. Workflows are read from workflows/ on disk. Refuses existing targets and planned workflows.',
    inputSchema: {
      type: 'object',
      required: ['workflow', 'clientSlug'],
      properties: {
        workflow: { type: 'string', pattern: '^W[0-9]+(-[a-z0-9-]+)?$' },
        clientSlug: { type: 'string' },
      },
    },
  },
  {
    name: 'project_status',
    description: 'List each project stage as done/pending; flags delivery without approval as a violation.',
    inputSchema: { type: 'object', required: ['projectPath'], properties: { projectPath: { type: 'string' } } },
  },
  {
    name: 'gauntlet_run',
    description: 'Run the-extractor over every .md/.txt in a project stage outputs (except 01_inspect), write 05_gauntlet/output/EXTRACTOR.json, fail on any high finding. On W7 projects, drafts in 04_build/output/drafts/ are also video-checked (<=30 s).',
    inputSchema: { type: 'object', required: ['projectPath'], properties: { projectPath: { type: 'string' } } },
  },
  {
    name: 'video_check',
    description: 'Verify video files from the files themselves with ffprobe: duration, resolution, aspect ratio, fps, audio stream. Fails over --max-seconds, disallowed ratios, fps outside 23-60, or missing audio when required. Writes video_check.json next to the inputs. Never guesses durations; fails with an install message when ffprobe is missing.',
    inputSchema: {
      type: 'object',
      required: ['path'],
      properties: {
        path: { type: 'string', description: 'a video file (.mp4/.mov/.webm) or a directory of them' },
        maxSeconds: { type: 'number', description: 'maximum allowed duration in seconds (default 30)' },
        ratios: { type: 'string', description: 'comma-separated allowed aspect ratios, e.g. "9:16,1:1,16:9"' },
        requireAudio: { type: 'boolean' },
      },
    },
  },
];

export async function callTool(name, args) {
  switch (name) {
    case 'motion_catalog_search': {
      const catalog = await ensureCatalog({ refresh: Boolean(args?.refresh) });
      return searchCatalog(catalog.videos, { query: args?.query, stack: args?.stack, tag: args?.tag, limit: args?.limit });
    }
    case 'motion_reference_get': {
      const catalog = await ensureCatalog({});
      const video = getReference(catalog.videos, { slug: args?.slug });
      if (!video) throw new Error(`no catalog item with slug "${args?.slug}"`);
      return video;
    }
    case 'bookmarks_import': {
      const catalog = await ensureCatalog({});
      return bookmarksImport({ file: args?.file, projectPath: args?.project }, catalog.videos);
    }
    case 'project_new': {
      const wfDir = await resolveWorkflow(args?.workflow);
      return projectNew({ workflow: wfDir, clientSlug: args?.clientSlug });
    }
    case 'project_status':
      return projectStatus({ projectPath: args?.projectPath });
    case 'gauntlet_run':
      return gauntletRun({ projectPath: args?.projectPath });
    case 'video_check': {
      const input = { targetPath: args?.path, requireAudio: Boolean(args?.requireAudio) };
      if (args?.maxSeconds !== undefined) input.maxSeconds = args.maxSeconds;
      if (args?.ratios !== undefined) {
        input.ratios = String(args.ratios).split(',').map((r) => r.trim()).filter(Boolean);
      }
      return videoCheck(input);
    }
    default:
      throw new Error(`unknown tool "${name}"`);
  }
}

export function createServer() {
  const server = new Server({ name: 'synthia', version: '4.0.0' }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await callTool(request.params.name, request.params.arguments ?? {});
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `error: ${err.message ?? err}` }], isError: true };
    }
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
