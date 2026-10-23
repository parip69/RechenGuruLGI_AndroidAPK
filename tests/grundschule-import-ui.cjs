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
        serviceWorkers: "block",
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
    await page.addInitScript(
      () =>
        (window.AndroidInterface = {
          getAppVersionName: () => "99999",
          openExternal: () => true,
          shareLink: (url) => {
            window.__shared = url;
            return true;
          },
        }),
    );
    const base = "https://parip69.github.io/RechenGuruLGI_AndroidAPK/";
    await page.goto(base);
    await page.waitForTimeout(300);
    const original = await page.evaluate(() => {
      appStorage.setItem("mathParentPin", "1234");
      appStorage.setItem(
        "mathModeSettings:minus",
        JSON.stringify({ maxWert: "81", op1Mode: "tens" }),
      );
      return MatheTemplates.open(appStorage).save({
        title: "Vorlage <Test>",
        config: MatheBuilder.fromLegacy("plus", { maxWert: "100" }),
      });
    });
    await page.locator("#appShareWidget button").click();
    await page.locator("input[name=appShareMode][value=data]").check();
    while (
      await page.locator("#appShareGroups input[data-group]:checked").count()
    )
      await page
        .locator("#appShareGroups input[data-group]:checked")
        .first()
        .uncheck();
    await page.locator("input[data-group=templates]").check();
    await page.locator("#appShareStart").click();
    const url = await page.evaluate(() => window.__shared);
    assert(url.includes("#settings="));
    await page.goto(url);
    await page.locator("[data-act=ok]").click();
    await page.waitForTimeout(600);
    const templates = await page.evaluate(() =>
      MatheTemplates.open(appStorage).read(),
    );
    assert.equal(templates.length, 2);
    assert.equal(templates[0].id, original.id);
    assert.notEqual(templates[1].id, original.id);
    assert.equal(templates[1].title, original.title);
    assert.equal(
      await page.evaluate(() => appStorage.getItem("mathParentPin")),
      "1234",
    );
    // Ordinary no-settings sharing stays a plain app link.
    await page.locator("#appShareWidget button").click();
    await page.locator("#appShareStart").click();
    assert(
      !(await page.evaluate(() => window.__shared)).includes("#settings="),
    );
    // Older schema-1 links remain readable; unrelated saved templates survive.
    const legacy = {
      kind: "RechenGuru-settings",
      schema: 1,
      settings: { mathTargetCorrect: "17" },
    };
    await page.goto(
      base +
        "#settings=" +
        Buffer.from(JSON.stringify(legacy)).toString("base64url"),
    );
    await page.locator("[data-act=ok]").click();
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => appStorage.getItem("mathTargetCorrect")),
      "17",
    );
    assert.equal(
      await page.evaluate(() => MatheTemplates.open(appStorage).read().length),
      2,
    );
    // Fully self-contained HTML embeds the new modules and merges rather than overwrites.
    const portable = await page.evaluate(async () =>
      bundleRealschuleAssets(
        embedPortableAppStateIntoHtml(
          await (await fetch(location.href)).text(),
        ),
      ),
    );
    assert(!portable.includes('src="grundschule/'));
    assert(!portable.includes('href="grundschule/'));
    const exported = await context.newPage();
    exported.on("pageerror", (e) => errors.push(e.message));
    exported.on("dialog", (d) => d.accept());
    await exported.route("**/portable-builder.html", (r) =>
      r.fulfill({ body: portable, contentType: "text/html" }),
    );
    await exported.goto(base + "portable-builder.html");
    await exported.waitForTimeout(600);
    assert.equal(
      await exported.evaluate(() => typeof MatheBuilder.generate),
      "function",
    );
    assert.equal(
      await exported.evaluate(
        () => MatheTemplates.open(appStorage).read().length,
      ),
      4,
    );
    assert.equal(
      await exported.evaluate(
        (id) =>
          MatheTemplates.open(appStorage)
            .read()
            .filter((t) => t.id === id).length,
        original.id,
      ),
      1,
    );
    assert.equal(
      await exported.evaluate(
        () => JSON.parse(appStorage.getItem("mathModeSettings:minus")).op1Mode,
      ),
      "tens",
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS: explicit template link import, new IDs, existing data/PIN preserved, plain share, schema-1 links and self-contained portable HTML merge",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
