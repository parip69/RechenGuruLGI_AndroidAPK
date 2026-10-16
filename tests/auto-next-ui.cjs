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
  assert.equal(await page.locator('[data-answer-next]').count(),0);
  for(const submit of ['enter','forward','keypad'].filter(v=>mobile||v!=='keypad')){
   for(const value of ['8','7']) {
    await inject();const before=await score();await input().fill(value);assert.deepEqual(await score(),before,'typing never scores');if(value==='8')assert.equal(await input().evaluate(e=>e.parentElement.dataset.state),'correct','green confirmation before Enter');
    if(submit==='enter')await input().press('Enter');else if(submit==='forward')await page.locator('#refreshBtn').click();else {await input().click();await page.locator('#mgKeypad [data-mgk="nx"]').click();}
    assert.equal(await input().inputValue(),'','immediate next task: '+submit);
    assert(await input().evaluate(e=>e===document.activeElement),'cursor in next answer');
    assert.deepEqual(await score(),{right:before.right+(value==='8'?1:0),wrong:before.wrong+(value==='7'?1:0)},submit);
    await page.waitForTimeout(1400);assert.deepEqual(await score(),{right:before.right+(value==='8'?1:0),wrong:before.wrong+(value==='7'?1:0)},'no delayed duplicate score');
   }
  }
  // A previously confirmed answer must only advance, never score again.
  await inject();let before=await score();await page.evaluate(()=>{const row=document.querySelector('#zeilenAufgaben .zeilenAufgabe');const state=answerState(row);document.querySelector('#zeilenAufgaben input').value='8';completeAnswer(row,MatheAnswerFlow.finish(state,'correct'));});await page.locator('#refreshBtn').click();assert.deepEqual(await score(),{right:before.right+1,wrong:before.wrong});assert(await input().evaluate(e=>e===document.activeElement));
  await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.locator('#closeSettingsBottom').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);
  await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.locator('#scoreArea').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS',mobile?'Android touch':'Desktop','Enter/new task/keypad: immediate advance, exact right/wrong counts, focus, no extra button, no double scoring, settings close');
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
