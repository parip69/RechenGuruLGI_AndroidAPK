const { chromium } = require("playwright"),
  fs = require("fs"),
  path = require("path"),
  http = require("http"),
  assert = require("node:assert/strict");
const assets = path.resolve(__dirname, "../app/src/main/assets");
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.join(
      assets,
      decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(
        /^\//,
        "",
      ) || "index.html",
    );
    if (
      !file.startsWith(assets + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader(
      "Content-Type",
      file.endsWith(".js")
        ? "application/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : file.endsWith(".html")
            ? "text/html"
            : file.endsWith(".json") || file.endsWith(".webmanifest")
              ? "application/json"
              : file.endsWith(".png")
                ? "image/png"
                : "application/octet-stream",
    );
    res.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext(),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const url = "http://127.0.0.1:" + server.address().port + "/";
    await page.goto(url);
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;
    });
    const cached = await page.evaluate(async () => {
      const keys = await caches.keys(),
        cache = await caches.open(
          keys.find((k) => k.startsWith("rechenguru-lgi-v")),
        );
      return Promise.all(
        ["config.js", "templates.js", "ui.js", "style.css"].map((name) =>
          cache.match("./grundschule/" + name).then(Boolean),
        ),
      );
    });
    assert(cached.every(Boolean), "all builder modules cached");
    const id = await page.evaluate(() => {
      const t = MatheTemplates.open(appStorage).save({
        title: "Offline üben",
        config: MatheBuilder.fromLegacy("plus", { maxWert: "100" }),
      });
      appStorage.setItem("mathBuilderActive_v1", JSON.stringify(t.config));
      document.getElementById("viewSelect").value = "builder";
      wechselAnsicht(false);
      return t.id;
    });
    await page.reload();
    await page.evaluate(async () => {
      if (!navigator.serviceWorker.controller)
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            resolve,
            { once: true },
          ),
        );
    });
    await context.setOffline(true);
    await page.reload();
    assert.equal(
      await page.evaluate(() => MatheTemplates.open(appStorage).read()[0].id),
      id,
    );
    assert.equal(await page.locator("#viewSelect").inputValue(), "builder");
    assert(await page.locator("#zeilenAufgaben input").count());
    const t = await page.evaluate(() =>
      JSON.parse(
        document.querySelector("#zeilenAufgaben [data-task]").dataset.task,
      ),
    );
    assert.equal(t.numbers[0] + t.numbers[1], t.res);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS: real service-worker precache includes all new modules; offline reload restores personal template and generates configured exercise",
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
