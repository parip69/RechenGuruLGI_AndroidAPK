const { test } = require("node:test"),
  assert = require("node:assert/strict");
const B = require("../app/src/main/assets/grundschule/config.js"),
  C = require("../app/src/main/assets/rechenketten.js");
let seed = 226;
const rng = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
function base(mode = "plus") {
  return B.fromLegacy(mode, { maxWert: "100", mulProfile: "table" }, "3");
}
function fixed(c, ns) {
  c.numbers = ns.map((v, i) => ({
    ...B.numberSlot("n" + i),
    kind: "fixed",
    value: v,
    allowZero: v === 0,
  }));
  c.operators = ns
    .slice(1)
    .map((_, i) => ({ id: "o" + i, allowed: ["plus"], query: false }));
  return c;
}
function check(t, c) {
  assert.equal(C.evaluate(t.numbers, t.ops, c.intermediateMax).res, t.rhs);
  assert(t.rhs <= c.max);
  assert.equal(t.parts.filter((p) => p.text === "□").length, 1);
  assert(t.numbers.every((n, i) => B.domain(c.numbers[i], c).includes(n)));
  assert(t.ops.every((op, i) => c.operators[i].allowed.includes(op)));
  const filled = t.expression
    .replace("□", t.fmt === "operator" ? t.correctOp : t.res)
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-");
  const [left, right] = filled.split("=");
  assert.equal(Function("return " + left)(), Function("return " + right)());
}
test("All primary arithmetic families, rows, inverse tasks and random ranges", () => {
  for (const mode of [
    "plus",
    "minus",
    "mix",
    "mal",
    "geteilt",
    "mixMD",
    "mixALL",
  ]) {
    const c = base(mode);
    assert.deepEqual(B.validate(c), []);
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      const t = B.generate(c, { rng });
      check(t, c);
      seen.add(t.expression);
    }
    assert(seen.size > 5, mode);
  }
});
test("Selected multiplication rows remain visible for missing factor or dividend", () => {
  for (const op of ["mal", "geteilt"]) {
    const c = base(op);
    c.rows = [7];
    c.resultQuery = false;
    c.numbers[op === "mal" ? 1 : 0].query = true;
    for (let i = 0; i < 25; i++) {
      const t = B.generate(c, { rng });
      check(t, c);
      assert(t.expression.includes("7"));
      assert(t.numbers.includes(7));
    }
  }
});
test("Squares only, mixed squares and inverse division respect selected rows", () => {
  for (const op of ["mal", "geteilt", "mixMD"]) {
    const c = base(op);
    c.rows = [7, 8];
    c.square = "only";
    for (let i = 0; i < 20; i++) {
      const t = B.generate(c, { rng });
      check(t, c);
      assert(
        op === "mal"
          ? t.numbers[0] === t.numbers[1]
          : t.ops[0] === "mal"
            ? t.numbers[0] === t.numbers[1]
            : t.numbers[0] === t.numbers[1] ** 2,
      );
      assert([7, 8].includes(t.numbers[1]));
    }
  }
  const c = base("mal");
  c.square = "mix";
  const ts = Array.from({ length: 80 }, () => B.generate(c, { rng }));
  assert(ts.some((t) => t.numbers[0] === t.numbers[1]));
  assert(ts.some((t) => t.numbers[0] !== t.numbers[1]));
});
test("Fixed numbers and separate explicit random domains", () => {
  const c = fixed(base(), [25, 7]);
  for (let i = 0; i < 10; i++) {
    const t = B.generate(c, { rng });
    assert.equal(t.expression, "25 + 7 = □");
    check(t, c);
  }
  c.numbers[1] = { ...B.numberSlot("n1", 1, 9), allowZero: false };
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const t = B.generate(c, { rng });
    assert.equal(t.numbers[0], 25);
    assert(t.numbers[1] >= 1 && t.numbers[1] <= 9);
    seen.add(t.numbers[1]);
  }
  assert.equal(seen.size, 9);
});
test("Each allowed number/operator/result gap is uniquely solvable", () => {
  for (const position of ["result", "n:0", "n:1", "o:0"]) {
    const c = fixed(base(), [25, 7]);
    c.resultQuery = position === "result";
    c.numbers.forEach((n, i) => (n.query = position === "n:" + i));
    c.operators[0].query = position === "o:0";
    const t = B.generate(c, { rng });
    assert.equal(t.gap, position);
    check(t, c);
  }
  const c = base();
  c.numbers.forEach((n) => (n.query = true));
  const gaps = new Set();
  for (let i = 0; i < 80; i++) gaps.add(B.generate(c, { rng }).gap);
  assert.equal(gaps.size, 3);
});
test("Carry and borrow enforce every applicable step, including higher places", () => {
  for (const [numbers, op, carry] of [
    [[47, 28], "plus", "with"],
    [[99, 1], "plus", "with"],
    [[100, 1], "minus", "with"],
    [[44, 22], "minus", "without"],
    [[25, 13], "plus", "without"],
  ]) {
    const c = fixed(base(), numbers);
    c.operators[0].allowed = [op];
    c.carry = carry;
    check(B.generate(c, { rng }), c);
  }
  const c = fixed(base(), [25, 7]);
  c.carry = "without";
  assert.throws(() => B.generate(c, { rng }), /keine gültige/);
});
test("Long chains and precedence reuse exact chain evaluation", () => {
  const c = fixed(base("chain"), [25, 7, 4]);
  c.operators[1].allowed = ["minus"];
  check(B.generate(c, { rng }), c);
  const d = fixed(base("chain"), [3, 5, 6, 2]);
  d.operators.forEach((o, i) => (o.allowed = [["mal", "minus", "geteilt"][i]]));
  assert.equal(B.generate(d, { rng }).rhs, 12);
  for (let length = 2; length <= 10; length++) {
    const k = fixed(base("chain"), Array(length).fill(1));
    check(B.generate(k, { rng }), k);
  }
});
test("Invalid domains, division by zero, rows, profile and result boundaries rejected", () => {
  const c = base();
  c.numbers[0].min = 101;
  assert(B.validate(c).length);
  assert.throws(() => B.generate(c));
  const d = base("geteilt");
  d.numbers[1].allowZero = true;
  assert(B.validate(d).some((e) => /Null/.test(e.message)));
  const e = fixed(base(), [25, 7]);
  e.max = 20;
  assert.throws(() => B.generate(e, { rng }), /keine gültige/);
  const f = base("mal");
  f.rows = [];
  assert(B.validate(f).some((e) => e.field === "rows"));
  f.rows = [10];
  f.profile = "table9";
  assert(B.validate(f).some((e) => e.field === "profile"));
  f.operators[0].allowed = [];
  assert(B.validate(f).some((e) => e.field === "o0"));
});
test("Ambiguous operator gaps and zero-factor gaps never escape attempt limit", () => {
  const c = fixed(base(), [2, 2]);
  c.operators[0].query = true;
  c.resultQuery = false;
  assert.throws(() => B.generate(c, { rng }), /nicht eindeutig/);
  const d = base("mal");
  d.table = false;
  d.numbers[0] = { ...B.numberSlot("n0"), kind: "fixed", value: 0 };
  d.numbers[1] = { ...B.numberSlot("n1", 0, 9), query: true };
  d.resultQuery = false;
  assert.throws(() => B.generate(d, { rng }), /nicht eindeutig/);
});
test("Legacy profiles are read without mutation and retain extra options", () => {
  const s = {
    maxWert: "100",
    op1Mode: "tens",
    op2Mode: "ones",
    operandCount: "3",
    difficulty: "noCarry",
    flashMode: "1",
    taskFormat: "faktor",
  };
  const before = JSON.stringify(s),
    c = B.fromLegacy("plus", s, "2");
  assert.equal(JSON.stringify(s), before);
  assert.equal(c.numbers.length, 3);
  assert.equal(c.numbers[0].min, 10);
  assert.equal(c.numbers[1].max, 9);
  assert.equal(c.carry, "without");
  assert.equal(c.legacy.flashMode, "1");
  assert.equal(c.grade, "2");
});
test("Truth and comparison formats use the same configured equations", () => {
  for (const format of ["wahrfalsch", "compare"]) {
    const c = fixed(base(), [25, 7]);
    c.format = format;
    for (let i = 0; i < 20; i++) {
      const t = B.generate(c, { rng });
      assert.equal(t.fmt, format);
      assert.equal(t.rhs, 32);
      if (format === "compare") {
        assert.equal(t.correct, "=");
        assert.equal(t.leftVal, t.rightVal);
      } else assert.equal(t.shownRes === 32, t.isTrue);
    }
  }
});
test("Malformed imported slots and unknown formats fail validation", () => {
  const c = base();
  c.numbers[0] = null;
  assert(B.validate(c).length);
  const d = base();
  d.format = "execute";
  assert(B.validate(d).length);
});
test("Legacy mixed lengths and chain patterns survive the configuration adapter", () => {
  const c = B.fromLegacy("chain", {
    maxWert: "100",
    chainLength: "mixed",
    chainOps: "plus,minus,mal,geteilt",
    chainPattern: "terms",
  });
  assert.equal(c.numbers.length, 10);
  assert.equal(c.lengthMode, "mixed");
  const seen = new Set();
  for (let i = 0; i < 160; i++) {
    const t = B.generate(c, { rng });
    seen.add(t.numbers.length);
    t.ops.forEach((op, i) =>
      assert(
        (i % 2 === 0 ? ["mal", "geteilt"] : ["plus", "minus"]).includes(op),
      ),
    );
  }
  assert.equal(seen.size, 9);
});
test("Difficulty weights numerical domains and existing adaptive levels without changing fixed values", () => {
  const average = (mode, difficulty, effectiveDifficulty) => {
    const c = base(mode);
    c.difficulty = difficulty;
    if (mode === "plus") {
      c.numbers[0] = B.numberSlot("n0", 1, 80);
      c.numbers[1] = { ...B.numberSlot("n1"), kind: "fixed", value: 1 };
    }
    let total = 0;
    for (let i = 0; i < 120; i++) {
      const t = B.generate(c, { rng, effectiveDifficulty });
      check(t, c);
      total += t.rhs;
    }
    return total / 120;
  };
  assert(average("plus", "hard") > average("plus", "easy") + 10);
  assert(average("mal", "hard") > average("mal", "easy") + 10);
  assert(
    average("plus", "mixed", "carry") >
      average("plus", "mixed", "noCarry") + 10,
  );
});
