// Browser check: Playwright and Chromium; CHROMIUM_PATH can select a local browser.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=path.resolve(__dirname,'../app/src/main/assets'),version=fs.readFileSync(path.resolve(__dirname,'../version.properties'),'utf8').match(/VERSION_NAME=(\d+)/)[1];
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{const name=new URL(r.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);if(fs.existsSync(file)&&fs.statSync(file).isFile())return r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined});return r.abort();});
 await page.addInitScript(v=>{window.AndroidInterface={getAppVersionName:()=>v,openExternal:()=>true,shareLink:()=>true};},version);
 await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(600);
 await page.evaluate(()=>{document.getElementById('viewSelect').value='plus';wechselAnsicht(false);document.getElementById('maxWert').value='100';document.getElementById('op1Mode').value='tens';saveModeSettings('plus');openViewSelectPopup();});
 await page.locator('.selectPopupItem[data-value="chain"]').click();
 await page.locator('#settingsDetails').evaluate(e=>e.open=true);
 assert(await page.locator('#chainGroup').isVisible());assert(!(await page.locator('#taskFormatGroup').isVisible()));
 await page.locator('#chainLength').selectOption('6');await page.locator('#maxWert').fill('100');await page.locator('#maxWert').dispatchEvent('change');
 await page.locator('[data-chain-op="minus"]').click();await page.locator('[data-chain-op="mal"]').click();await page.locator('[data-chain-op="geteilt"]').click();
 const before=await page.evaluate(()=>({ops:document.getElementById('chainOps').value,length:document.getElementById('chainLength').value,task:JSON.parse(document.querySelector('#zeilenAufgaben [data-task]').dataset.task)}));
 assert.equal(before.task.numbers.length,6);assert.equal(before.ops.split(',').length,4);assert(before.task.res<=100);
 await page.locator('[data-chain-solution]').first().click();assert(await page.locator('#chainGuide').isVisible());assert.equal(await page.locator('#chainGuide .chain-paper>div').count(),6);assert((await page.locator('#chainGuide .chain-paper').innerText()).includes(String(before.task.res)));
 assert.equal(await page.locator('#chainGuide').evaluate(e=>Math.round(e.getBoundingClientRect().height)),844);
 await page.locator('#chainGuide [data-close]').click();
 await page.reload();await page.waitForTimeout(500);assert.equal(await page.locator('#viewSelect').inputValue(),'chain');assert.equal(await page.locator('#chainLength').inputValue(),'6');assert.equal(await page.locator('#chainOps').inputValue(),before.ops);
 await page.locator('#settingsDetails').evaluate(e=>e.open=false);
 const taskKey=await page.locator('#zeilenAufgaben [data-task]').first().getAttribute('data-task'),task=JSON.parse(taskKey);
 await page.locator('#zeilenAufgaben input').first().fill(String(task.res));await page.waitForTimeout(270);await page.locator('#zeilenAufgaben input').first().press('Enter');await page.waitForTimeout(1400);
 assert.equal(await page.locator('#zeilenAufgaben [data-task]').first().getAttribute('data-task'),taskKey);assert((await page.locator('#zeilenAufgaben .steinInput').first().getAttribute('data-state'))==='correct');
 await page.evaluate(()=>{document.getElementById('viewSelect').value='plus';wechselAnsicht(false);});assert.equal(await page.locator('#maxWert').inputValue(),'100');assert.equal(await page.locator('#op1Mode').inputValue(),'tens');
 await page.locator('#schoolInfoBtn').click();assert((await page.locator('#schoolInfo').innerText()).includes('Rechenketten'));await page.locator('#schoolInfoClose').click();
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await page.evaluate(()=>{document.getElementById('viewSelect').value='chain';wechselAnsicht(false);document.getElementById('settingsDetails').open=true;});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow at ${width}`);}
 assert.deepEqual(errors,[]);await page.screenshot({path:(process.env.TEST_ARTIFACT_DIR||require('os').tmpdir())+'/rechenketten-settings.png',fullPage:true});console.log('PASS: grouped menu, six operands, arbitrary operators, bounds, full-screen paper solution, local restore, manual next, old settings and responsive layout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
