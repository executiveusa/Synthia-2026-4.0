import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { REPO_ROOT } from './helpers.js';

const EXPECTED = ['motion_catalog_search', 'motion_reference_get', 'bookmarks_import', 'project_new', 'project_status', 'gauntlet_run'];

test('MCP server starts over stdio and lists all six tools', async () => {
  const serverPath = path.join(REPO_ROOT, 'mcp', 'server.js');
  const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  let buffer = '';
  const responses = new Map();
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined) responses.set(msg.id, msg);
      } catch { /* ignore non-JSON noise */ }
    }
  });

  const send = (id, method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  const waitFor = async (id, timeoutMs = 10000) => {
    const start = Date.now();
    while (!responses.has(id)) {
      if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for response ${id}`);
      await new Promise((r) => setTimeout(r, 25));
    }
    return responses.get(id);
  };

  try {
    send(1, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '0' } });
    const init = await waitFor(1);
    assert.equal(init.result.serverInfo.name, 'synthia');

    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    send(2, 'tools/list', {});
    const list = await waitFor(2);
    const names = list.result.tools.map((t) => t.name).sort();
    assert.deepEqual(names, [...EXPECTED].sort());
    for (const tool of list.result.tools) {
      assert.equal(tool.inputSchema.type, 'object', `${tool.name} has a JSON object input schema`);
    }
  } finally {
    child.kill();
  }
});

test('callTool rejects unknown tools', async () => {
  const { callTool } = await import('../mcp/server.js');
  await assert.rejects(() => callTool('nope', {}), /unknown tool/);
});
