/* Shared, pure configuration adapter for the visual primary-school editor. */
(function (root) {
  "use strict";
  const C =
    root.MatheChains ||
    (typeof require === "function" ? require("../rechenketten.js") : null);
  const symbols = { plus: "+", minus: "−", mal: "×", geteilt: "÷" };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function numberSlot(id, min = 0, max = 9) {
    return { id, kind: "range", min, max, allowZero: min === 0, query: false };
  }
  function fromLegacy(mode, s = {}, grade = "0") {
    const max = Math.max(
      5,
      Math.min(
        1000,
        Number(s.maxWert) ||
          (["mal", "geteilt", "mixMD", "mixALL"].includes(mode) ? 100 : 20),
      ),
    );
    const allowed =
      mode === "plus"
        ? ["plus"]
        : mode === "minus"
          ? ["minus"]
          : mode === "mix"
            ? ["plus", "minus"]
            : mode === "mal" || mode === "squareMal"
              ? ["mal"]
              : mode === "geteilt" || mode === "squareDiv"
                ? ["geteilt"]
                : ["mal", "geteilt"];
    if (mode === "mixALL" || mode === "chain")
      allowed.splice(
        0,
        allowed.length,
        ...(mode === "chain"
          ? C.normalizeOps(s.chainOps)
          : Object.keys(symbols)),
      );
    const count =
      mode === "chain"
        ? s.chainLength === "mixed"
          ? 10
          : Number(s.chainLength) || 4
        : Number(s.operandCount) === 3 &&
            ["plus", "minus", "mix"].includes(mode)
          ? 3
          : 2;
    const numbers = Array.from({ length: count }, (_, i) => {
      const p = s["op" + (i + 1) + "Mode"];
      return numberSlot(
        "n" + i,
        p === "tens" ? 10 : 0,
        p === "tens"
          ? Math.min(99, max)
          : p === "ones"
            ? Math.min(9, max)
            : max,
      );
    });
    const rowsRaw = s.rowTrain || "mixed";
    let rows = rowsRaw;
    try {
      rows = JSON.parse(rowsRaw);
    } catch (_) {
      if (typeof rowsRaw === "string") rows = rowsRaw.split(",");
    }
    if (!Array.isArray(rows)) rows = [rows];
    const squares = rows.includes("squares");
    const config = {
      schema: 1,
      family: mode,
      grade: String(grade),
      numbers,
      operators: Array.from({ length: count - 1 }, (_, i) => ({
        id: "o" + i,
        allowed: allowed.slice(),
        query: false,
      })),
      lengthMode:
        mode === "chain" && s.chainLength === "mixed" ? "mixed" : "fixed",
      pattern: mode === "chain" ? s.chainPattern || "free" : "free",
      resultQuery: true,
      format: ["wahrfalsch", "compare"].includes(s.taskFormat)
        ? s.taskFormat
        : "gap",
      difficulty: ["easy", "hard", "mixed"].includes(s.difficulty)
        ? s.difficulty
        : "standard",
      max,
      intermediateMax: max,
      carry: ["carry", "borrow"].includes(s.difficulty)
        ? "with"
        : ["noCarry", "noBorrow"].includes(s.difficulty)
          ? "without"
          : "any",
      rows: rows.includes("mixed")
        ? Array.from({ length: 10 }, (_, i) => i + 1)
        : rows.map(Number).filter((n) => n >= 1 && n <= 10),
      requireAllRows: !rows.includes("mixed") && rows.some(n=>/^\d+$/.test(String(n))),
      profile: s.mulProfile || "free",
      table: ["mal", "geteilt", "mixMD", "squareMal", "squareDiv"].includes(
        mode,
      ),
      square:
        mode === "squareMal" || mode === "squareDiv"
          ? "only"
          : squares
            ? "mix"
            : "normal",
      taskCount: Number(s.taskCount) || 1,
      legacy: clone(s),
    };
    if (s.onesOnly === "1" && !["plus", "minus", "mix", "chain"].includes(mode))
      numbers.slice(1).forEach((n) => (n.max = Math.min(9, n.max)));
    if (allowed.includes("geteilt"))
      numbers.slice(1).forEach((n) => (n.allowZero = false));
    if (config.profile === "table9")
      config.rows = config.rows.filter((n) => n <= 9);
    if (!config.rows.length)
      config.rows = Array.from(
        { length: config.profile === "table9" ? 9 : 10 },
        (_, i) => i + 1,
      );
    if (["squareMal", "squareDiv"].includes(mode) && !rows.some(n => /^\d+$/.test(String(n)))) {
      const rootMax = Math.floor(Math.sqrt(max));
      const limit = config.profile === "table9" ? Math.min(9, rootMax) : config.profile === "table" ? Math.min(10, rootMax) : rootMax;
      config.rows = Array.from({length:limit}, (_,i)=>i+1).filter(n=>config.profile !== "tens" || n%10===0);
    }
    if (s.taskFormat === "faktor") {
      config.resultQuery = false;
      numbers[0].query = true;
      numbers[1].query = true;
    }
    if (s.taskFormat === "operator") {
      config.resultQuery = false;
      config.operators.forEach((o) => (o.query = true));
    }
    return config;
  }
  function validate(c) {
    const errors = [];
    const add = (field, message) => errors.push({ field, message });
    if (
      !c ||
      c.schema !== 1 ||
      !Array.isArray(c.numbers) ||
      !Array.isArray(c.operators)
    )
      return [
        {
          field: "config",
          message:
            "Diese Vorlage hat ein unbekanntes Format. Bitte die App aktualisieren.",
        },
      ];
    if (
      c.numbers.length < 2 ||
      c.numbers.length > 10 ||
      c.operators.length !== c.numbers.length - 1
    )
      add(
        "chain",
        "Eine Rechnung braucht 2 bis 10 Zahlen mit je einem Zeichen dazwischen.",
      );
    for (const key of ["max", "intermediateMax"])
      if (!Number.isInteger(c[key]) || c[key] < 1 || c[key] > 1000)
        add(key, "Bitte eine ganze Grenze von 1 bis 1000 eingeben.");
    if (c.resultRule && !["auto", "max", "fixed"].includes(c.resultRule))
      add("result", "Bitte eine gültige Ergebnisvorgabe wählen.");
    if (c.resultRule && c.resultRule !== "auto" &&
        (!Number.isInteger(c.resultValue) || c.resultValue < 0 || c.resultValue > c.max))
      add("result", "Die Ergebnisvorgabe muss zwischen 0 und der allgemeinen Grenze liegen.");
    if (typeof c.resultQuery !== "boolean" || typeof c.table !== "boolean")
      add("config", "Ungültige Abfrage- oder Reiheneinstellung.");
    if (!["gap", "wahrfalsch", "compare"].includes(c.format || "gap"))
      add("format", "Unbekanntes Aufgabenformat.");
    if (
      !["standard", "easy", "hard", "mixed"].includes(
        c.difficulty || "standard",
      )
    )
      add("difficulty", "Unbekannte Schwierigkeit.");
    if (!["fixed", "mixed"].includes(c.lengthMode || "fixed"))
      add("length", "Bitte feste oder gemischte Kettenlänge wählen.");
    if (!["free", "terms", "startHigh", "mixed"].includes(c.pattern || "free"))
      add("pattern", "Unbekannter Kettenaufbau.");
    const ids = new Set();
    c.numbers.forEach((n, i) => {
      if (!n || typeof n.id !== "string" || ids.has(n.id)) {
        add("chain", "Jedes Kästchen braucht eine eigene Kennung.");
        return;
      }
      ids.add(n.id);
      if (!["fixed", "range", "rows"].includes(n.kind))
        add(
          n.id,
          "Bitte feste Zahl, Zahlenbereich oder ausgewählte Reihen wählen.",
        );
      const lo = n.kind === "fixed" ? n.value : n.min,
        hi = n.kind === "fixed" ? n.value : n.max;
      if (
        !Number.isInteger(lo) ||
        !Number.isInteger(hi) ||
        lo < 0 ||
        hi > 1000 ||
        lo > hi
      )
        add(
          n.id,
          "Minimum und Maximum müssen ganze Zahlen von 0 bis 1000 sein; Minimum darf nicht größer sein.",
        );
      if (typeof n.query !== "boolean" || typeof n.allowZero !== "boolean")
        add(n.id, "Ungültige Einstellung für Null oder Lücken.");
      if (n.allowZero === false && hi === 0)
        add(
          n.id,
          "Ohne Null bleibt hier keine Zahl. Bitte mindestens 1 erlauben.",
        );
      if (
        i > 0 &&
        c.operators[i - 1]?.allowed?.includes("geteilt") &&
        lo === 0 &&
        n.allowZero !== false
      )
        add(
          n.id,
          "Ein Teiler darf nicht Null sein. Bitte „Null erlauben“ ausschalten oder Minimum 1 wählen.",
        );
    });
    c.operators.forEach((o) => {
      if (!o || typeof o.id !== "string" || ids.has(o.id)) {
        add("chain", "Jedes Zeichen braucht eine eigene Kennung.");
        return;
      }
      ids.add(o.id);
      if (
        !Array.isArray(o.allowed) ||
        !o.allowed.length ||
        new Set(o.allowed).size !== o.allowed.length ||
        o.allowed.some((op) => !symbols[op])
      )
        add(o.id, "Bitte mindestens eine gültige Rechenart auswählen.");
    });
    if (
      (c.format || "gap") === "gap" &&
      !c.resultQuery &&
      !c.numbers.some((n) => n?.query) &&
      !c.operators.some((o) => o?.query)
    )
      add("query", "Bitte mindestens ein Kästchen zur Abfrage markieren.");
    if (!["any", "with", "without"].includes(c.carry))
      add("carry", "Bitte eine gültige Regel zum Zehnerübergang wählen.");
    if (!["free", "table9", "table", "tens"].includes(c.profile))
      add("profile", "Unbekanntes Zahlenprofil.");
    if (!["normal", "only", "mix"].includes(c.square))
      add("square", "Bitte eine gültige Quadratauswahl wählen.");
    if (!Number.isInteger(c.taskCount) || c.taskCount < 1 || c.taskCount > 20)
      add("taskCount", "Bitte 1 bis 20 Aufgaben wählen.");
    if (c.table || c.numbers.some((n) => n?.kind === "rows")) {
      if (
        !Array.isArray(c.rows) ||
        !c.rows.length ||
        c.rows.some((n) => !Number.isInteger(n) || n < 1 || n > (c.square === "only" ? Math.floor(Math.sqrt(c.intermediateMax)) : 10))
      )
        add(
          "rows",
          "Bitte mindestens eine Einmaleinsreihe von 1 bis 10 wählen.",
        );
      if (c.profile === "table9" && c.rows?.includes(10))
        add(
          "profile",
          "Die 10er-Reihe braucht das Profil „1×1 bis 10“ oder „Frei“.",
        );
    }
    if (
      c.table &&
      (c.numbers.length !== 2 ||
        c.operators.some(
          (o) =>
            !o?.allowed ||
            o.allowed.some((op) => !["mal", "geteilt"].includes(op)),
        ))
    )
      add(
        "table",
        "Reihentraining braucht zwei Zahlen und Mal/Geteilt. Für freie Ketten Reihentraining ausschalten.",
      );
    if (
      c.legacy?.flashMode === "1" &&
      ((c.format || "gap") !== "gap" ||
        !c.resultQuery ||
        c.numbers.some((n) => n?.query) ||
        c.operators.some((o) => o?.query))
    )
      add(
        "flash",
        "Blitzmodus braucht „Nur Ergebnis abfragen“ und das Format „Ein fehlendes Kästchen“. Bitte Lückenwahl ändern oder Blitzmodus ausschalten.",
      );
    for (const field of ["flashShowSec", "flashPeekSec"])
      if (
        c.legacy?.[field] != null &&
        (!/^\d{1,2}$/.test(String(c.legacy[field])) ||
          Number(c.legacy[field]) > 30)
      )
        add(
          "flash",
          "Bitte eine Blitz-Anzeigedauer von 0 bis 30 Sekunden eingeben.",
        );
    if (
      c.legacy?.timeLimitSec != null &&
      !/^\d{1,3}$/.test(String(c.legacy.timeLimitSec))
    )
      add("time", "Bitte ein Zeitlimit von 0 bis 999 Sekunden eingeben.");
    return errors;
  }
  function domain(n, c) {
    const lo = n.kind === "fixed" ? n.value : n.min,
      hi = n.kind === "fixed" ? n.value : n.max;
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(
      (x) =>
        (n.allowZero !== false || x !== 0) &&
        (n.kind !== "rows" || c.rows.includes(x)),
    );
  }
  function transitions(numbers, ops) {
    const ns = numbers.slice(),
      os = ops.slice(),
      crossings = [];
    while (os.length) {
      let i = os.findIndex((o) => o === "mal" || o === "geteilt");
      if (i < 0) i = 0;
      const a = ns[i],
        b = ns[i + 1],
        op = os[i];
      if (op === "plus" || op === "minus") {
        let carry = false;
        for (let factor = 10; factor <= Math.max(a, b) * 10; factor *= 10)
          if (
            op === "plus"
              ? (a % factor) + (b % factor) >= factor
              : a % factor < b % factor
          ) {
            carry = true;
            break;
          }
        crossings.push(carry);
      }
      ns.splice(
        i,
        2,
        op === "plus"
          ? a + b
          : op === "minus"
            ? a - b
            : op === "mal"
              ? a * b
              : a / b,
      );
      os.splice(i, 1);
    }
    return crossings;
  }
  function solve(c, numbers, ops) {
    const solved = C.evaluate(numbers, ops, c.intermediateMax);
    if (solved.res > c.max) throw Error("Ergebnisgrenze");
    if (c.resultRule === "max" && solved.res > c.resultValue) throw Error("Ergebnisgrenze");
    if (c.resultRule === "fixed" && solved.res !== c.resultValue) throw Error("Festes Ergebnis passt nicht");
    const cross = transitions(numbers, ops);
    if (c.carry === "with" && (!cross.length || !cross.every(Boolean)))
      throw Error("Zehnerübergang fehlt");
    if (c.carry === "without" && cross.some(Boolean))
      throw Error("Zehnerübergang");
    return solved;
  }
  function candidatesForGap(c, numbers, ops, gap, domains) {
    if (gap === "result") return [solve(c, numbers, ops).res];
    if (gap.startsWith("o:")) {
      const i = Number(gap.slice(2));
      return Object.keys(symbols).filter((op) => {
        try {
          const test = ops.slice();
          test[i] = op;
          return solve(c, numbers, test).res === solve(c, numbers, ops).res;
        } catch (_) {
          return false;
        }
      });
    }
    const i = Number(gap.slice(2)),
      rhs = solve(c, numbers, ops).res,
      result = [];
    // Check every mathematically admissible value, including values not originally sampled.
    for (const x of domains[i]) {
      const ns = numbers.slice();
      ns[i] = x;
      try {
        if (solve(c, ns, ops).res === rhs) result.push(x);
      } catch (_) {}
      if (result.length > 1) break;
    }
    return result;
  }
  function generate(c, { rng = Math.random, effectiveDifficulty } = {}) {
    const errors = validate(c);
    if (errors.length) throw Error(errors[0].message);
    if (c.lengthMode === "mixed") {
      const lengths = [];
      for (let length = 2; length <= c.numbers.length; length++)
        if (
          c.resultQuery ||
          c.format === "wahrfalsch" ||
          c.format === "compare" ||
          c.numbers.slice(0, length).some((n) => n.query) ||
          c.operators.slice(0, length - 1).some((o) => o.query)
        )
          lengths.push(length);
      if (!lengths.length)
        throw Error(
          "Bitte eine Lücke in der kürzesten erlaubten Kette markieren.",
        );
      const length =
          lengths[
            Math.min(lengths.length - 1, Math.floor(rng() * lengths.length))
          ],
        short = clone(c);
      short.lengthMode = "fixed";
      short.numbers = short.numbers.slice(0, length);
      short.operators = short.operators.slice(0, length - 1);
      return generate(short, { rng, effectiveDifficulty });
    }
    if (["wahrfalsch", "compare"].includes(c.format)) {
      const base = clone(c);
      base.format = "gap";
      base.resultQuery = true;
      base.numbers.forEach((n) => (n.query = false));
      base.operators.forEach((o) => (o.query = false));
      const left = generate(base, { rng, effectiveDifficulty }),
        leftTxt = C.text(left.numbers, left.ops);
      if (c.format === "compare") {
        const right = generate(base, { rng, effectiveDifficulty }),
          rightTxt = C.text(right.numbers, right.ops),
          correct =
            left.rhs === right.rhs ? "=" : left.rhs > right.rhs ? ">" : "<";
        return {
          ...left,
          fmt: "compare",
          leftTxt,
          rightTxt,
          leftVal: left.rhs,
          rightVal: right.rhs,
          correct,
          expression: leftTxt + " □ " + rightTxt,
          key: "builder-compare|" + leftTxt + "|" + rightTxt,
          solutionLines: [
            leftTxt + " = " + left.rhs,
            rightTxt + " = " + right.rhs,
          ],
        };
      }
      const isTrue = rng() < 0.5,
        shownRes = isTrue
          ? left.rhs
          : left.rhs < c.max
            ? left.rhs + 1
            : Math.max(0, left.rhs - 1);
      return {
        ...left,
        fmt: "wahrfalsch",
        isTrue,
        shownRes,
        expression: leftTxt + " = " + shownRes,
        key: "builder-truefalse|" + leftTxt + "|" + shownRes,
        solutionLines: [leftTxt + " = " + left.rhs],
      };
    }
    const domains = c.numbers.map((n) => domain(n, c));
    if (domains.some((a) => !a.length))
      throw Error(
        "Ein Zahlenkästchen enthält keine erlaubten Werte. Bitte den Bereich oder die Reihen ändern.",
      );
    const rawDifficulty = effectiveDifficulty || c.difficulty;
    const difficulty = ["noCarry", "noBorrow"].includes(rawDifficulty)
      ? "easy"
      : ["carry", "borrow"].includes(rawDifficulty)
        ? "hard"
        : rawDifficulty;
    const pick = (a) => {
      const r = rng(),
        weighted =
          typeof a[0] === "number"
            ? difficulty === "easy"
              ? r * r
              : difficulty === "hard"
                ? Math.sqrt(r)
                : r
            : r;
      return a[Math.min(a.length - 1, Math.floor(weighted * a.length))];
    };
    const gaps = [];
    if (c.resultQuery) gaps.push("result");
    c.numbers.forEach((n, i) => {
      if (n.query) gaps.push("n:" + i);
    });
    c.operators.forEach((o, i) => {
      if (o.query) gaps.push("o:" + i);
    });
    const allOps = [...new Set(c.operators.flatMap((o) => o.allowed))],
      hasHigh = allOps.some((o) => o === "mal" || o === "geteilt"),
      hasLow = allOps.some((o) => o === "plus" || o === "minus");
    const choicesFor = (pattern) =>
      c.operators.map((o, i) =>
        pattern === "free" || !hasHigh || !hasLow
          ? o.allowed
          : o.allowed.filter((op) =>
              (pattern === "terms" ? i % 2 === 0 : i === 0)
                ? ["mal", "geteilt"].includes(op)
                : ["plus", "minus"].includes(op),
            ),
      );
    const possiblePatterns = ["free", "terms", "startHigh"].filter((p) =>
      choicesFor(p).every((a) => a.length),
    );
    const pattern =
        c.pattern === "mixed" ? pick(possiblePatterns) : c.pattern || "free",
      operatorChoices = choicesFor(pattern);
    if (operatorChoices.some((a) => !a.length))
      throw Error(
        "Der Kettenaufbau passt nicht zu den Zeichenkästchen. Bitte „Frei mischen“ wählen oder die Zeichen anpassen.",
      );
    const gap = pick(gaps),
      tablePool = [];
    if (c.table) {
      const limit =
        c.profile === "table9" ? 9 : c.profile === "table" ? 10 : 1000;
      for (const row of c.rows)
        for (
          let f = 1;
          f <= Math.min(limit, Math.floor(c.intermediateMax / row));
          f++
        ) {
          if (c.profile === "tens" && f % 10 !== 0) continue;
          const square = row === f;
          if (c.square === "only" && !square) continue;
          for (const op of c.operators[0].allowed) {
            const ns = op === "mal" ? [row, f] : [row * f, row];
            if (domains.every((d, i) => d.includes(ns[i])))
              tablePool.push({ numbers: ns, ops: [op], row, square });
            if (
              op === "mal" &&
              row !== f &&
              domains[0].includes(f) &&
              domains[1].includes(row)
            )
              tablePool.push({ numbers: [f, row], ops: [op], row, square });
          }
        }
      if (!tablePool.length)
        throw Error(
          "Reihen, Zahlenkästchen, Profil und Grenzen passen nicht zusammen. Bitte Bereiche erweitern oder Grenzen erhöhen.",
        );
      if (c.requireAllRows !== false && c.rows.some((row) => !tablePool.some((p) => p.row === row)))
        throw Error(
          "Nicht jede gewählte Reihe passt zu Zahlenkästchen und Grenzen. Bitte die betroffenen Bereiche erweitern.",
        );
    }
    let lastReason = "";
    for (let attempt = 0; attempt < 1400; attempt++) {
      let numbers, ops, solved, relation;
      try {
        if (c.table) {
          let pool = tablePool;
          if (c.square === "mix") {
            const square = !!(rng() < 0.3);
            const filtered = pool.filter((p) => p.square === square);
            if (filtered.length) pool = filtered;
          }
          if (difficulty === "easy" || difficulty === "hard") {
            pool = pool
              .slice()
              .sort(
                (a, b) =>
                  a.numbers[0] * a.numbers[1] - b.numbers[0] * b.numbers[1],
              );
            const r = rng(),
              index = Math.min(
                pool.length - 1,
                Math.floor(
                  (difficulty === "easy" ? r * r : Math.sqrt(r)) * pool.length,
                ),
              );
            relation = pool[index];
          } else relation = pick(pool);
          numbers = relation.numbers;
          ops = relation.ops;
        } else {
          const candidate = C.generate({
            max: c.intermediateMax,
            count: c.numbers.length,
            ops: [...new Set(c.operators.flatMap((o) => o.allowed))],
            rng,
          });
          ops = operatorChoices.map((allowed, i) =>
            allowed.includes(candidate.ops[i])
              ? candidate.ops[i]
              : pick(allowed),
          );
          numbers = c.numbers.map((n, i) =>
            domains[i].includes(candidate.numbers[i])
              ? candidate.numbers[i]
              : pick(domains[i]),
          );
          // Explore broad domains as well; the old chain sampler intentionally favors small numbers.
          if (attempt % 2 || difficulty === "easy" || difficulty === "hard")
            numbers = domains.map(pick);
        }
        solved = solve(c, numbers, ops);
        if (
          relation &&
          gap.startsWith("n:") &&
          numbers[Number(gap.slice(2))] === relation.row &&
          solved.res !== relation.row &&
          numbers[1 - Number(gap.slice(2))] !== relation.row
        )
          continue;
        const answers = candidatesForGap(c, numbers, ops, gap, domains);
        if (answers.length !== 1) {
          lastReason = "Die markierte Lücke ist nicht eindeutig lösbar.";
          continue;
        }
        const answer = answers[0],
          parts = [];
        numbers.forEach((n, i) => {
          if (i)
            parts.push({
              kind: "operator",
              text: gap === "o:" + (i - 1) ? "□" : symbols[ops[i - 1]],
            });
          parts.push({
            kind: "number",
            text: gap === "n:" + i ? "□" : String(n),
          });
        });
        parts.push(
          { kind: "operator", text: "=" },
          { kind: "number", text: gap === "result" ? "□" : String(solved.res) },
        );
        const expression = parts.map((p) => p.text).join(" "),
          isOperator = gap.startsWith("o:");
        return {
          op: "builder",
          fmt: isOperator ? "operator" : "standard",
          missing: 2,
          a: numbers[0],
          b: numbers[1],
          sym: symbols[ops[0]],
          numbers,
          ops,
          intermediates: solved.intermediates,
          steps: solved.steps,
          rhs: solved.res,
          res: isOperator ? solved.res : answer,
          correctOp: isOperator ? symbols[answer] : undefined,
          gap,
          parts,
          expression,
          solutionLines: [
            expression.replace(
              "□",
              isOperator ? symbols[answer] : String(answer),
            ),
            ...solved.steps.slice(1,-1).map(step => step + " = " + solved.res),
          ],
          key: "builder|" + expression,
        };
      } catch (e) {
        lastReason = e.message;
      }
    }
    throw Error(
      (lastReason.includes("eindeutig") ? lastReason + " " : "") +
        "Mit diesen Vorgaben wurde keine gültige Aufgabe gefunden. Bitte Zahlenbereiche erweitern, Lückenwahl ändern oder eine höhere Grenze wählen. Deine Vorgaben wurden nicht verändert.",
    );
  }
  function label(c) {
    const ops = [...new Set(c.operators.flatMap((o) => o.allowed))];
    return ops.length === 1
      ? {
          plus: "Nur Plus",
          minus: "Nur Minus",
          mal: "Nur Mal",
          geteilt: "Nur Geteilt",
        }[ops[0]]
      : ops.every((o) => ["plus", "minus"].includes(o))
        ? "Plus & Minus"
        : ops.every((o) => ["mal", "geteilt"].includes(o))
          ? "Mal & Geteilt"
          : "Gemischt";
  }
  const api = {
    clone,
    numberSlot,
    fromLegacy,
    validate,
    domain,
    solve,
    generate,
    label,
    symbols,
  };
  root.MatheBuilder = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
