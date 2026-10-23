/* Atomic local library. Import always creates local identities; titles never identify records. */
(function (root) {
  "use strict";
  const B =
    root.MatheBuilder ||
    (typeof require === "function" ? require("./config.js") : null);
  const KEY = "mathExerciseLibrary_v1";
  function id() {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    if (!root.crypto?.getRandomValues)
      throw Error(
        "Dieser Browser unterstützt keine sicheren Vorlagenkennungen. Bitte die App aktualisieren.",
      );
    return Array.from(root.crypto.getRandomValues(new Uint32Array(4)), (n) =>
      n.toString(16).padStart(8, "0"),
    ).join("-");
  }
  function open(storage) {
    let snapshot;
    function read() {
      const raw = storage.getItem(KEY);
      let data;
      try {
        data = raw ? JSON.parse(raw) : { schema: 1, templates: [] };
      } catch (_) {
        throw Error(
          "Die Vorlagenbibliothek ist beschädigt. Bitte Daten exportieren; sie wurde nicht überschrieben.",
        );
      }
      if (
        data.schema !== 1 ||
        !Array.isArray(data.templates) ||
        data.templates.some((t) => !t || typeof t.id !== "string")
      )
        throw Error(
          "Die Vorlagenbibliothek hat ein unbekanntes Format. Bitte Daten exportieren.",
        );
      snapshot = raw;
      return B.clone(data.templates);
    }
    function write(templates) {
      if (storage.getItem(KEY) !== snapshot)
        throw Error(
          "Die Vorlagen wurden in einem anderen Fenster geändert. Bitte erneut öffnen.",
        );
      const raw = JSON.stringify({ schema: 1, templates });
      try {
        storage.setItem(KEY, raw);
        if (storage.getItem(KEY) !== raw) throw Error();
      } catch (_) {
        throw Error(
          "Speichern nicht möglich. Bitte Speicherplatz prüfen oder Vorlagen exportieren.",
        );
      }
      snapshot = raw;
    }
    function save(
      { id: existing, title, config, expectedUpdatedAt },
      copy = false,
    ) {
      const list = read(),
        errors = B.validate(config);
      if (errors.length) throw Error(errors[0].message);
      title = String(title || "").trim();
      if (!title || title.length > 160)
        throw Error("Bitte einen Titel mit 1 bis 160 Zeichen eingeben.");
      const example = B.generate(config),
        now = new Date().toISOString(),
        index =
          existing && !copy ? list.findIndex((t) => t.id === existing) : -1;
      if (existing && !copy && index < 0)
        throw Error(
          "Die Vorlage wurde inzwischen entfernt. Bitte als neue Vorlage speichern.",
        );
      if (
        index >= 0 &&
        expectedUpdatedAt &&
        list[index].updatedAt !== expectedUpdatedAt
      )
        throw Error(
          "Diese Vorlage wurde inzwischen geändert. Bitte erneut öffnen oder als weitere Vorlage speichern.",
        );
      const template = {
        id: index < 0 ? id() : existing,
        title,
        config: B.clone(config),
        example:
          example.fmt === "wahrfalsch"
            ? example.solutionLines[0]
            : example.expression,
        createdAt: index < 0 ? now : list[index].createdAt,
        updatedAt: now,
        schema: 1,
      };
      if (index < 0) list.push(template);
      else list[index] = template;
      write(list);
      return B.clone(template);
    }
    function remove(key) {
      const list = read(),
        next = list.filter((t) => t.id !== key);
      if (next.length === list.length)
        throw Error("Diese Vorlage existiert nicht mehr.");
      write(next);
    }
    function importTemplates(incoming) {
      if (!Array.isArray(incoming) || incoming.length > 100)
        throw Error("Bitte höchstens 100 Vorlagen gleichzeitig importieren.");
      const list = read(),
        now = new Date().toISOString(),
        added = incoming.map((t) => {
          if (
            !t ||
            typeof t.title !== "string" ||
            !t.title.trim() ||
            t.title.length > 160
          )
            throw Error("Ungültiger Vorlagentitel.");
          const errors = B.validate(t.config);
          if (errors.length) throw Error(errors[0].message);
          const example = B.generate(t.config);
          return {
            id: id(),
            schema: 1,
            title: t.title,
            config: B.clone(t.config),
            example:
              example.fmt === "wahrfalsch"
                ? example.solutionLines[0]
                : example.expression,
            createdAt: now,
            updatedAt: now,
          };
        });
      write(list.concat(added));
      return added;
    }
    return { read, save, remove, importTemplates };
  }
  const api = { KEY, open };
  root.MatheTemplates = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
