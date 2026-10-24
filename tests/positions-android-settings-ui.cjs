const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=path.resolve(__dirname,'../app/src/main/assets');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.route('**/*',r=>{const name=new URL(r.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);return fs.existsSync(file)&&fs.statSync(file).isFile()?r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined}):r.abort();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.nativeSettings=[];window.AndroidInterface={getAppVersionName:()=> '231',setSettingsDialogOpen:open=>nativeSettings.push(open)};});
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(500);
  for(const mode of ['plus','minus','mix','mal','geteilt','mixMD','chain','mixALL','squareMal','squareDiv','pyramide','traube','double','half','fehler']){
   await page.evaluate(m=>{document.getElementById('viewSelect').value=m;wechselAnsicht(false);MathePositions.openSettings();},mode);
   assert.equal(await page.evaluate(()=>nativeSettings.at(-1)),true,'native refresh blocked in '+mode);
   await page.locator('#tileSettingsDialog [data-close]').click();await page.waitForTimeout(30);
   assert.equal(await page.evaluate(()=>nativeSettings.at(-1)),false,'native refresh restored after '+mode);
  }
  await page.evaluate(()=>{document.getElementById('viewSelect').value='mal';wechselAnsicht(false);MathePositions.openSettings();document.getElementById('mulProfile').value='table9';document.getElementById('mulProfile').dispatchEvent(new Event('change',{bubbles:true}));});
  const ten=page.locator('#rowChips [data-value="10"]');
  assert.equal(await ten.getAttribute('aria-disabled'),'true');assert(await page.locator('#rowProfileHint').isVisible());
  assert((await page.locator('#rowProfileHint').innerText()).includes('1–9'));
  assert.equal(await page.locator('#mulProfile').inputValue(),'table9','opening settings does not change saved profile');
  await page.getByRole('button',{name:'1×1 bis 10 verwenden',exact:true}).click();
  assert.equal(await page.locator('#mulProfile').inputValue(),'table');
  assert.equal(await ten.getAttribute('data-disabled'),null);assert(!(await page.locator('#rowProfileHint').isVisible()));
  await ten.click();await page.waitForTimeout(80);assert.equal(await page.locator('#rowTrain').inputValue(),'10');
  await page.getByRole('button',{name:'5 Beispielaufgaben',exact:true}).click();
  assert.equal(await page.locator('#positionExamples p').count(),5);
  const tasks=await page.evaluate(()=>Array.from({length:30},()=>MatheBuilder.generate(MathePositions.config())));
  for(const task of tasks){assert(task.numbers.includes(10),'selected 10er row');assert(task.rhs<=100);}
  await page.locator('#tileSettingsDialog [data-close]').click();await page.reload();await page.waitForTimeout(350);
  await page.evaluate(()=>{document.getElementById('viewSelect').value='mal';wechselAnsicht(false);MathePositions.openSettings();});
  assert.equal(await page.locator('#mulProfile').inputValue(),'table');assert.equal(await page.locator('#rowTrain').inputValue(),'10');
  await page.keyboard.press('Escape');await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>nativeSettings.at(-1)),false);
  await page.evaluate(()=>MathePositions.openSettings());await page.locator('#positionPractice').click();await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>nativeSettings.at(-1)),false);
  assert.deepEqual(errors,[]);console.log('PASS: native scroll guard toggles in all 15 modes, close/Escape/practice; 1–9 profile explained and preserved until explicit switch; 10er row selectable, generated correctly and restored after reload');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
