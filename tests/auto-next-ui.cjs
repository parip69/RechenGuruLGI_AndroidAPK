const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const assets=path.resolve(__dirname,'../app/src/main/assets');
const simple={op:'plus',fmt:'standard',a:3,b:5,res:8,sym:'+',missing:2,key:'auto-test'};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
 try {for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}:{})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{const name=new URL(route.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':undefined}):route.abort();});
  await page.addInitScript(()=>{window.AndroidInterface={getAppVersionName:()=> '99999',openExternal:()=>true,shareLink:()=>true};});
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(400);
  const score=()=>page.evaluate(()=>({right:scoreCorrect,wrong:scoreWrong}));
  const input=()=>page.locator('#zeilenAufgaben input').first();
  const inject=async()=>{await page.evaluate(task=>{RealschuleUI.switchSection('grundschule');document.getElementById('viewSelect').value='plus';document.getElementById('settingsDetails').open=false;initGame(false);const root=document.getElementById('zeilenAufgaben');root.replaceChildren();renderTask(root,task,100);focusFirstTaskInput(true);},simple);await page.waitForTimeout(280);};
  assert(await page.locator('#autoNextCorrect').isChecked());
  for(const submit of ['enter','inline','forward','keypad'].filter(v=>mobile||v!=='keypad')){
   await inject();const before=await score();await input().fill('8');
   if(submit==='enter')await input().press('Enter');else if(submit==='inline')await page.locator('[data-answer-next]').click();else if(submit==='forward')await page.locator('#refreshBtn').click();else {await input().click();await page.locator('#mgKeypad [data-mgk="nx"]').click();}
   assert.deepEqual(await score(),{right:before.right+1,wrong:before.wrong},submit);
   assert.equal(await page.locator('#zeilenAufgaben .steinInput').getAttribute('data-state'),'correct');
   assert.match(await page.locator('#zeilenAufgaben .steinInput').evaluate(e=>getComputedStyle(e,'::after').content),/✓/);
   await page.waitForTimeout(1450);assert.equal(await input().inputValue(),'');assert(await input().evaluate(e=>e===document.activeElement),'cursor in next answer');assert.deepEqual(await score(),{right:before.right+1,wrong:before.wrong});
  }
  await page.evaluate(()=>setAutoNextCorrect(false));
  for(const next of ['enter','inline','forward']){
   await inject();const before=await score();await input().fill('8');await input().press('Enter');await page.waitForTimeout(1450);assert.equal(await input().inputValue(),'8');
   if(next==='enter')await input().press('Enter');else if(next==='inline')await page.locator('[data-answer-next]').click();else await page.locator('#refreshBtn').click();
   assert.equal(await input().inputValue(),'');assert(await input().evaluate(e=>e===document.activeElement),'cursor in next answer');assert.deepEqual(await score(),{right:before.right+1,wrong:before.wrong},'confirmed correct stays correct: '+next);
  }
  await page.evaluate(()=>setAutoNextCorrect(true));
  await inject();let before=await score();await input().fill('7');await page.locator('#refreshBtn').click();await page.waitForTimeout(1450);assert.equal(await input().inputValue(),'7');assert.deepEqual(await score(),before);await page.locator('#tipBtn').click();await page.waitForTimeout(300);await input().press('Enter');assert.equal(await input().inputValue(),'');assert(await input().evaluate(e=>e===document.activeElement),'cursor in next answer');assert.deepEqual(await score(),{right:before.right,wrong:before.wrong+1});
  await inject();before=await score();await input().fill('7');await input().press('Enter');await page.waitForTimeout(300);await input().fill('8');await page.locator('#refreshBtn').click();await page.waitForTimeout(1450);assert.equal(await input().inputValue(),'');assert(await input().evaluate(e=>e===document.activeElement),'cursor in next answer');assert.deepEqual(await score(),{right:before.right+1,wrong:before.wrong});
  await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.locator('#autoNextCorrect').uncheck();await page.locator('#closeSettingsBottom').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);
  await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.locator('#scoreArea').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);
  await page.reload();await page.waitForTimeout(400);assert.equal(await page.locator('#autoNextCorrect').isChecked(),false);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS',mobile?'Android touch':'Desktop','Enter/Weiter/forward, green confirmation, automatic/manual advance, correct counted once, wrong waits, retry/help, settings close/persistence');
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
