import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export const STATUSES = ['offen', 'geplant', 'in_arbeit', 'umgesetzt', 'abgelehnt'];
export const PRIORITIES = ['niedrig', 'normal', 'hoch', 'kritisch'];
export class DomainError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const text = (value, name, max = 10000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new DomainError('invalid_input', `${name}: nichtleerer Text mit maximal ${max} Zeichen erforderlich.`);
  return value.trim();
};
export const normalize = s => s.normalize('NFKC').toLocaleLowerCase('de-DE').trim().replace(/\s+/g, ' ');
const key = r => createHash('sha256').update(JSON.stringify([
  normalize(r.application), normalize(r.function), normalize(r.desired_behavior)
])).digest('hex');
const labels = {
  available: 'Funktion verfügbar', partially_available: 'Funktion teilweise verfügbar',
  alternative_available: 'Alternative verfügbar', not_implemented: 'Funktion nicht implementiert',
  permission_denied: 'Funktion wegen fehlender Berechtigung nicht verfügbar', unknown: 'Funktionsstatus unbekannt'
};
const result = (status, explanation, extra = {}) => ({ status, label: labels[status], explanation, ...extra });

export class CapabilityRegistry {
  constructor(catalog, now = () => Date.now()) {
    if (catalog?.schema_version !== 1 || !Array.isArray(catalog.applications))
      throw new DomainError('invalid_catalog', 'Ungültiger Funktionskatalog.');
    if (catalog.max_age_days !== undefined && (!Number.isInteger(catalog.max_age_days) || catalog.max_age_days < 1 || catalog.max_age_days > 365))
      throw new DomainError('invalid_catalog', 'Ungültige Gültigkeitsdauer des Katalogs.');
    const appIds = new Set();
    for (const app of catalog.applications) {
      text(app.id, 'application.id', 200);
      if (appIds.has(normalize(app.id)) || !Array.isArray(app.capabilities))
        throw new DomainError('invalid_catalog', 'Doppelte Anwendung oder fehlende Capability-Liste.');
      appIds.add(normalize(app.id));
      for (const field of ['discovery_requires', 'evidence']) {
        if (app[field] !== undefined && (!Array.isArray(app[field]) || app[field].some(v => typeof v !== 'string' || !v.trim())))
          throw new DomainError('invalid_catalog', `Ungültiges Inventarfeld: ${field}.`);
      }
      const ids = new Set();
      for (const cap of app.capabilities) {
        text(cap.id, 'capability.id', 200);
        if (ids.has(normalize(cap.id)) || !['implemented', 'partial', 'absent', 'unknown'].includes(cap.implementation))
          throw new DomainError('invalid_catalog', 'Ungültige oder doppelte Capability.');
        ids.add(normalize(cap.id));
        for (const field of ['title', 'description', 'limitations']) {
          if (cap[field] !== undefined && typeof cap[field] !== 'string')
            throw new DomainError('invalid_catalog', `Ungültiger Capability-Text: ${field}.`);
        }
        for (const field of ['aliases', 'requires', 'alternatives', 'evidence']) {
          if (cap[field] !== undefined && (!Array.isArray(cap[field]) || cap[field].some(v => typeof v !== 'string' || !v.trim())))
            throw new DomainError('invalid_catalog', `Ungültiges Feld: ${field}.`);
        }
      }
    }
    this.catalog = structuredClone(catalog);
    this.now = now;
  }
  app(application) {
    text(application, 'application', 200);
    return this.catalog.applications.find(a => normalize(a.id) === normalize(application));
  }
  match(app, query) {
    const q = normalize(text(query, 'function', 2000));
    const exact = app?.capabilities.find(c => normalize(c.id) === q);
    if (exact) return exact;
    const matches = (app?.capabilities || []).filter(c => [c.id, c.title, ...(c.aliases || [])]
      .filter(Boolean).some(name => normalize(name) === q));
    return matches.length === 1 ? matches[0] : matches.length > 1 ? null : undefined;
  }
  discoveryStatus(app) {
    const required = app.discovery_requires || [];
    if (required.some(p => app.permissions?.[p] === false))
      return result('permission_denied', 'Keine Berechtigung zur Funktionsabfrage; keine Aussage über fehlende Implementierung.');
    if (required.some(p => app.permissions?.[p] !== true))
      return result('unknown', 'Berechtigung zur Funktionsabfrage ist unbekannt.');
  }
  fresh(record) {
    const age = this.now() - Date.parse(record.verified_at);
    return Number.isFinite(age) && age >= -60000 && age <= (this.catalog.max_age_days ?? 30) * 86400000;
  }
  inspect(app, cap) {
    const extra = { capability: cap.id, implementation_status: cap.implementation, evidence: cap.evidence || [],
      description: cap.description || '', limitations: cap.limitations || '', verified_at: cap.verified_at || null,
      basis: 'catalog_snapshot' };
    // Permissions are trusted server configuration, never caller-supplied grants.
    const required = cap.requires || [];
    if (required.some(p => app.permissions?.[p] === false))
      return result('permission_denied', 'Eine erforderliche Berechtigung fehlt. Daraus folgt keine fehlende Implementierung.', extra);
    if (required.some(p => app.permissions?.[p] !== true))
      return result('unknown', 'Die erforderlichen Berechtigungen sind nicht geprüft.', extra);
    if (!this.fresh(cap) || !cap.evidence?.length)
      return result('unknown', 'Es fehlen aktuelle Belege für den Funktionsstatus.', extra);
    if (cap.implementation === 'implemented') return result('available', 'Die Funktion ist laut geprüftem Katalog vorhanden.', extra);
    if (cap.implementation === 'partial' && cap.limitations)
      return result('partially_available', cap.limitations, extra);
    if (cap.implementation === 'absent') return result('not_implemented', 'Die Funktion ist nachweislich noch nicht implementiert.', extra);
    return result('unknown', 'Der Katalog enthält keinen gesicherten Implementierungsstatus.', extra);
  }
  alternatives(application, query) {
    const app = this.app(application), cap = this.match(app, query);
    if (!app || !cap) return { alternatives: [], explanation: 'Kein eindeutiger Katalogeintrag; mögliche Kandidaten müssen zuerst konkret geprüft werden.' };
    const access = this.discoveryStatus(app);
    if (access) return { ...access, alternatives: [] };
    const alternatives = (cap.alternatives || []).flatMap(id => {
      const other = app.capabilities.find(c => c.id === id);
      if (!other || other.id === cap.id) return [];
      const check = this.inspect(app, other);
      return ['available', 'partially_available'].includes(check.status)
        ? [{ function: other.id, title: other.title || other.id, status: check.status,
          description: other.description || '', limitations: other.limitations || '', evidence: check.evidence }] : [];
    });
    return { alternatives, explanation: alternatives.length
      ? 'Diese geprüften Funktionen sind mögliche Alternativen; sie erfüllen nicht automatisch den gesamten Wunsch.'
      : 'Keine aktuell verfügbare, belegte Alternative im Katalog.' };
  }
  check(application, query) {
    const app = this.app(application), cap = this.match(app, query);
    const common = { application, requested_function: query, execution_performed: false };
    if (!app) return result('unknown', 'Diese Anwendung ist nicht im Katalog erfasst.', common);
    const access = this.discoveryStatus(app);
    if (access) return { ...common, ...access };
    if (cap === null) return result('unknown', 'Mehrere Katalogeinträge passen. Gewünschte Funktion präzisieren.', common);
    if (!cap) {
      // Only a current, explicitly complete inventory proves absence.
      const complete = app.inventory_complete === true && this.fresh(app) && app.evidence?.length;
      return result(complete ? 'not_implemented' : 'unknown', complete
        ? 'Im aktuellen vollständigen Funktionsinventar fehlt diese Funktion.'
        : 'Kein eindeutiger Eintrag. Ein unvollständiger Katalog beweist keine fehlende Funktion.', common);
    }
    const check = this.inspect(app, cap), alt = this.alternatives(application, query);
    if (check.status === 'not_implemented' && alt.alternatives.length)
      return result('alternative_available', 'Die gewünschte Funktion fehlt, aber geprüfte Alternativen sind vorhanden.', { ...common, ...check, status: 'alternative_available', label: labels.alternative_available, explanation: 'Die gewünschte Funktion ist nicht implementiert. Geprüfte Alternativen sind verfügbar.', alternatives: alt.alternatives });
    return { ...common, ...check, alternatives: alt.alternatives };
  }
}

function validateRequest(r) {
  if (!/^FR-[a-f0-9-]{36}$/.test(r.id) || !STATUSES.includes(r.status) || !PRIORITIES.includes(r.priority))
    throw new DomainError('storage_corrupt', 'Ungültiger gespeicherter Vorschlag.');
  for (const field of ['title', 'description', 'application', 'function', 'desired_behavior']) text(r[field], field);
  if (!Array.isArray(r.alternatives) || !Array.isArray(r.variants) || !Array.isArray(r.history)
    || !Number.isInteger(r.occurrences) || r.occurrences < 1)
    throw new DomainError('storage_corrupt', 'Unvollständiger gespeicherter Vorschlag.');
  if (r.status === 'umgesetzt' && !validProof(r.implementation_proof))
    throw new DomainError('storage_corrupt', 'Umsetzungsstatus ohne Entwicklungs-, Test- und Freigabebeleg.');
}
const validProof = p => p && /^[a-f0-9]{7,40}$/i.test(p.commit)
  && Array.isArray(p.tests) && p.tests.length && p.tests.every(t => typeof t === 'string' && t.trim())
  && typeof p.approval === 'string' && p.approval.trim();

export class FeatureStore {
  constructor(file) { this.file = path.resolve(file); }
  read() {
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (data.schema_version !== 1 || !Array.isArray(data.requests)) throw new Error();
      data.requests.forEach(validateRequest);
      if (new Set(data.requests.map(r => r.id)).size !== data.requests.length) throw new Error();
      return data;
    } catch (e) {
      if (e.code === 'ENOENT') return { schema_version: 1, requests: [] };
      if (['EACCES', 'EPERM'].includes(e.code)) throw new DomainError('permission_denied', 'Keine Leseberechtigung für die lokale Aufgabenliste.');
      throw new DomainError('storage_corrupt', 'Die Aufgabenliste ist ungültig; vorhandene Daten werden nicht überschrieben.');
    }
  }
  transaction(change) {
    const lock = `${this.file}.lock`, temp = `${this.file}.${randomUUID()}.tmp`;
    let held = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
      const fd = fs.openSync(lock, 'wx', 0o600); held = true; fs.closeSync(fd);
      const data = this.read(), result = change(data);
      fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      fs.renameSync(temp, this.file);
      return result;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      if (e.code === 'EEXIST') throw new DomainError('storage_busy', 'Aufgabenliste wird gerade geändert. Erneut versuchen; Lock nicht automatisch löschen.');
      if (['EACCES', 'EPERM'].includes(e.code)) throw new DomainError('permission_denied', 'Keine Schreibberechtigung für die lokale Aufgabenliste.');
      throw new DomainError('storage_error', 'Aufgabenliste konnte nicht gespeichert werden.');
    } finally {
      if (held) {
        if (fs.existsSync(temp)) fs.unlinkSync(temp);
        fs.unlinkSync(lock);
      }
    }
  }
  create(input, registry) {
    if (input.confirmed !== true) throw new DomainError('confirmation_required', 'Vorschlag erst nach ausdrücklicher Bestätigung des Benutzers speichern.');
    const request = Object.fromEntries(['title', 'description', 'application', 'function', 'desired_behavior']
      .map(name => [name, text(input[name], name, ['application', 'function'].includes(name) ? 200 : 10000)]));
    const priority = input.priority ?? 'normal';
    if (!PRIORITIES.includes(priority)) throw new DomainError('invalid_input', 'Ungültige Priorität.');
    const alternatives = registry.alternatives(request.application, request.function).alternatives;
    return this.transaction(data => {
      const now = new Date().toISOString();
      const duplicate = data.requests.find(r => key(r) === key(request));
      if (duplicate) {
        duplicate.occurrences += 1;
        duplicate.updated_at = now;
        duplicate.variants.push({ title: request.title, description: request.description, created_at: now });
        if (PRIORITIES.indexOf(priority) > PRIORITIES.indexOf(duplicate.priority)) duplicate.priority = priority;
        duplicate.alternatives = alternatives;
        return { request: duplicate, merged: true, possible_duplicates: [] };
      }
      const created = { id: `FR-${randomUUID()}`, ...request, alternatives, priority, status: 'offen',
        created_at: now, updated_at: now, occurrences: 1, variants: [], history: [],
        capability_at_creation: registry.check(request.application, request.function) };
      // Similar wording is suggested for review, never silently merged (negations matter).
      const tokens = s => new Set(normalize(s).split(' '));
      const wanted = tokens(request.desired_behavior);
      const possible = data.requests.filter(r => normalize(r.application) === normalize(request.application)
        && normalize(r.function) === normalize(request.function)).filter(r => {
        const other = tokens(r.desired_behavior), overlap = [...wanted].filter(t => other.has(t)).length;
        return overlap / new Set([...wanted, ...other]).size >= 0.65;
      }).map(r => r.id);
      data.requests.push(created);
      return { request: created, merged: false, possible_duplicates: possible };
    });
  }
  list({ application, status, limit = 100, offset = 0 } = {}) {
    if (status !== undefined && !STATUSES.includes(status)) throw new DomainError('invalid_input', 'Ungültiger Status.');
    if (!Number.isInteger(limit) || limit < 1 || limit > 500 || !Number.isInteger(offset) || offset < 0)
      throw new DomainError('invalid_input', 'Ungültige Seitengröße oder Position.');
    if (application !== undefined) text(application, 'application', 200);
    const requests = this.read().requests.filter(r => (!application || normalize(r.application) === normalize(application))
      && (status ? r.status === status : !['umgesetzt', 'abgelehnt'].includes(r.status)));
    return { total: requests.length, requests: requests.slice(offset, offset + limit), offset, limit };
  }
  get(id) {
    text(id, 'id', 100);
    const request = this.read().requests.find(r => r.id === id);
    if (!request) throw new DomainError('not_found', 'Vorschlag nicht gefunden. Kein Umsetzungsstatus kann behauptet werden.');
    return request;
  }
  // Deliberately not exposed as an MCP tool. Called only by the explicit developer CLI.
  updateStatus(id, status, { authorized, reason, proof } = {}) {
    if (authorized !== true) throw new DomainError('authorization_required', 'Ausdrücklich autorisierter Entwicklungsworkflow erforderlich.');
    if (!STATUSES.includes(status)) throw new DomainError('invalid_input', 'Ungültiger Status.');
    text(reason, 'reason');
    if (status === 'umgesetzt' && !validProof(proof)) throw new DomainError('proof_required', 'Commit, Tests und Freigabe müssen dokumentiert sein.');
    return this.transaction(data => {
      const r = data.requests.find(r => r.id === id);
      if (!r) throw new DomainError('not_found', 'Vorschlag nicht gefunden.');
      r.history.push({ from: r.status, to: status, reason, at: new Date().toISOString() });
      r.status = status; r.updated_at = new Date().toISOString();
      if (status === 'umgesetzt') r.implementation_proof = structuredClone(proof);
      return r;
    });
  }
}

// Pure preparation only: no network, token access, shell execution or issue creation.
export function toGithubIssue(r) {
  validateRequest(r);
  return { title: `[${r.id}] ${r.title}`, body: [
    `Lokale ID: ${r.id}`, `Anwendung: ${r.application}`, `Funktion: ${r.function}`,
    `Status: ${r.status}`, `Priorität: ${r.priority}`, '', r.description, '',
    'Gewünschtes Verhalten:', r.desired_behavior, '', 'Vorhandene Alternativen:',
    ...r.alternatives.map(a => `- ${a.title}: ${a.description} ${a.limitations}`), '',
    'Umsetzung ausschließlich über einen ausdrücklich autorisierten Entwicklungsworkflow mit Tests und Freigabe.'
  ].join('\n'), labels: ['feature-request'] };
}
