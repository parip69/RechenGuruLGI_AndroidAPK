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
  assert.equal(await page.locator('#autoNextCorrect').isChecked(),true,'default on');
  await inject();let initial=await score();await input().fill('8');
  assert.equal(await input().evaluate(e=>e.parentElement.dataset.state),'correct');
  await page.waitForTimeout(1100);assert.equal(await input().inputValue(),'');
  assert.deepEqual(await score(),{right:initial.right+1,wrong:initial.wrong});
  assert(await input().evaluate(e=>e===document.activeElement));
  await inject();initial=await score();await input().fill('7');await input().press('Enter');
  await page.waitForTimeout(1100);assert.equal(await input().inputValue(),'7');
  assert.equal(await input().evaluate(e=>e.parentElement.dataset.state),'wrong');
  await input().fill('8');await page.waitForTimeout(1100);assert.equal(await input().inputValue(),'');
  assert.deepEqual(await score(),{right:initial.right+1,wrong:initial.wrong});
  // Cancels a pending success when the pupil edits the answer.
  await inject();initial=await score();await input().fill('8');await page.waitForTimeout(200);await input().fill('7');await page.waitForTimeout(1000);
  assert.equal(await input().inputValue(),'7');assert.deepEqual(await score(),initial);
  await page.evaluate(()=>setAutoNextCorrect(false));await page.reload();await page.waitForTimeout(400);
  assert.equal(await page.locator('#autoNextCorrect').isChecked(),false,'saved off');
  await inject();initial=await score();await input().fill('8');await page.waitForTimeout(1100);assert.equal(await input().inputValue(),'8');assert.deepEqual(await score(),initial);
  await input().press('Enter');assert.equal(await input().inputValue(),'');
  await page.evaluate(()=>setAutoNextCorrect(true));
  // Opening settings cancels progression; clicking outside still performs its action.
  await inject();await input().fill('8');await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.waitForTimeout(1100);assert.equal(await input().inputValue(),'8');
  await page.locator('#refreshBtn').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);assert.equal(await input().inputValue(),'');
  // A previously confirmed answer must only advance, never score again.
  await inject();let before=await score();await page.evaluate(()=>{const row=document.querySelector('#zeilenAufgaben .zeilenAufgabe');const state=answerState(row);document.querySelector('#zeilenAufgaben input').value='8';completeAnswer(row,MatheAnswerFlow.finish(state,'correct'));});await page.locator('#refreshBtn').click();assert.deepEqual(await score(),{right:before.right+1,wrong:before.wrong});assert(await input().evaluate(e=>e===document.activeElement));
  await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.locator('#closeSettingsBottom').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);
  await page.evaluate(()=>document.getElementById('settingsDetails').open=true);await page.locator('#scoreArea').click();assert.equal(await page.locator('#settingsDetails').getAttribute('open'),null);
  await page.evaluate(()=>RealschuleUI.switchSection('realschule'));
  await page.locator('.rs-settings').evaluate(e=>e.open=true);
  assert.equal(await page.locator('#rsAutoNextCorrect').isChecked(),true);
  await page.locator('#rsGrade').selectOption('7');await page.locator('#rsAll').uncheck();
  await page.evaluate(()=>{document.querySelectorAll('#rsTopics input').forEach(e=>e.checked=false);document.getElementById('rsTopics').dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('[data-topic="7:termValue"]').check();await page.locator('#rsStart').click();
  const rsAnswer=await page.evaluate(()=>{const c=RealschuleUI.getState().session.current;let seed=c.seed;const task=MatheRealschule.generate(c.id,c.grade,c.difficulty,()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});return String(task.answer.n/task.answer.d);});
  await page.locator('#rsAnswer').fill('999999');await page.waitForTimeout(1100);assert.equal(await page.locator('#rsAnswer').inputValue(),'999999');
  await page.locator('#rsAnswer').press('Enter');await page.waitForTimeout(1100);assert.equal(await page.locator('#rsFeedback').getAttribute('data-kind'),'wrong');
  await page.locator('#rsAnswer').fill(rsAnswer);await page.waitForTimeout(2000);
  assert.equal(await page.locator('#rsAnswer').inputValue(),'');assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.correct),1);
  await page.locator('.rs-settings').evaluate(e=>e.open=true);await page.locator('#rsCloseSettings').click();assert.equal(await page.locator('.rs-settings').getAttribute('open'),null);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS',mobile?'Android touch':'Desktop','default automatic success, wrong stays and correction, cancellation, saved off, focus, exact scoring, outside/settings close');
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
