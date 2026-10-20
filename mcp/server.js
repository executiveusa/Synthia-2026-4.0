#!/usr/bin/env node
// Synthia MCP server (stdio). Thin wrapper over the same lib/ functions the CLI uses.
// Uses the low-level Server so tool input schemas stay plain JSON Schema (no extra deps).

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { ensureCatalog, searchCatalog, getReference } from '../lib/catalog.js';
import { projectNew, projectStatus, bookmarksImport } from '../lib/project.js';
import { gauntletRun } from '../lib/gauntlet.js';

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
    description: 'Copy a workflow (W1 or W4) into projects/<client-slug>-<W>/. Refuses existing targets and planned workflows.',
    inputSchema: {
      type: 'object',
      required: ['workflow', 'clientSlug'],
      properties: {
        workflow: { type: 'string', enum: ['W1', 'W4'] },
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
    description: 'Run the-extractor over every .md/.txt in a project stage outputs (except 01_inspect), write 05_gauntlet/output/EXTRACTOR.json, fail on any high finding.',
    inputSchema: { type: 'object', required: ['projectPath'], properties: { projectPath: { type: 'string' } } },
  },
];

const WORKFLOW_DIRS = { W1: 'W1-trust-audit', W4: 'W4-motion-video' };

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
      const wfDir = WORKFLOW_DIRS[args?.workflow];
      if (!wfDir) throw new Error(`workflow "${args?.workflow}" is planned or unknown; only W1 and W4 have stage folders`);
      return projectNew({ workflow: wfDir, clientSlug: args?.clientSlug });
    }
    case 'project_status':
      return projectStatus({ projectPath: args?.projectPath });
    case 'gauntlet_run':
      return gauntletRun({ projectPath: args?.projectPath });
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
