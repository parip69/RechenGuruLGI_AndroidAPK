// Explicit, separate developer workflow. This file is never called by the MCP server.
import fs from 'node:fs';
import { FeatureStore, toGithubIssue } from './core.mjs';
const [operation, file, id, status, ...args] = process.argv.slice(2);
try {
  if (!file || !id) throw new Error('Aufgabenlistendatei und Vorschlags-ID erforderlich.');
  const store = new FeatureStore(file);
  if (operation === 'export-github') console.log(JSON.stringify(toGithubIssue(store.get(id)), null, 2));
  else if (operation === 'set-status') {
    const authorized = args.includes('--authorized');
    const value = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
    const proofFile = value('--proof');
    const result = store.updateStatus(id, status, { authorized, reason: value('--reason'),
      proof: proofFile ? JSON.parse(fs.readFileSync(proofFile, 'utf8')) : undefined });
    console.log(JSON.stringify({ id: result.id, status: result.status }));
  } else throw new Error('Operation muss export-github oder set-status sein.');
} catch (e) { console.error(e.message); process.exitCode = 1; }
