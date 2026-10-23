const { test } = require("node:test"),
  assert = require("node:assert/strict");
const B = require("../app/src/main/assets/grundschule/config.js"),
  T = require("../app/src/main/assets/grundschule/templates.js");
function storage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, String(v)),
    map,
  };
}
const config = () => B.fromLegacy("plus", { maxWert: "100" });
test("Create, update, rename, copy, restart and delete preserve identity and unrelated data", () => {
  const s = storage();
  s.setItem("mathModeSettings:plus", "old");
  let lib = T.open(s);
  const a = lib.save({ title: "Plus bis 100", config: config() });
  assert(a.id);
  assert(a.example.includes("□"));
  const renamed = lib.save({
    id: a.id,
    title: "Neuer Titel",
    config: config(),
  });
  assert.equal(renamed.id, a.id);
  assert.equal(lib.read().length, 1);
  const b = lib.save({ id: a.id, title: "Kopie", config: config() }, true);
  assert.notEqual(b.id, a.id);
  lib = T.open(s);
  assert.equal(lib.read().length, 2);
  lib.remove(a.id);
  assert.equal(lib.read()[0].id, b.id);
  assert.equal(s.getItem("mathModeSettings:plus"), "old");
  assert.throws(
    () => lib.save({ id: a.id, title: "alt", config: config() }),
    /entfernt/,
  );
});
test("Imported IDs and equal titles never overwrite a personal template", () => {
  const s = storage(),
    lib = T.open(s),
    a = lib.save({ title: "Gleich", config: config() });
  const added = lib.importTemplates([a, a]);
  assert.equal(lib.read().length, 3);
  assert.equal(new Set([a.id, ...added.map((t) => t.id)]).size, 3);
});
test("Malformed input, corrupt library, quota failure and stale edits preserve stored records", () => {
  const s = storage(),
    lib = T.open(s),
    a = lib.save({ title: "Gut", config: config() }),
    before = s.getItem(T.KEY);
  assert.throws(() => lib.importTemplates([{ title: "kaputt", config: {} }]));
  assert.equal(s.getItem(T.KEY), before);
  const invalid = config();
  invalid.max = 0;
  assert.throws(() => lib.save({ title: "Ungültig", config: invalid }));
  assert.equal(s.getItem(T.KEY), before);
  s.setItem(T.KEY, "{bad");
  assert.throws(() => lib.read(), /beschädigt/);
  assert.equal(s.getItem(T.KEY), "{bad");
  s.setItem(T.KEY, before);
  const full = {
    getItem: s.getItem,
    setItem: () => {
      throw Error("quota");
    },
  };
  assert.throws(
    () => T.open(full).save({ title: "voll", config: config() }),
    /Speichern nicht möglich/,
  );
  assert.equal(s.getItem(T.KEY), before);
  assert.throws(
    () =>
      lib.save({
        id: a.id,
        title: "alt",
        config: config(),
        expectedUpdatedAt: "stale",
      }),
    /inzwischen geändert/,
  );
});
