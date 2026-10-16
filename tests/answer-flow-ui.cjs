const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const assets=path.resolve(__dirname,'../app/src/main/assets'),output=process.env.TEST_ARTIFACT_DIR||path.join(require('os').tmpdir(),'mathekids-ui');
fs.mkdirSync(output,{recursive:true});
const version=fs.readFileSync(path.resolve(__dirname,'../version.properties'),'utf8').match(/VERSION_NAME=(\d+)/)[1];
const simple={op:'plus',fmt:'standard',a:3,b:5,res:8,sym:'+',missing:2,key:'flow-test'};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
 try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}:{})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{let name=new URL(route.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html';const file=path.join(assets,name);if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined});return route.abort();});
  await page.addInitScript(v=>{window.AndroidInterface={getAppVersionName:()=>v,openExternal:()=>true,shareLink:()=>true};},version);
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(400);await page.evaluate(()=>setAutoNextCorrect(false));
  const score=()=>page.evaluate(()=>({correct:scoreCorrect,wrong:scoreWrong,totalCorrect,totalWrong,details:JSON.parse(appStorage.getItem('mathAnswerStats_v1')||'{}')}));
  const inject=async(task=simple)=>{await page.evaluate(task=>{RealschuleUI.switchSection('grundschule');document.getElementById('viewSelect').value='plus';document.getElementById('settingsDetails').open=false;initGame(false);const root=document.getElementById('zeilenAufgaben');root.replaceChildren();renderTask(root,task,100);focusFirstTaskInput(true);},task);await page.waitForTimeout(280);};
  const input=()=>page.locator('#zeilenAufgaben input').first();
  const next=async()=>{await page.waitForTimeout(270);if(mobile){await input().click();await page.locator('#mgKeypad [data-mgk="nx"]').click();}else await input().press('Enter');};
  const phase=()=>page.locator('#zeilenAufgaben .zeilenAufgabe').first().getAttribute('data-answer-phase');
  await inject();const base=await score();await input().fill('4');assert.equal(await phase(),null);assert.equal(await page.locator('.steinInput').getAttribute('data-state'),'neutral');assert.deepEqual(await score(),base);
  await page.locator('#tipBtn').click();assert.equal(await page.locator('#zeilenAufgaben input').inputValue(),'4');await next();assert.equal(await phase(),'retry');assert.equal((await score()).wrong,base.wrong);assert.equal(await input().inputValue(),'4');
  await page.locator('#tipBtn').click();await input().fill('8');assert.equal(await page.locator('.steinInput').getAttribute('data-state'),'neutral');await next();assert.equal(await phase(),'done');assert.equal((await score()).correct,base.correct+1);assert.equal((await score()).details.secondCorrect,1);assert.equal((await score()).details.helped,1);
  const key=await page.locator('[data-task]').first().getAttribute('data-task');await page.waitForTimeout(1300);assert.equal(await page.locator('[data-task]').first().getAttribute('data-task'),key);await next();assert.equal(await input().inputValue(),'');assert.equal((await score()).correct,base.correct+1);
  await inject();await input().fill('7');await next();const before=await score();await next();assert.equal((await score()).wrong,before.wrong+1);assert.equal(await input().inputValue(),'');
  await inject();await input().fill('7');await next();await input().fill('6');await next();assert.equal(await phase(),'done');assert.equal(await input().inputValue(),'6');const afterWrong=await score();await next();assert.equal((await score()).wrong,afterWrong.wrong);
  await inject();const beforeSkip=await score();await page.locator('#refreshBtn').click();assert.equal((await score()).wrong,beforeSkip.wrong+1);assert.equal((await score()).details.skipped,(beforeSkip.details.skipped||0)+1);
  await inject();await input().fill('8');await next();const beforeNew=await score();await page.waitForTimeout(270);await page.locator('#refreshBtn').click();assert.deepEqual(await score(),beforeNew);
  await inject();await input().fill('8');await page.waitForTimeout(270);await input().press('Enter');await input().dispatchEvent('keydown',{key:'Enter',repeat:true});await input().dispatchEvent('keydown',{key:'Enter'});assert.equal(await phase(),'done');assert.equal(await input().inputValue(),'8');
  await inject();await input().fill('7');await next();await input().fill('');assert.equal(await page.locator('.steinInput').getAttribute('data-state'),'neutral');await input().fill('8');await next();assert.equal(await phase(),'done');
  if(mobile){
   await inject({...simple,a:1000,b:234,res:1234});const unscored=await score();
   for(const digit of '1234')await page.locator(`#mgKeypad [data-mgk="${digit}"]`).click();
   assert.equal(await input().inputValue(),'1234');assert.deepEqual(await score(),unscored);
   await input().evaluate(e=>e.setSelectionRange(2,2));await page.locator('#mgKeypad [data-mgk="lf"]').click();assert.equal(await input().evaluate(e=>e.selectionStart),1);await page.locator('#mgKeypad [data-mgk="rt"]').click();assert.equal(await input().evaluate(e=>e.selectionStart),2);
   await input().evaluate(e=>e.setSelectionRange(1,3));await page.locator('#mgKeypad [data-mgk="bk"]').click();assert.equal(await input().inputValue(),'14');await page.locator('#mgKeypad [data-mgk="2"]').click();await page.locator('#mgKeypad [data-mgk="3"]').click();assert.equal(await input().inputValue(),'1234');assert.deepEqual(await score(),unscored);await next();assert.equal(await phase(),'done');
  }
  await inject({...simple,missing:1});assert.equal(await input().evaluate(e=>e.parentElement.nextElementSibling.textContent.trim()),'=');await input().fill('5');await next();assert.equal(await phase(),'done');
  for(const task of [{...simple,fmt:'operator',correctOp:'+'},{...simple,fmt:'compare',leftTxt:'3 + 5',rightTxt:'8',correct:'='}]){
   await inject(task);const before=await score();await page.locator('#zeilenAufgaben select').selectOption(task.correctOp||task.correct);assert.deepEqual(await score(),before);await page.waitForTimeout(270);await page.locator('[data-answer-next]').click();assert.equal(await phase(),'done');
  }
  await inject({...simple,fmt:'wahrfalsch',shownRes:8,isTrue:true});const choiceBefore=await score();await page.locator('#zeilenAufgaben .btn-mini').nth(1).click();assert.equal(await phase(),'retry');assert.deepEqual(await score(),choiceBefore);await page.waitForTimeout(270);await page.locator('#zeilenAufgaben .btn-mini').nth(0).click();assert.equal(await phase(),'done');assert.equal((await score()).correct,choiceBefore.correct+1);
  // A real multi-box grid is scored once, after visiting its last answer box.
  await page.evaluate(()=>{document.getElementById('viewSelect').value='pyramide';wechselAnsicht(false);initGame(false);const r=document.getElementById('mauer');r.innerHTML='<div class="stein steinInput"><input data-mg-answer="1" data-correct="3" oninput="pruefeEingabe(this,3)"></div><div class="stein steinInput"><input data-mg-answer="1" data-correct="8" oninput="pruefeEingabe(this,8)"></div>';decorateNumericInputs(r);focusFirstTaskInput(true);});
  const grid=page.locator('#mauer input'),gridBefore=await score();await grid.nth(0).fill('3');await page.waitForTimeout(270);await grid.nth(0).press('Enter');assert(await grid.nth(1).evaluate(e=>e===document.activeElement));assert.deepEqual(await score(),gridBefore);await grid.nth(1).fill('8');await page.waitForTimeout(270);await grid.nth(1).press('Enter');assert.equal((await score()).correct,gridBefore.correct+1);
  // Every numerical mode retains its generators and accepts a manually submitted answer.
  for(const mode of ['plus','minus','mal','geteilt','mix','mixMD','mixALL','double','half','squareMal','squareDiv','chain','mixedMal']){
   await page.evaluate(mode=>{document.getElementById('viewSelect').value=mode;wechselAnsicht(false);document.getElementById('settingsDetails').open=false;document.getElementById('taskCount').value='1';initGame(false);},mode);
   assert(await input().count(),mode);const answer=await input().getAttribute('data-correct');await input().fill(answer);await page.waitForTimeout(270);await input().press('Enter');assert.equal(await phase(),'done',mode);
  }
  assert.equal(await page.locator('[data-chain-check], [data-chain-next]').count(),0);assert.equal(await page.locator('.chain-expression input').count(),1);
  await page.locator('[data-chain-hint]').click();assert(await page.locator('#chainGuide').isVisible());await page.locator('#chainGuide [data-close]').click();
  const task=JSON.parse(await page.locator('[data-task]').first().getAttribute('data-task'));assert.equal(await page.locator('.chain-expression .stein:not(.steinInput)').count(),(task.expression.match(/\d+/g)||[]).length);
  assert(Number(await input().evaluate(e=>getComputedStyle(e).fontSize.replace('px','')))>=24);assert(Number(await input().evaluate(e=>getComputedStyle(e).fontWeight))>=800);
  for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);await page.evaluate(()=>{document.getElementById('viewSelect').value='chain';wechselAnsicht(false);document.getElementById('settingsDetails').open=false;document.getElementById('chainLength').value='10';initGame(false);focusFirstTaskInput(true);scrollToTasks();});await page.waitForTimeout(150);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
   if(mobile){assert.equal(await input().getAttribute('inputmode'),'none');assert(await page.locator('#mgKeypad').isVisible());}
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.getElementById('chainLength').value='4';initGame(false);scrollToTasks();});await page.screenshot({path:path.join(output,mobile?'chain-mobile.png':'chain-desktop.png'),fullPage:false});
  await page.evaluate(()=>{document.getElementById('settingsDetails').open=true;setChainOps('mal,geteilt,plus,minus');});
  await page.locator('#chainLength').selectOption('mixed');await page.locator('#chainPattern').selectOption('terms');
  const lengths=new Set(await page.evaluate(()=>Array.from({length:40},()=>{initGame(false);const task=JSON.parse(document.querySelector('#zeilenAufgaben [data-task]').dataset.task);if(!task.ops.every((op,i)=>(i%2===0?['mal','geteilt']:['plus','minus']).includes(op)))throw Error('Incorrect chain structure');return task.numbers.length;})));assert(lengths.size>1);
  await page.reload();await page.waitForTimeout(400);assert.equal(await page.locator('#chainLength').inputValue(),'mixed');assert.equal(await page.locator('#chainPattern').inputValue(),'terms');
  // Realschule: persistent data, short values, negatives/fractions and symbolic steps.
  async function begin(grade,id){await page.evaluate(()=>RealschuleUI.switchSection('realschule'));await page.locator('.rs-settings').evaluate(e=>e.open=true);await page.locator('#rsGrade').selectOption(String(grade));await page.locator('#rsAll').uncheck();await page.evaluate(()=>{document.querySelectorAll('#rsTopics input').forEach(e=>e.checked=false);document.getElementById('rsTopics').dispatchEvent(new Event('change',{bubbles:true}));});await page.locator(`[data-topic="${grade}:${id}"]`).check();await page.locator('#rsStart').click();await page.waitForTimeout(280);}
  const rsTask=()=>page.evaluate(()=>{const c=RealschuleUI.getState().session.current;let seed=c.seed;return MatheRealschule.generate(c.id,c.grade,c.difficulty,()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});});
  const rsNext=async()=>{await page.waitForTimeout(270);await page.locator('#rsAnswer').press('Enter');};
  await begin(7,'termValue');let rt=await rsTask();await page.locator('#rsAnswer').fill(String(rt.answer.n+999));await rsNext();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).wrong,0);assert.equal(await page.locator('#rsFeedback').getAttribute('data-kind'),'wrong');await page.locator('#rsHint').click();await page.locator('#rsGuideClose').click();await page.locator('#rsAnswer').fill(String(rt.answer.n/rt.answer.d));await rsNext();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).secondCorrect,1);assert.equal(await page.locator('#rsCheck').count(),0);assert.equal(await page.locator('#rsAnswer').count(),1);
  const rsState=await page.evaluate(()=>RealschuleUI.getState());await page.reload();await page.waitForTimeout(400);assert.equal((await page.evaluate(()=>RealschuleUI.getState())).session.correct,rsState.session.correct);await rsNext();assert(!(await page.evaluate(()=>RealschuleUI.getState().session.current.done)));
  await begin(6,'fractionChain');rt=await rsTask();for(const step of rt.steps){await page.locator('#rsAnswer').fill(step);await rsNext();}assert.equal(await page.locator('.rs-card').getAttribute('data-result'),'correct');
  await begin(7,'termValue');rt=await rsTask();await page.locator('#rsAnswer').fill('999999');await rsNext();await rsNext();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).wrong,1);assert.equal(await page.locator('#rsAnswer').inputValue(),'');
  await begin(7,'termValue');await page.waitForTimeout(270);await page.locator('#rsNext').click();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).skipped,1);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS:',mobile?'Android touch emulation with existing digits-only keypad':'desktop Enter',': two chances, skips, exact statistics, help, repeated events, all modes, inline boxes, responsive layouts, Realschule persistence and fraction steps');
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
