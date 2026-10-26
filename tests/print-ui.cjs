// Verify each print request contains fresh tasks and a standalone light document.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const assets = path.resolve(__dirname, '../app/src/main/assets');
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin !== 'https://print.test') return route.abort();
      const file = path.join(assets, new URL(route.request().url()).pathname.slice(1) || 'index.html');
      return fs.existsSync(file) ? route.fulfill({path:file}) : route.abort();
    });
    await page.goto('https://print.test/index.html');
    await page.evaluate(() => {
      window.AndroidPrint = {printPage: html => {window.printedHTML = html;}};
      window.print = () => AndroidPrint.printPage(buildNativePrintHTML());
    });
    for (const mode of ['mal', 'plus', 'chain', 'mixedMal', 'pyramide', 'traube']) {
      const sheets = [];
      for (let i=0; i<2; i++) {
        sheets.push(await page.evaluate(mode => {
          document.getElementById('viewSelect').value = mode;
          printSheet();
          return window.printedHTML;
        }, mode));
      }
      assert.notEqual(sheets[0], sheets[1], `${mode}: fresh tasks`);
      const preview = await browser.newPage();
      await preview.setContent(sheets[1]);
      assert(await preview.locator('.pTask').count() > 0, `${mode}: tasks present`);
      assert.equal(await preview.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
      assert.equal(await preview.locator('.pTask').first().evaluate(el => getComputedStyle(el).color), 'rgb(0, 0, 0)');
      assert.equal(await preview.locator('script').count(), 0);
      assert(!/undefined|NaN/.test(await preview.locator('body').innerText()), `${mode}: valid tasks`);
      if (mode === 'mal') await preview.pdf({path:'/tmp/mathe-print.pdf', preferCSSPageSize:true});
      await preview.close();
    }
    await page.evaluate(() => {
      wrongPool = [{op:'plus',a:7,b:8,res:15,fmt:'standard'}];
      window.open = () => {throw Error('Native printing must not open a popup');};
      printWrongPoolSheetFromOverlay();
    });
    assert((await page.evaluate(() => window.printedHTML)).includes('7'));
    await page.emulateMedia({media:'print'});
    for (const selector of ['html', 'body']) {
      assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    }
    console.log('Print checks passed: fresh tasks, light standalone sheets, saved mistakes.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exit(1);});
