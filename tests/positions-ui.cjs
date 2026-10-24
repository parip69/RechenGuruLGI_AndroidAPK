const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=path.resolve(__dirname,'../app/src/main/assets');
 const version=fs.readFileSync(path.resolve(__dirname,'../version.properties'),'utf8').match(/VERSION_NAME=(\d+)/)[1];
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>{const name=new URL(r.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);if(fs.existsSync(file)&&fs.statSync(file).isFile())return r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined});return r.abort();});
  await page.addInitScript(v=>{window.AndroidInterface={getAppVersionName:()=>v,openExternal:()=>true,shareLink:()=>true};},version);
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(600);
  assert.deepEqual(errors,[]);
  await page.locator('#viewSelectOverlay').click();
  assert.equal(await page.locator('.position-tile:not(.small)').count(),6);
  assert.equal(await page.locator('.position-tile').count(),9);
  assert(!(await page.locator('#mgKeypad').evaluate(e=>e.classList.contains('show'))));
  await page.locator('[data-family="sum"] .position-tile-gear').click();
  assert(await page.locator('#tileSettingsDialog').isVisible());
  assert.equal(await page.locator('.position-slot').count(),4);
  await page.locator('#maxWert').fill('100');await page.locator('#maxWert').dispatchEvent('change');
  await page.getByRole('button',{name:'5 Beispielaufgaben',exact:true}).click();assert.equal(await page.locator('#positionExamples p').count(),5);
  await page.getByRole('button',{name:'1. Zahl einstellen',exact:true}).click();
  await page.locator('.position-detail').getByRole('button',{name:'10–99',exact:true}).click();
  await page.locator('.position-detail').getByLabel('Von',{exact:true}).fill('10');await page.locator('.position-detail').getByLabel('Von',{exact:true}).dispatchEvent('change');
  await page.locator('.position-detail').getByLabel('Bis',{exact:true}).fill('20');await page.locator('.position-detail').getByLabel('Bis',{exact:true}).dispatchEvent('change');
  await page.getByRole('button',{name:'2. Zahl einstellen',exact:true}).click();await page.locator('.position-detail').getByRole('button',{name:'1–9',exact:true}).click();
  const numberSlots=page.locator('.position-slot').filter({has:page.locator('small').filter({hasText:/^[12]\. Zahl$/})});
  await numberSlots.nth(0).getByRole('checkbox',{name:'Lücke',exact:true}).check();
  await numberSlots.nth(1).getByRole('checkbox',{name:'Lücke',exact:true}).check();
  await page.getByRole('button',{name:'5 Beispielaufgaben',exact:true}).click();
  assert.equal(await page.locator('#positionExamples p').count(),5);
  await page.locator('#positionPractice').click();
  const before=await page.evaluate(()=>{
   const tasks=Array.from({length:60},()=>MathePositions.generate('plus'));
   return {raw:document.getElementById('positionConfig').value,gaps:[...new Set(tasks.map(t=>t.gap))],valid:tasks.every(t=>t.numbers[0]>=10&&t.numbers[0]<=20&&t.numbers[1]>=1&&t.numbers[1]<=9),task:JSON.parse(document.querySelector('#zeilenAufgaben [data-task]').dataset.task)};
  });
  assert(before.valid);assert.equal(before.gaps.length,3);assert.equal(before.task.op,'builder');
  await page.locator('#zeilenAufgaben').getByRole('button',{name:'Rechenweg',exact:true}).first().click();assert(await page.locator('#chainGuide').isVisible());await page.locator('#chainGuide [data-close]').click();
  await page.reload();await page.waitForTimeout(400);assert.equal(await page.locator('#positionConfig').inputValue(),before.raw);
  await page.evaluate(()=>openViewSelectPopup());await page.locator('[data-family="chain"] .position-tile-gear').click();
  assert.equal(await page.locator('#positionConfig').inputValue(),'','a new chain must not borrow the Plus configuration');
  assert.equal(await page.locator('.position-slot[data-slot=n0] .position-box').innerText(),'0–20');
  while(await page.evaluate(()=>MathePositions.config().numbers.length)<7){
   const old=await page.evaluate(()=>MathePositions.config().numbers.length);
   await page.getByRole('button',{name:'Eine Zahl mehr',exact:true}).click();
   assert.equal(await page.evaluate(()=>MathePositions.config().numbers.length),old+1);
  }
  assert.equal(await page.locator('.position-slot').count(),14);
  await page.getByRole('button',{name:'Zeichen 1 einstellen',exact:true}).click();
  await page.getByRole('button',{name:'2. Zahl einstellen',exact:true}).click();await page.locator('.position-detail').getByRole('button',{name:'0–9',exact:true}).click();
  await page.getByRole('button',{name:'Zeichen 1 einstellen',exact:true}).click();
  for(const symbol of ['−','×','÷'])await page.locator('.position-detail').getByRole('button',{name:symbol,exact:true}).click();
  // Division needs a nonzero divisor, validated visibly rather than changed silently.
  assert((await page.locator('#positionMessage').innerText()).includes('Null'));
  await page.getByRole('button',{name:'2. Zahl einstellen',exact:true}).click();await page.locator('.position-detail').getByRole('button',{name:'1–9',exact:true}).click();
  await page.locator('#maxWert').fill('100');await page.locator('#maxWert').dispatchEvent('change');
  for(const [width,height] of [[320,740],[390,844],[768,500]]){
   await page.setViewportSize({width,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
   assert(await page.locator('#tileSettingsDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'dialog overflow '+width);
   const boxes=await page.locator('.position-box').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.w-1&&b.x<a.x+a.w-1&&a.y<b.y+b.h-1&&b.y<a.y+a.h-1),'overlap');}
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/positions-chain-test.png',fullPage:true});
  await page.evaluate(()=>document.getElementById('tileSettingsDialog').style.fontSize='200%');
  assert(await page.locator('#tileSettingsDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.evaluate(()=>document.getElementById('tileSettingsDialog').style.fontSize='');
  if(!(await page.locator('.position-detail').count()))await page.getByRole('button',{name:'2. Zahl einstellen',exact:true}).click();
  const originalIds=await page.evaluate(()=>MathePositions.config().numbers.map(n=>n.id));
  await page.locator('.position-detail').getByRole('button',{name:'Rechenglied dahinter einfügen',exact:true}).click();
  assert.equal(await page.evaluate(()=>MathePositions.config().numbers.length),8);
  await page.getByRole('button',{name:'3. Zahl einstellen',exact:true}).click();
  await page.locator('.position-detail').getByRole('button',{name:'Dieses Rechenglied entfernen',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>MathePositions.config().numbers.map(n=>n.id)),originalIds);
  await page.locator('#tileSettingsDialog [data-close]').click();
  await page.evaluate(()=>openViewSelectPopup());await page.locator('[data-family="sum"] .position-tile-gear').click();assert.equal(await page.locator('#positionConfig').inputValue(),before.raw);
  // Bad ranges block starting and preserve the entered value.
  await page.getByRole('button',{name:'1. Zahl einstellen',exact:true}).click();await page.locator('.position-detail').getByLabel('Von',{exact:true}).fill('30');await page.locator('.position-detail').getByLabel('Von',{exact:true}).dispatchEvent('change');assert(await page.locator('#positionPractice').isDisabled());assert((await page.locator('#positionMessage').innerText()).includes('Minimum'));
  await page.locator('.position-detail').getByLabel('Von',{exact:true}).fill('10');await page.locator('.position-detail').getByLabel('Von',{exact:true}).dispatchEvent('change');
  await page.locator('#tileSettingsDialog [data-close]').click();
  for(const name of ['pyramid','grapes','product','square','double','half','errors']){
   await page.evaluate(()=>openViewSelectPopup());await page.locator(`[data-family="${name}"] .position-tile-gear`).click();assert(await page.locator('#tileSettingsDialog').isVisible());await page.locator('#tileSettingsDialog [data-close]').click();
  }
  assert.deepEqual(errors,[]); console.log('PASS: six main tiles, per-tile dialog, independent ranges, three random gap positions, preview, paper solution, reload, profile isolation, seven-number operator choices, validation, 320px/landscape wrapping, all special tiles');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
