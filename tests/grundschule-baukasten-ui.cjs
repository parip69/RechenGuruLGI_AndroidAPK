const { chromium } = require("playwright"),
  fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict");
const assets = path.resolve(__dirname, "../app/src/main/assets");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", (r) => {
      const n =
          new URL(r.request().url()).pathname.replace(
            "/RechenGuruLGI_AndroidAPK/",
            "",
          ) || "index.html",
        file = path.join(assets, n);
      if (fs.existsSync(file) && fs.statSync(file).isFile())
        return r.fulfill({
          body: fs.readFileSync(file),
          contentType: n.endsWith(".html")
            ? "text/html"
            : n.endsWith(".js")
              ? "application/javascript"
              : n.endsWith(".css")
                ? "text/css"
                : undefined,
        });
      return r.abort();
    });
    await page.addInitScript(() => {
      window.AndroidInterface = {
        getAppVersionName: () => "99999",
        openExternal: () => true,
        shareLink: (url) => {
          window.__testShare = url;
          return true;
        },
      };
    });
    await page.goto("https://parip69.github.io/RechenGuruLGI_AndroidAPK/");
    await page.waitForTimeout(500);
    assert.deepEqual(errors, []);
    assert.equal(await page.locator("#builderHome").count(), 1);
    await page.locator("#builderHome>summary").click();
    await page
      .locator(".builder-main-tile")
      .filter({ hasText: /^Plus$/ })
      .click();
    await page
      .getByRole("button", { name: "Konfigurieren", exact: true })
      .click();
    await page
      .locator("#builderEditor details")
      .evaluate((e) => (e.open = true));
    await page
      .locator("#builderRules")
      .getByLabel("Maximales Ergebnis", { exact: true })
      .fill("100");
    await page
      .locator("#builderRules")
      .getByLabel("Maximales Ergebnis", { exact: true })
      .dispatchEvent("change");
    await page
      .locator("#builderRules")
      .getByLabel("Grenze aller Zahlen und Zwischenwerte", { exact: true })
      .fill("100");
    await page
      .locator("#builderRules")
      .getByLabel("Grenze aller Zahlen und Zwischenwerte", { exact: true })
      .dispatchEvent("change");
    await page.locator('[data-slot="n0"]').click();
    await page.locator("#builderSlot select").selectOption("fixed");
    await page.locator("#builderSlot input[type=number]").fill("25");
    await page
      .locator("#builderSlot input[type=number]")
      .dispatchEvent("change");
    await page.locator('[data-slot="n1"]').click();
    await page
      .locator("#builderSlot")
      .getByRole("button", { name: "1–9", exact: true })
      .click();
    await page
      .getByRole("button", { name: "5 Beispielaufgaben anzeigen", exact: true })
      .click();
    assert.equal(await page.locator("#builderPreview li").count(), 5);
    assert(
      (await page.locator("#builderPreview").innerText()).includes("25 +"),
    );
    await page.locator("#builderTitle").fill("Meine Plus-Aufgabe");
    await page.locator("#builderSave").click();
    assert(
      (await page.locator("#builderStatus").innerText()).includes(
        "gespeichert",
      ),
    );
    assert.equal(await page.locator(".builder-card").count(), 1);
    const before = await page.evaluate(
      () => MatheTemplates.open(appStorage).read()[0],
    );
    await page
      .locator(".builder-card")
      .getByRole("button", { name: "Bearbeiten", exact: true })
      .click();
    await page.locator("#builderTitle").fill("Umbenannt");
    await page.locator("#builderSave").click();
    assert.equal(await page.locator(".builder-card").count(), 1);
    assert.equal(
      await page.evaluate(() => MatheTemplates.open(appStorage).read()[0].id),
      before.id,
    );
    await page.reload();
    await page.waitForTimeout(350);
    await page.locator("#builderHome>summary").click();
    assert(
      (await page.locator(".builder-card h3").innerText()).includes(
        "Umbenannt",
      ),
    );
    await page
      .locator(".builder-card")
      .getByRole("button", { name: "Üben", exact: true })
      .click();
    assert.equal(await page.locator("#viewSelect").inputValue(), "builder");
    assert.equal(await page.locator("#zeilenAufgaben [data-task]").count(), 1);
    const t = await page.evaluate(() =>
      JSON.parse(
        document.querySelector("#zeilenAufgaben [data-task]").dataset.task,
      ),
    );
    assert.equal(t.numbers[0], 25);
    await page.locator("#zeilenAufgaben input").fill(String(t.res));
    await page.waitForTimeout(1100);
    assert.equal(await page.locator("#zeilenAufgaben input").inputValue(), "");
    await page.reload();
    await page.waitForTimeout(400);
    assert.equal(await page.locator("#viewSelect").inputValue(), "builder");
    assert.equal(await page.locator("#zeilenAufgaben [data-task]").count(), 1);
    await page.locator("#builderHome>summary").click();
    await page
      .locator(".builder-card")
      .getByRole("button", { name: "Bearbeiten", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Als weitere Vorlage speichern",
        exact: true,
      })
      .click();
    assert.equal(await page.locator(".builder-card").count(), 2);
    page.once("dialog", (d) => d.dismiss());
    await page
      .locator(".builder-card")
      .first()
      .getByRole("button", { name: "× Entfernen", exact: true })
      .click();
    assert.equal(await page.locator(".builder-card").count(), 2);
    page.once("dialog", (d) => d.accept());
    await page
      .locator(".builder-card")
      .last()
      .getByRole("button", { name: "× Entfernen", exact: true })
      .click();
    assert.equal(await page.locator(".builder-card").count(), 1);
    // Independent family settings and direct mixed choices.
    await page.locator("#builderBack").click();
    await page
      .locator(".builder-main-tile")
      .filter({ hasText: /^Mal & Geteilt$/ })
      .click();
    assert.equal(await page.locator("#builderQuick button").count(), 3);
    await page
      .locator("#builderQuick")
      .getByRole("button", { name: "Nur Geteilt", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Konfigurieren", exact: true })
      .click();
    assert((await page.locator("#builderBoxes").innerText()).includes("÷"));
    await page.locator("#builderBack").click();
    await page
      .locator(".builder-main-tile")
      .filter({ hasText: /^Plus$/ })
      .click();
    await page
      .getByRole("button", { name: "Konfigurieren", exact: true })
      .click();
    assert((await page.locator('[data-slot="n0"]').innerText()).includes("25"));
    await page
      .locator(".builder-card")
      .getByRole("button", { name: "Bearbeiten", exact: true })
      .click();
    await page.locator('[data-slot="n0"]').click();
    await page.locator("#builderSlot input[type=number]").fill("30");
    await page
      .locator("#builderSlot input[type=number]")
      .dispatchEvent("change");
    await page.locator("#builderSave").click();
    await page.locator("#builderBack").click();
    await page
      .locator(".builder-main-tile")
      .filter({ hasText: /^Plus$/ })
      .click();
    await page
      .getByRole("button", { name: "Konfigurieren", exact: true })
      .click();
    assert(
      (await page.locator('[data-slot="n0"]').innerText()).includes("25"),
      "personal edits must not replace the main Plus settings",
    );
    // Long chains, large text, long titles, many cards; geometry must stay within viewport.
    await page.locator("#builderBack").click();
    await page
      .locator(".builder-main-tile")
      .filter({ hasText: /^Rechenketten$/ })
      .click();
    await page
      .getByRole("button", { name: "Konfigurieren", exact: true })
      .click();
    for (let i = 0; i < 6; i++) await page.locator("#builderAdd").click();
    assert(await page.locator("#builderAdd").isDisabled());
    await page.locator('[data-slot="n1"]').click();
    await page
      .getByRole("button", { name: "Rechenglied entfernen", exact: true })
      .click();
    assert(!(await page.locator("#builderAdd").isDisabled()));
    await page.locator('[data-slot="n0"]').click();
    await page
      .getByRole("button", { name: "Danach einfügen", exact: true })
      .click();
    assert(await page.locator("#builderAdd").isDisabled());
    for (const width of [320, 360, 390, 412, 768])
      for (const scale of [1, 2]) {
        await page.setViewportSize({
          width,
          height: width === 768 ? 390 : 844,
        });
        await page.evaluate((scale) => {
          document.getElementById("builderHome").style.fontSize =
            16 * scale + "px";
        }, scale);
        const result = await page.evaluate(() => ({
          doc: document.documentElement.scrollWidth,
          width: innerWidth,
          boxes: [...document.querySelectorAll("#builderBoxes button")].map(
            (e) => {
              const r = e.getBoundingClientRect();
              return { l: r.left, r: r.right, t: r.top, b: r.bottom };
            },
          ),
        }));
        assert(
          result.doc <= result.width + 1,
          `page overflow ${width} scale ${scale}: ${result.doc}`,
        );
        for (const b of result.boxes) assert(b.l >= 0 && b.r <= width + 1);
        for (let i = 0; i < result.boxes.length; i++)
          for (let j = i + 1; j < result.boxes.length; j++) {
            const a = result.boxes[i],
              b = result.boxes[j];
            assert(
              a.r <= b.l + 1 ||
                b.r <= a.l + 1 ||
                a.b <= b.t + 1 ||
                b.b <= a.t + 1,
              "overlapping boxes",
            );
          }
      }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () => (document.getElementById("builderHome").style.fontSize = "16px"),
    );
    // Share template with an explicit opt-in, then import beside an existing same-ID template.
    await page.locator("#appShareWidget button").click();
    await page.locator("input[name=appShareMode][value=data]").check();
    await page.locator("input[data-group=templates]").check();
    await page.locator("#appShareStart").click();
    const shared = await page.evaluate(() => window.__testShare);
    assert(shared.includes("#settings="));
    const payload = JSON.parse(
      Buffer.from(shared.split("#settings=")[1], "base64url").toString(),
    );
    assert(
      Object.keys(payload.settings).some((k) =>
        k.startsWith("mathExerciseShare:"),
      ),
    );
    assert(!Object.hasOwn(payload.settings, "mathParentPin"));
    await page.evaluate(() => {
      const lib = MatheTemplates.open(appStorage),
        sample = lib.read()[0];
      lib.importTemplates(
        Array.from({ length: 50 }, () => ({
          ...sample,
          title:
            "Eine besonders lange eigene Übung mit sehr vielen Wörtern ".repeat(
              2,
            ),
        })),
      );
      MatheBuilderUI.renderLibrary();
    });
    assert.equal(await page.locator(".builder-card").count(), 51);
    await page.setViewportSize({ width: 320, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.evaluate(() => {
      const lib = MatheTemplates.open(appStorage);
      lib
        .read()
        .slice(1)
        .forEach((t) => lib.remove(t.id));
      MatheBuilderUI.renderLibrary();
    });
    // Use actual app theme surfaces; both dark themes must keep the editor legible.
    for (const theme of [0, 1, 2, 3, 4, 5]) {
      const ratios = await page.evaluate((theme) => {
        applyThemeIndex(theme, false);
        const rgba = (s) => {
          const a = s.match(/[\d.]+/g).map(Number);
          return [a[0], a[1], a[2], a.length > 3 ? a[3] : 1];
        };
        const background = (e) => {
          if (!e) return [255, 255, 255];
          const c = rgba(getComputedStyle(e).backgroundColor),
            p = background(e.parentElement);
          return c.slice(0, 3).map((v, i) => v * c[3] + p[i] * (1 - c[3]));
        };
        const luminance = (c) =>
          c
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        return ["#builderHome", "#builderBoxes button", "#builderTitle"].map(
          (selector) => {
            const e = document.querySelector(selector),
              a = luminance(rgba(getComputedStyle(e).color).slice(0, 3)),
              b = luminance(background(e));
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          },
        );
      }, theme);
      assert(
        ratios.every((r) => r >= 4.5),
        "builder contrast in theme " + theme + ": " + ratios.join(","),
      );
    }
    await page.evaluate(() => applyThemeIndex(0, false));
    // Truth/comparison and flash/time options use the normal answer flow.
    for (const format of ["wahrfalsch", "compare", "gap"]) {
      await page.evaluate((format) => {
        const c = MatheBuilder.fromLegacy("plus", { maxWert: "100" });
        c.numbers.forEach((n, i) => {
          n.kind = "fixed";
          n.value = i ? 5 : 3;
        });
        c.format = format;
        if (format === "gap") {
          c.legacy.flashMode = "1";
          c.legacy.flashShowSec = "1";
          c.legacy.timeLimitSec = "30";
        }
        appStorage.setItem("mathBuilderActive_v1", JSON.stringify(c));
        appStorage.setItem(
          modeSettingsKey("builder"),
          JSON.stringify(c.legacy),
        );
        document.getElementById("builderHome").open = false;
        document.getElementById("viewSelect").value = "builder";
        wechselAnsicht(false);
      }, format);
      const task = await page.evaluate(() =>
        JSON.parse(
          document.querySelector("#zeilenAufgaben [data-task]").dataset.task,
        ),
      );
      if (format === "wahrfalsch")
        await page
          .locator("#zeilenAufgaben button")
          .filter({ hasText: task.isTrue ? "Richtig" : "Falsch" })
          .click();
      else if (format === "compare") {
        await page.locator("#zeilenAufgaben select").selectOption(task.correct);
        await page.waitForTimeout(1100);
        assert.equal(
          await page.locator("#zeilenAufgaben select").inputValue(),
          "",
        );
      } else {
        await page.waitForTimeout(1200);
        assert(await page.locator("#zeilenAufgaben .flashHidden").count());
        assert(await page.evaluate(() => !!window._roundTimerTimeout));
      }
    }
    // Old special modes remain usable.
    for (const mode of [
      "pyramide",
      "traube",
      "squareMal",
      "squareDiv",
      "double",
      "half",
      "mixedMal",
    ]) {
      await page.evaluate((mode) => {
        document.getElementById("viewSelect").value = mode;
        wechselAnsicht(false);
      }, mode);
      assert(
        await page
          .locator(
            mode === "pyramide"
              ? "#mauer input"
              : mode === "traube"
                ? "#traube input"
                : "#zeilenAufgaben input",
          )
          .count(),
        mode,
      );
    }
    await page.evaluate(() => {
      document.getElementById("builderHome").open = true;
      MatheBuilderUI.openFamily("plus");
      document.getElementById("builderEditor").hidden = false;
    });
    await page
      .locator("#builderHome")
      .screenshot({ path: "/tmp/mathekids-builder.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: visual slots, fixed/range preview, stable templates, restart, practice/score, delete confirmation, independent families, 2–10 terms, 320–768px + 200% text, sharing and original special modes",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
