const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=path.resolve(__dirname,'../app/src/main/assets'),base='https://parip69.github.io/RechenGuruLGI_AndroidAPK/';
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 async function context(){const c=await browser.newContext();await c.route('**/*',r=>{const name=new URL(r.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);if(fs.existsSync(file)&&fs.statSync(file).isFile())return r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined});return r.abort();});await c.addInitScript(()=>window.AndroidInterface={getAppVersionName:()=>'99999',openExternal:()=>true,shareLink:url=>{window.__shared=url;return true;}});return c;}
 try{
  const source=await context(),page=await source.newPage();await page.goto(base);await page.waitForTimeout(350);
  const raw=await page.evaluate(()=>{document.getElementById('viewSelect').value='plus';wechselAnsicht(false);const c=MatheBuilder.fromLegacy('plus',{maxWert:'20'});c.numbers[0].min=1;c.numbers[0].max=10;c.numbers[1].min=1;c.numbers[1].max=9;c.numbers[0].query=true;document.getElementById('positionConfig').value=JSON.stringify(c);saveModeSettings('plus');appStorage.setItem('mathParentPin','1234');return JSON.stringify(c);});
  await page.locator('#appShareWidget button').click();await page.locator('input[name=appShareMode][value=data]').check();
  while(await page.locator('#appShareGroups input[data-group]:checked').count())await page.locator('#appShareGroups input[data-group]:checked').first().uncheck();
  await page.locator('input[data-group=modes]').check();
  await page.locator('.appShareModesToggle').click();await page.locator('#appShareModesAll').uncheck();await page.locator('input[data-mode=plus]').check();
  await page.locator('#appShareStart').click();const url=await page.evaluate(()=>window.__shared);assert(url.includes('#settings='));
  const decoded=JSON.parse(Buffer.from(url.split('#settings=')[1],'base64url').toString());assert(!Object.keys(decoded.settings).includes('mathParentPin'));
  const target=await context(),other=await target.newPage();await other.goto(base);await other.waitForTimeout(300);await other.evaluate(()=>{appStorage.setItem('mathParentPin','4321');appStorage.setItem('mathModeSettings:minus',JSON.stringify({maxWert:'81',op1Mode:'tens'}));});
  await other.goto(url);await other.locator('[data-act=ok]').click();await other.waitForTimeout(400);
  assert.equal(await other.evaluate(()=>JSON.parse(appStorage.getItem('mathModeSettings:plus')).positionConfig),raw);
  assert.equal(await other.evaluate(()=>JSON.parse(appStorage.getItem('mathModeSettings:minus')).maxWert),'81');assert.equal(await other.evaluate(()=>appStorage.getItem('mathParentPin')),'4321');
  const portable=await page.evaluate(async()=>bundleRealschuleAssets(embedPortableAppStateIntoHtml(await(await fetch(location.href)).text())));
  for(const name of ['config.js','style.css','ui.js'])assert(!portable.includes('src="positions/'+name+'"')&&!portable.includes('href="positions/'+name+'"'));
  assert(portable.includes('window.MathePositions'));fs.writeFileSync('/tmp/mathekids-test-portable.html',portable);
  const local=await browser.newContext(),localPage=await local.newPage();await local.route('**/*',r=>r.request().url()===base+'portable-test.html'?r.fulfill({body:portable,contentType:'text/html'}):r.abort());await localPage.goto(base+'portable-test.html');await local.setOffline(true);await localPage.waitForTimeout(350);
  assert.equal(await localPage.locator('#positionConfig').inputValue(),raw);assert.equal(await localPage.locator('#zeilenAufgaben [data-task]').count(),1);
  await page.locator('#appShareWidget button').click();await page.locator('input[name=appShareMode][value=app]').check();await page.locator('#appShareStart').click();assert(!(await page.evaluate(()=>window.__shared)).includes('#settings='));
  console.log('PASS: position configuration travels inside existing mode sharing; import preserves other profiles and PIN; portable HTML embeds all new modules and works offline; plain sharing stays plain');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
