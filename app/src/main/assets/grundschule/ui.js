(function (root) {
  "use strict";
  const B = root.MatheBuilder,
    T = root.MatheTemplates;
  const $ = (id) => document.getElementById(id),
    copy = B.clone;
  let config = null,
    selected = "result",
    template = null,
    sourceMode = "plus",
    family = "plus";
  const names = {
    plus: "Plus",
    minus: "Minus",
    mix: "Plus & Minus",
    mixMD: "Mal & Geteilt",
    mixALL: "Alle Rechenarten",
    chain: "Rechenketten",
  };
  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function button(text, fn, cls) {
    const b = el("button", text, cls);
    b.type = "button";
    b.onclick = () => safe(fn);
    return b;
  }
  function safe(fn) {
    try {
      return fn();
    } catch (e) {
      $("builderStatus").textContent = e.message;
      $("builderStatus").scrollIntoView({ block: "nearest" });
    }
  }
  function key() {
    return "mathBuilderLast:grade" + activeGrade + ":" + family;
  }
  function library() {
    return T.open(appStorage);
  }
  function persist() {
    if (!template) appStorage.setItem(key(), JSON.stringify(config));
    $("builderPreview").dataset.stale = "true";
    $("builderPreview").setAttribute(
      "aria-label",
      "Vorherige Vorschau. Nach einer Änderung bitte neu erzeugen.",
    );
    $("builderErrors").replaceChildren();
    for (const e of B.validate(config)) {
      const p = el("p", e.message);
      p.dataset.field = e.field;
      $("builderErrors").appendChild(p);
    }
    renderBoxes();
  }
  function field(parent, title, type, value, onchange) {
    const label = el("label", title);
    const input = el("input");
    input.type = type;
    input.value = value;
    if (type === "number") {
      input.min = "0";
      input.max = "1000";
      input.inputMode = "numeric";
    }
    input.onchange = () => {
      safe(() => {
        onchange(type === "number" ? Number(input.value) : input.value);
        persist();
      });
    };
    label.appendChild(input);
    parent.appendChild(label);
    return input;
  }
  function check(parent, title, value, onchange) {
    const label = el("label", undefined, "builder-check");
    const input = el("input");
    input.type = "checkbox";
    input.checked = !!value;
    input.onchange = () =>
      safe(() => {
        onchange(input.checked);
        persist();
      });
    label.append(input, el("span", title));
    parent.append(label);
    return input;
  }
  function select(parent, title, options, value, onchange) {
    const label = el("label", title),
      input = el("select");
    for (const [v, text] of options) {
      const o = el("option", text);
      o.value = v;
      input.append(o);
    }
    input.value = value;
    input.onchange = () =>
      safe(() => {
        onchange(input.value);
        if (config) {
          persist();
          renderEditor();
        }
      });
    label.append(input);
    parent.append(label);
    return input;
  }
  function title(c) {
    return B.label(c).replace("Nur ", "") + " bis " + c.max;
  }
  function numberText(n) {
    return n.kind === "fixed"
      ? String(n.value)
      : n.kind === "rows"
        ? "Reihen"
        : `${n.min}–${n.max}`;
  }
  function opText(o) {
    return o.allowed.length === 1
      ? B.symbols[o.allowed[0]]
      : o.allowed.length === 2 &&
          o.allowed.includes("plus") &&
          o.allowed.includes("minus")
        ? "±"
        : o.allowed.length === 2 &&
            o.allowed.includes("mal") &&
            o.allowed.includes("geteilt")
          ? "× ÷"
          : "Mix";
  }
  function renderBoxes() {
    const box = $("builderBoxes"),
      specs = [];
    config.numbers.forEach((n, i) => {
      if (i) {
        const o = config.operators[i - 1];
        specs.push({
          id: o.id,
          text: opText(o),
          query: o.query,
          label:
            "Rechenzeichen " +
            i +
            ": " +
            o.allowed.map((op) => B.symbols[op]).join(" oder "),
        });
      }
      specs.push({
        id: n.id,
        text: numberText(n),
        query: n.query,
        label: i + 1 + ". Zahl: " + numberText(n),
      });
    });
    specs.push(
      { id: "equals", text: "=" },
      { id: "result", text: "?", query: config.resultQuery, label: "Ergebnis" },
    );
    const existing = Array.from(box.children);
    const same =
      existing.length === specs.length &&
      existing.every((node, i) => node.dataset.slot === specs[i].id);
    if (!same) box.replaceChildren();
    specs.forEach((spec, i) => {
      let node = same
        ? existing[i]
        : spec.id === "equals"
          ? el("span", undefined, "builder-equals")
          : button(
              "",
              () => {
                selected = spec.id;
                renderBoxes();
                renderSlot();
              },
              "builder-box",
            );
      node.dataset.slot = spec.id;
      node.textContent = spec.text;
      if (spec.id !== "equals") {
        node.setAttribute(
          "aria-invalid",
          String(B.validate(config).some((e) => e.field === spec.id)),
        );
        node.setAttribute(
          "aria-label",
          spec.label + (spec.query ? " · darf abgefragt werden" : ""),
        );
        node.setAttribute("aria-pressed", String(selected === spec.id));
        if (spec.query) node.append(el("small", "Lücke möglich"));
      }
      if (!same) box.append(node);
    });
    $("builderAdd").disabled = config.numbers.length >= 10;
  }
  function insert(index) {
    if (config.numbers.length >= 10) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    config.numbers.splice(index, 0, B.numberSlot("n" + id, 1, 9));
    config.operators.splice(Math.max(0, index - 1), 0, {
      id: "o" + id,
      allowed: config.operators[Math.max(0, index - 1)]?.allowed.slice() || [
        "plus",
      ],
      query: false,
    });
    config.table = false;
    selected = config.numbers[index].id;
    persist();
    renderEditor();
  }
  function renderSlot() {
    const panel = $("builderSlot");
    panel.replaceChildren();
    if (selected === "result") {
      panel.append(el("h3", "Ergebnis"));
      check(
        panel,
        "Dieses Kästchen darf abgefragt werden",
        config.resultQuery,
        (v) => (config.resultQuery = v),
      );
      panel.append(
        el(
          "p",
          "Pro Aufgabe fehlt genau eines der markierten Kästchen. Markiere mehrere Positionen, damit die Lücke von Aufgabe zu Aufgabe wechseln kann.",
        ),
      );
      return;
    }
    const n = config.numbers.find((n) => n.id === selected),
      o = config.operators.find((o) => o.id === selected);
    if (o) {
      panel.append(el("h3", "Rechenzeichen"));
      const group = el("div", undefined, "builder-actions");
      Object.keys(B.symbols).forEach((op) => {
        const b = button(
          B.symbols[op] +
            " " +
            { plus: "Plus", minus: "Minus", mal: "Mal", geteilt: "Geteilt" }[
              op
            ],
          () => {
            if (o.allowed.includes(op)) {
              if (o.allowed.length === 1)
                throw Error(
                  "Mindestens ein Rechenzeichen muss ausgewählt bleiben.",
                );
              o.allowed = o.allowed.filter((x) => x !== op);
            } else o.allowed.push(op);
            persist();
            renderSlot();
          },
        );
        b.setAttribute("aria-pressed", String(o.allowed.includes(op)));
        group.append(b);
      });
      panel.append(group);
      check(
        panel,
        "Dieses Kästchen darf abgefragt werden",
        o.query,
        (v) => (o.query = v),
      );
      return;
    }
    if (!n) {
      selected = "result";
      renderSlot();
      return;
    }
    const i = config.numbers.indexOf(n);
    panel.append(el("h3", i + 1 + ". Zahl"));
    select(
      panel,
      "Zahl auswählen",
      [
        ["range", "Zufallszahl aus einem Bereich"],
        ["fixed", "Feste Zahl – immer derselbe Wert"],
        ["rows", "Zahl aus ausgewählten Einmaleinsreihen"],
      ],
      n.kind,
      (v) => {
        n.kind = v;
        if (v === "fixed" && !Number.isInteger(n.value)) n.value = n.min;
      },
    );
    if (n.kind === "fixed")
      field(panel, "Feste Zahl", "number", n.value, (v) => (n.value = v));
    else {
      const presets = el("div", undefined, "builder-actions");
      for (const [lo, hi] of [
        [0, 9],
        [1, 9],
        [10, 99],
        [100, 999],
      ])
        presets.append(
          button(lo + "–" + hi, () => {
            n.kind = "range";
            n.min = lo;
            n.max = hi;
            n.allowZero = lo === 0;
            persist();
            renderSlot();
          }),
        );
      panel.append(presets);
      const row = el("div", undefined, "builder-fields");
      field(row, "Minimum", "number", n.min, (v) => (n.min = v));
      field(row, "Maximum", "number", n.max, (v) => (n.max = v));
      panel.append(row);
    }
    check(panel, "Null erlauben", n.allowZero, (v) => (n.allowZero = v));
    check(
      panel,
      "Dieses Kästchen darf abgefragt werden",
      n.query,
      (v) => (n.query = v),
    );
    const actions = el("div", undefined, "builder-actions");
    const before = button("Davor einfügen", () => insert(i)),
      after = button("Danach einfügen", () => insert(i + 1)),
      remove = button("Rechenglied entfernen", () => {
        if (config.numbers.length <= 2) return;
        config.numbers.splice(i, 1);
        config.operators.splice(i === 0 ? 0 : i - 1, 1);
        selected = "result";
        persist();
        renderEditor();
      });
    before.disabled = after.disabled = config.numbers.length >= 10;
    remove.disabled = config.numbers.length <= 2;
    actions.append(before, after, remove);
    panel.append(actions);
  }
  function renderEditor() {
    if (!config) return;
    config.legacy = config.legacy || {};
    renderBoxes();
    renderSlot();
    const rules = $("builderRules");
    rules.replaceChildren();
    select(
      rules,
      "Aufgabenformat",
      [
        ["gap", "Ein fehlendes Kästchen"],
        ["wahrfalsch", "Richtig oder falsch?"],
        ["compare", "Rechnungen vergleichen (< > =)"],
      ],
      config.format || "gap",
      (v) => (config.format = v),
    );
    select(
      rules,
      "Schwierigkeit",
      [
        ["standard", "Normal"],
        ["easy", "Einfach"],
        ["hard", "Schwer"],
        ["mixed", "Automatisch (passt sich an)"],
      ],
      config.difficulty || "standard",
      (v) => (config.difficulty = v),
    );
    select(
      rules,
      "Kettenlänge",
      [
        ["fixed", "Feste Anzahl der sichtbaren Zahlen"],
        ["mixed", "Gemischte Länge: 2 bis zur sichtbaren Anzahl"],
      ],
      config.lengthMode || "fixed",
      (v) => (config.lengthMode = v),
    );
    select(
      rules,
      "Aufbau der Rechenkette",
      [
        ["free", "Rechenzeichen frei mischen"],
        ["terms", "Mal/Geteilt-Blöcke mit Plus/Minus verbinden"],
        ["startHigh", "Zuerst Mal/Geteilt, danach Plus/Minus"],
        ["mixed", "Aufbau zufällig mischen"],
      ],
      config.pattern || "free",
      (v) => (config.pattern = v),
    );
    const fields = el("div", undefined, "builder-fields");
    field(
      fields,
      "Maximales Ergebnis",
      "number",
      config.max,
      (v) => (config.max = v),
    );
    field(
      fields,
      "Grenze aller Zahlen und Zwischenwerte",
      "number",
      config.intermediateMax,
      (v) => (config.intermediateMax = v),
    );
    field(
      fields,
      "Aufgaben pro Runde",
      "number",
      config.taskCount,
      (v) => (config.taskCount = v),
    );
    rules.append(fields);
    field(
      rules,
      "Zeitlimit pro Runde in Sekunden (0 = aus)",
      "number",
      Number(config.legacy.timeLimitSec) || 0,
      (v) => (config.legacy.timeLimitSec = String(v)),
    );
    check(
      rules,
      "Kopfrechnen (Blitz): Zahlen nach kurzer Anzeige ausblenden",
      config.legacy.flashMode === "1",
      (v) => {
        config.legacy.flashMode = v ? "1" : "0";
        renderEditor();
      },
    );
    if (config.legacy.flashMode === "1") {
      field(
        rules,
        "Blitz-Anzeige in Sekunden",
        "number",
        Number(config.legacy.flashShowSec) || 4,
        (v) => (config.legacy.flashShowSec = String(v)),
      );
      field(
        rules,
        "Nochmals anzeigen in Sekunden",
        "number",
        Number(config.legacy.flashPeekSec) || 2,
        (v) => (config.legacy.flashPeekSec = String(v)),
      );
    }
    check(
      rules,
      "Bei richtiger Antwort automatisch weiter",
      autoNextCorrectEnabled(),
      (v) => setAutoNextCorrect(v),
    );
    select(
      rules,
      "Zehnerübergang / Entleihen",
      [
        ["any", "Beliebig"],
        ["with", "Mit Übergang bei jedem Plus-/Minusschritt"],
        ["without", "Ohne Übergang bei allen Plus-/Minusschritten"],
      ],
      config.carry,
      (v) => (config.carry = v),
    );
    rules.append(
      el(
        "p",
        "Punkt vor Strich · gleichrangig von links · keine negativen Zwischenwerte · Division ganzzahlig ohne Rest. Klammeraufgaben findest du weiterhin unter „Gemischte Malaufgaben“.",
      ),
    );
    const table = $("builderTable");
    table.replaceChildren();
    check(
      table,
      "Einmaleinsreihen für Mal/Geteilt verwenden",
      config.table,
      (v) => {
        config.table = v;
        renderEditor();
      },
    );
    if (config.table || config.numbers.some((n) => n.kind === "rows")) {
      select(
        table,
        "Zahlenprofil",
        [
          ["table9", "Kleines 1×1 (1–9)"],
          ["table", "1×1 bis 10"],
          ["tens", "Zehnerzahlen"],
          ["free", "Frei (auch über 10)"],
        ],
        config.profile,
        (v) => (config.profile = v),
      );
      const quick = el("div", undefined, "builder-actions");
      for (const [label, rows] of [
        ["Alle Reihen", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
        ["2er-, 5er-, 10er-Reihe", [2, 5, 10]],
        ["Reihen 2 bis 9", [2, 3, 4, 5, 6, 7, 8, 9]],
        ["Eigene Auswahl", []],
      ])
        quick.append(
          button(label, () => {
            config.rows = rows.slice();
            persist();
            renderEditor();
          }),
        );
      table.append(quick);
      const chips = el("div", undefined, "builder-actions");
      for (let r = 1; r <= 10; r++) {
        const b = button(r + "er", () => {
          config.rows = config.rows.includes(r)
            ? config.rows.filter((n) => n !== r)
            : [...config.rows, r];
          persist();
          renderEditor();
        });
        b.setAttribute("aria-pressed", String(config.rows.includes(r)));
        chips.append(b);
      }
      table.append(chips);
      select(
        table,
        "Quadratzahlen",
        [
          ["normal", "Normale Einmaleinsaufgaben"],
          ["only", "Nur Quadratzahlen / passende Division"],
          ["mix", "Quadratzahlen zusätzlich beimischen"],
        ],
        config.square,
        (v) => (config.square = v),
      );
    }
    $("builderSummary").textContent = B.label(config) + " · bis " + config.max;
  }
  function getActive() {
    const raw = appStorage.getItem("mathBuilderActive_v1");
    if (!raw)
      throw Error("Bitte zuerst eine Übung im Aufgabenbaukasten starten.");
    const c = JSON.parse(raw),
      errors = B.validate(c);
    if (errors.length) throw Error(errors[0].message);
    return c;
  }
  function start() {
    B.generate(config);
    appStorage.setItem(
      modeSettingsKey("builder"),
      JSON.stringify({
        ...config.legacy,
        taskCount: String(config.taskCount),
        maxWert: String(config.intermediateMax),
      }),
    );
    appStorage.setItem("mathBuilderActive_v1", JSON.stringify(config));
    persist();
    $("builderEditor").hidden = true;
    $("builderChoice").hidden = true;
    $("builderHome").open = false;
    $("viewSelect").value = "builder";
    wechselAnsicht(true);
  }
  function openFamily(mode) {
    $("builderHome").dataset.screen = "detail";
    family = mode;
    sourceMode = mode;
    template = null;
    const raw = appStorage.getItem(key());
    config = raw
      ? JSON.parse(raw)
      : B.fromLegacy(mode, loadModeSettings(mode) || {}, activeGrade);
    const selectedOps = [
      ...new Set(config.operators.flatMap((o) => o.allowed)),
    ];
    if ((mode === "mixMD" || mode === "mix") && selectedOps.length === 1)
      sourceMode = selectedOps[0];
    if (B.validate(config).some((e) => e.field === "config"))
      throw Error(
        "Die gespeicherte Konfiguration ist unbekannt. Bitte eine Vorlage oder die bisherigen Einstellungen öffnen.",
      );
    $("builderStatus").textContent = "";
    $("builderEditor").hidden = true;
    $("builderChoice").hidden = false;
    $("builderFamilyTitle").textContent = names[mode] || mode;
    const quick = $("builderQuick");
    quick.replaceChildren();
    const modes =
      mode === "mix"
        ? ["plus", "minus", "mix"]
        : mode === "mixMD"
          ? ["mal", "geteilt", "mixMD"]
          : [];
    const quickNames = {
      plus: "Nur Plus",
      minus: "Nur Minus",
      mix: "Plus und Minus gemischt",
      mal: "Nur Mal",
      geteilt: "Nur Geteilt",
      mixMD: "Mal und Geteilt gemischt",
    };
    for (const m of modes) {
      const b = button(quickNames[m], () => {
        sourceMode = m;
        const ops =
          m === "mix"
            ? ["plus", "minus"]
            : m === "mixMD"
              ? ["mal", "geteilt"]
              : [m];
        config.operators.forEach((o) => (o.allowed = ops.slice()));
        if (ops.includes("geteilt"))
          config.numbers.slice(1).forEach((n) => (n.allowZero = false));
        persist();
        renderEditor();
        Array.from(quick.children).forEach((x) =>
          x.setAttribute("aria-pressed", "false"),
        );
        b.setAttribute("aria-pressed", "true");
      });
      const ops = config.operators.flatMap((o) => o.allowed);
      b.setAttribute(
        "aria-pressed",
        String(
          m === "mix"
            ? ops.includes("plus") && ops.includes("minus")
            : m === "mixMD"
              ? ops.includes("mal") && ops.includes("geteilt")
              : ops.every((op) => op === m),
        ),
      );
      quick.append(b);
    }
    $("builderQuickPractice").onclick = () =>
      safe(() => {
        if (appStorage.getItem(key())) start();
        else {
          $("builderHome").open = false;
          $("builderChoice").hidden = true;
          $("viewSelect").value = sourceMode;
          wechselAnsicht(true);
        }
      });
    $("builderTitle").value = title(config);
    $("builderSave").textContent = "Als eigene Vorlage speichern";
    selected = "result";
    renderEditor();
    $("builderHome").open = true;
    $("builderChoice").scrollIntoView({ block: "nearest" });
  }
  function edit(t) {
    $("builderHome").dataset.screen = "detail";
    config = copy(t.config);
    family = config.family;
    sourceMode = family;
    template = copy(t);
    selected = "result";
    $("builderTitle").value = t.title;
    $("builderSave").textContent = "Änderungen speichern";
    $("builderChoice").hidden = true;
    $("builderEditor").hidden = false;
    $("builderHome").open = true;
    renderEditor();
    $("builderEditor").scrollIntoView({ block: "start" });
  }
  function renderLibrary() {
    const list = $("builderLibrary");
    list.replaceChildren();
    for (const t of library().read()) {
      const card = el("article", undefined, "builder-card");
      card.append(
        el("h3", t.title),
        el("p", t.example),
        el(
          "p",
          B.label(t.config) +
            " · " +
            (t.config.table
              ? (t.config.square === "only" ? "Quadratzahlen · " : "") +
                t.config.rows.join("er, ") +
                "er-Reihe"
              : t.config.carry === "with"
                ? "Mit Zehnerübergang"
                : t.config.carry === "without"
                  ? "Ohne Zehnerübergang"
                  : "bis " + t.config.max),
        ),
      );
      const actions = el("div", undefined, "builder-actions");
      actions.append(
        button("Üben", () => {
          config = copy(t.config);
          family = config.family;
          template = t;
          start();
        }),
        button("Bearbeiten", () => edit(t)),
        button("× Entfernen", () => {
          if (confirm("Vorlage „" + t.title + "“ wirklich löschen?")) {
            library().remove(t.id);
            renderLibrary();
          }
        }),
      );
      card.append(actions);
      list.append(card);
    }
    if (!list.children.length)
      list.append(
        el(
          "p",
          "Hier erscheinen deine gespeicherten Übungen. Öffne eine Hauptkachel und tippe auf „Konfigurieren“.",
        ),
      );
  }
  function save(asCopy) {
    const saved = library().save(
      {
        id: template?.id,
        title: $("builderTitle").value,
        config,
        expectedUpdatedAt: template?.updatedAt,
      },
      asCopy,
    );
    template = saved;
    $("builderSave").textContent = "Änderungen speichern";
    $("builderStatus").textContent = "Vorlage gespeichert.";
    renderLibrary();
  }
  function init() {
    const home = el("details", undefined, "builder-home");
    home.id = "builderHome";
    home.dataset.screen = "home";
    home.append(el("summary", "Aufgaben · Meine Aufgaben"));
    const body = el("div", undefined, "builder-body");
    const back = button("← Aufgabenübersicht", () => {
      home.dataset.screen = "home";
      $("builderChoice").hidden = true;
      $("builderEditor").hidden = true;
    });
    back.id = "builderBack";
    body.append(back);
    select(
      body,
      "Klasse / eigene Einstellungen",
      [
        ["0", "Eigene Einstellungen"],
        ["1", "Klasse 1"],
        ["2", "Klasse 2"],
        ["3", "Klasse 3"],
        ["4", "Klasse 4"],
      ],
      activeGrade,
      (value) => {
        applyPreset(value);
        config = null;
        $("builderChoice").hidden = true;
        $("builderEditor").hidden = true;
      },
    ).parentElement.classList.add("builder-navigation");
    const cards = el("div", undefined, "builder-grid builder-navigation");
    for (const mode of Object.keys(names))
      cards.append(
        button(names[mode], () => openFamily(mode), "builder-main-tile"),
      );
    cards.append(
      button("Meine Aufgaben", () => {
        $("builderLibrarySection").scrollIntoView({ block: "start" });
      }),
    );
    body.append(cards);
    const special = el("details", undefined, "builder-navigation");
    special.append(
      el("summary", "Weitere Aufgaben · Pyramide, Traube und mehr"),
    );
    const grid = el("div", undefined, "builder-grid");
    for (const mode of [
      "pyramide",
      "traube",
      "mixedMal",
      "squareMal",
      "squareDiv",
      "double",
      "half",
      "fehler",
    ]) {
      const option = Array.from($("viewSelect").options).find(
        (o) => o.value === mode,
      );
      grid.append(
        button(option?.dataset.baseLabel || option?.textContent || mode, () => {
          $("viewSelect").value = mode;
          home.open = false;
          wechselAnsicht(true);
        }),
      );
    }
    special.append(grid);
    body.append(special);
    const choice = el("section");
    choice.id = "builderChoice";
    choice.hidden = true;
    choice.append(
      Object.assign(el("h2"), { id: "builderFamilyTitle" }),
      Object.assign(el("div", undefined, "builder-actions"), {
        id: "builderQuick",
      }),
      Object.assign(el("p"), { id: "builderSummary" }),
    );
    const actions = el("div", undefined, "builder-actions");
    const practice = button("Üben", () => {});
    practice.id = "builderQuickPractice";
    actions.append(
      practice,
      button("Konfigurieren", () => {
        $("builderEditor").hidden = false;
        renderEditor();
      }),
      button("Bisherige Einstellungen", () => {
        $("viewSelect").value = sourceMode;
        home.open = false;
        wechselAnsicht(false);
        $("settingsDetails").open = true;
      }),
    );
    choice.append(actions);
    body.append(choice);
    const editor = el("section");
    editor.id = "builderEditor";
    editor.hidden = true;
    editor.append(el("h2", "Aufgabenbaukasten"));
    const boxes = el("div", undefined, "builder-boxes");
    boxes.id = "builderBoxes";
    editor.append(boxes);
    const slot = el("div", undefined, "builder-slot");
    slot.id = "builderSlot";
    editor.append(slot);
    const add = button("+ Rechenglied", () => insert(config.numbers.length));
    add.id = "builderAdd";
    editor.append(add);
    const gapActions = el("div", undefined, "builder-actions");
    gapActions.append(
      button("Nur Ergebnis abfragen", () => {
        config.resultQuery = true;
        config.numbers.forEach((n) => (n.query = false));
        config.operators.forEach((o) => (o.query = false));
        persist();
        renderSlot();
      }),
      button("Zufällige Zahl oder Ergebnis", () => {
        config.resultQuery = true;
        config.numbers.forEach((n) => (n.query = true));
        config.operators.forEach((o) => (o.query = false));
        persist();
        renderSlot();
      }),
    );
    editor.append(gapActions);
    const table = el("div");
    table.id = "builderTable";
    editor.append(table);
    const details = el("details");
    details.append(el("summary", "Weitere Rechenregeln"));
    const rules = el("div");
    rules.id = "builderRules";
    details.append(rules);
    editor.append(details);
    const errors = el("div");
    errors.id = "builderErrors";
    errors.setAttribute("role", "alert");
    editor.append(errors);
    editor.append(
      button("5 Beispielaufgaben anzeigen", () => {
        const tasks = Array.from({ length: 5 }, () => B.generate(config));
        $("builderPreview").replaceChildren(
          ...tasks.map((t) => el("li", t.expression)),
        );
        $("builderPreview").dataset.stale = "false";
        $("builderPreview").setAttribute(
          "aria-label",
          "Aktuelle Beispielaufgaben",
        );
      }),
    );
    const preview = el("ol");
    preview.id = "builderPreview";
    editor.append(preview);
    const titleInput = field(
      editor,
      "Titel der eigenen Vorlage",
      "text",
      "",
      () => {},
    );
    titleInput.id = "builderTitle";
    titleInput.onchange = null;
    const commands = el("div", undefined, "builder-actions");
    const saveButton = button("Als eigene Vorlage speichern", () =>
      save(false),
    );
    saveButton.id = "builderSave";
    commands.append(
      button("Üben", start),
      saveButton,
      button("Als weitere Vorlage speichern", () => save(true)),
      button("Vorlagen als Datei exportieren", () =>
        downloadTextFileRobust(
          "MatheKids-Meine-Aufgaben.json",
          JSON.stringify(
            {
              kind: "MatheKids-exercises",
              schema: 1,
              templates: library().read(),
            },
            null,
            2,
          ),
        ),
      ),
    );
    editor.append(commands);
    body.append(editor);
    const status = el("p");
    status.id = "builderStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    body.append(status);
    const section = el("section");
    section.id = "builderLibrarySection";
    section.append(
      button("Bibliothek sichern", () =>
        downloadTextFileRobust(
          "MatheKids-Vorlagen-Sicherung.json",
          appStorage.getItem(T.KEY) ||
            JSON.stringify({ schema: 1, templates: [] }),
        ),
      ),
    );
    section.append(
      el("h2", "Meine Aufgaben"),
      button("Neu erstellen", () => {
        openFamily("plus");
        $("builderEditor").hidden = false;
        renderEditor();
      }),
    );
    const importLabel = el("label", "Vorlagen-Datei importieren");
    const input = el("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024)
          throw Error("Bitte eine Vorlagendatei bis 1 MB wählen.");
        const data = JSON.parse(await file.text());
        if (data.kind !== "MatheKids-exercises" || data.schema !== 1)
          throw Error("Unbekanntes Dateiformat.");
        if (
          confirm(
            data.templates.length +
              " Vorlagen als neue persönliche Kacheln importieren?",
          )
        ) {
          library().importTemplates(data.templates);
          renderLibrary();
          $("builderStatus").textContent =
            "Vorlagen als neue Kacheln importiert.";
        }
      } catch (e) {
        $("builderStatus").textContent = e.message;
      } finally {
        input.value = "";
      }
    };
    importLabel.append(input);
    section.append(importLabel);
    const list = el("div", undefined, "builder-grid");
    list.id = "builderLibrary";
    section.append(list);
    body.append(section);
    home.append(body);
    $("grundschulePanel").prepend(home);
    if (window.__portableExerciseTemplates) {
      safe(() => {
        if (
          confirm("Vorlagen aus dieser HTML-Datei als neue Kacheln übernehmen?")
        )
          library().importTemplates(window.__portableExerciseTemplates);
        delete window.__portableExerciseTemplates;
      });
    }
    safe(renderLibrary);
    $("viewSelect").addEventListener("change", () => {
      $("builderEditor").hidden = true;
      $("builderChoice").hidden = true;
    });
    window.addEventListener("storage", (e) => {
      if (e.key === "RechenGuruLGI_" + T.KEY) safe(renderLibrary);
    });
  }
  root.MatheBuilderUI = {
    getActive,
    openFamily,
    edit,
    renderLibrary,
    init,
    generate: () => {
      const c = getActive();
      return B.generate(c, {
        effectiveDifficulty:
          c.difficulty === "mixed"
            ? getAdaptiveDifficulty(c.operators[0].allowed[0], "mixed")
            : c.difficulty,
      });
    },
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})(globalThis);
