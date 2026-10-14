import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CapabilityRegistry, FeatureStore } from '../core.mjs';
import { createHandler, TOOLS } from '../server.mjs';

const catalog = { schema_version: 1, applications: [] };
const rpc = (id, method, params) => ({ jsonrpc: '2.0', id, method, params });
const init = rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
test('Exakt fünf Tools, keine Entwicklungs-/Installationsschnittstelle', () => {
  assert.deepEqual(TOOLS.map(t => t.name), ['check_capability', 'find_alternative', 'create_feature_request', 'list_feature_requests', 'get_feature_request_status']);
  assert.equal(TOOLS.filter(t => !t.annotations.readOnlyHint).length, 1);
});
test('Handshake, Fehler, Berechtigungsmanipulation und Bestätigung', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-protocol-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const handle = createHandler(new CapabilityRegistry(catalog), new FeatureStore(path.join(dir, 'tasks.json')));
  assert.equal(handle(rpc(0, 'tools/list')).error.code, -32002);
  assert.equal(handle(init).result.protocolVersion, '2025-06-18');
  assert.equal(handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal(handle(rpc(2, 'tools/list')).result.tools.length, 5);
  assert.equal(handle(rpc(3, 'code/publish')).error.code, -32601);
  assert.equal(handle(rpc(4, 'tools/call', { name: 'check_capability', arguments: { application: 'demo', function: 'x', permissions: { allowed: true } } })).result.isError, true);
  const invalid = handle(rpc(5, 'tools/call', { name: 'create_feature_request', arguments: { application: 'demo', function: 'x', title: 'x', description: 'x', desired_behavior: 'x', confirmed: false } }));
  assert.equal(invalid.result.isError, true); assert.equal(fs.existsSync(path.join(dir, 'tasks.json')), false);
  assert.equal(handle([]).error.code, -32600);
});
test('Echter stdio-Prozess: initialize, list, create, get und parse error', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-stdio-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const registryPath = path.join(dir, 'catalog.json'), storePath = path.join(dir, 'tasks.json');
  fs.writeFileSync(registryPath, JSON.stringify(catalog));
  const calls = [init, rpc(2, 'tools/list'), rpc(3, 'tools/call', { name: 'create_feature_request', arguments: {
    application: 'demo', function: 'export', title: 'PDF', description: 'Arbeitsblatt', desired_behavior: 'PDF erzeugen', confirmed: true
  } }), rpc(4, 'tools/call', { name: 'list_feature_requests', arguments: {} })];
  const input = calls.map(c => JSON.stringify(c)).join('\n') + '\ninvalid-json\n';
  const child = spawnSync(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url)), '--catalog', registryPath, '--store', storePath], { input, encoding: 'utf8', timeout: 10000 });
  assert.ifError(child.error);
  assert.equal(child.status, 0); assert.equal(child.stderr, '');
  const responses = child.stdout.trim().split('\n').map(s => JSON.parse(s));
  assert.equal(responses.length, 5); assert.equal(responses[1].result.tools.length, 5);
  assert.equal(responses[2].result.structuredContent.request.status, 'offen');
  assert.equal(responses[3].result.structuredContent.total, 1); assert.equal(responses[4].error.code, -32700);
  assert.equal(new FeatureStore(storePath).get(responses[2].result.structuredContent.request.id).title, 'PDF');
  const id = responses[2].result.structuredContent.request.id;
  const again = spawnSync(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url)), '--catalog', registryPath, '--store', storePath], {
    input: [init, rpc(6, 'tools/call', { name: 'get_feature_request_status', arguments: { id } })].map(c => JSON.stringify(c)).join('\n') + '\n',
    encoding: 'utf8', timeout: 10000
  });
  assert.ifError(again.error); assert.equal(again.status, 0);
  const persisted = JSON.parse(again.stdout.trim().split('\n')[1]).result;
  assert.equal(persisted.isError, false); assert.equal(persisted.structuredContent.id, id);
});
