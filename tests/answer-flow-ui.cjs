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
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(400);
  const score=()=>page.evaluate(()=>({correct:scoreCorrect,wrong:scoreWrong,totalCorrect,totalWrong,details:JSON.parse(appStorage.getItem('mathAnswerStats_v1')||'{}')}));
  const inject=async(task=simple)=>{await page.evaluate(task=>{RealschuleUI.switchSection('grundschule');document.getElementById('viewSelect').value='plus';document.getElementById('settingsDetails').open=false;initGame(false);const root=document.getElementById('zeilenAufgaben');root.replaceChildren();renderTask(root,task,100);focusFirstTaskInput(true);},task);await page.waitForTimeout(280);};
  const input=()=>page.locator('#zeilenAufgaben input').first();
  const next=async()=>{await page.waitForTimeout(270);if(mobile){await input().click();await page.locator('#mgKeypad [data-mgk="nx"]').click();}else await input().press('Enter');};
  const phase=()=>page.locator('#zeilenAufgaben .zeilenAufgabe').first().getAttribute('data-answer-phase');
  for(const mode of ['plus','minus','mal','geteilt','mix','mixMD','mixALL','double','half','squareMal','squareDiv','chain','mixedMal']){
   await page.evaluate(mode=>{document.getElementById('viewSelect').value=mode;wechselAnsicht(false);document.getElementById('settingsDetails').open=false;document.getElementById('taskCount').value='1';initGame(false);},mode);
   const before=await score();assert(await input().count(),mode);const answer=await input().getAttribute('data-correct');await input().fill(answer);await page.waitForTimeout(270);await input().press('Enter');assert.equal((await score()).correct,before.correct+1,mode);assert.equal((await score()).wrong,before.wrong,mode);assert.equal(await input().inputValue(),'');assert(await input().evaluate(e=>e===document.activeElement));assert.equal(await page.locator('[data-answer-next]').count(),0);
  }
  // Empty new-task skips once; a wrong answer scores once and moves immediately.
  await inject();let before=await score();await page.locator('#refreshBtn').click();assert.equal((await score()).wrong,before.wrong+1);
  await inject();before=await score();await input().fill('7');await next();assert.equal((await score()).wrong,before.wrong+1);assert.equal(await input().inputValue(),'');
  // Both inline answer selections remain usable without an extra button.
  for(const task of [{...simple,fmt:'operator',correctOp:'+'},{...simple,fmt:'compare',leftTxt:'3 + 5',rightTxt:'8',correct:'='}]){
   await inject(task);const before=await score();await page.locator('#zeilenAufgaben select').selectOption(task.correctOp||task.correct);await page.waitForTimeout(270);await page.locator('#refreshBtn').click();assert.equal((await score()).correct,before.correct+1);
  }
  // Realschule: persistent data, short values, negatives/fractions and symbolic steps.
  async function begin(grade,id){await page.evaluate(()=>RealschuleUI.switchSection('realschule'));await page.locator('.rs-settings').evaluate(e=>e.open=true);await page.locator('#rsGrade').selectOption(String(grade));await page.locator('#rsAll').uncheck();await page.evaluate(()=>{document.querySelectorAll('#rsTopics input').forEach(e=>e.checked=false);document.getElementById('rsTopics').dispatchEvent(new Event('change',{bubbles:true}));});await page.locator(`[data-topic="${grade}:${id}"]`).check();await page.locator('#rsStart').click();await page.waitForTimeout(280);}
  const rsTask=()=>page.evaluate(()=>{const c=RealschuleUI.getState().session.current;let seed=c.seed;return MatheRealschule.generate(c.id,c.grade,c.difficulty,()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});});
  const rsNext=async()=>{await page.waitForTimeout(270);await page.locator('#rsAnswer').press('Enter');};
  await begin(7,'termValue');let rt=await rsTask();await page.locator('#rsAnswer').fill(String(rt.answer.n+999));await rsNext();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).wrong,0);assert.equal(await page.locator('#rsFeedback').getAttribute('data-kind'),'wrong');await page.locator('#rsHint').click();await page.locator('#rsGuideClose').click();await page.locator('#rsAnswer').fill(String(rt.answer.n/rt.answer.d));await rsNext();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).secondCorrect,1);assert.equal(await page.locator('#rsCheck').count(),0);assert.equal(await page.locator('#rsAnswer').count(),1);
  const rsState=await page.evaluate(()=>RealschuleUI.getState());await page.reload();await page.waitForTimeout(400);assert.equal((await page.evaluate(()=>RealschuleUI.getState())).session.correct,rsState.session.correct);await rsNext();assert(!(await page.evaluate(()=>RealschuleUI.getState().session.current.done)));
  await begin(6,'fractionChain');rt=await rsTask();for(const step of rt.steps){await page.locator('#rsAnswer').fill(step);await rsNext();}assert.equal(await page.locator('.rs-card').getAttribute('data-result'),'correct');
  await begin(7,'termValue');rt=await rsTask();await page.locator('#rsAnswer').fill('999999');await rsNext();await rsNext();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).wrong,1);assert.equal(await page.locator('#rsAnswer').inputValue(),'');
  await begin(7,'termValue');await page.waitForTimeout(270);await page.locator('#rsNext').click();assert.equal((await page.evaluate(()=>RealschuleUI.getState().session)).skipped,1);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS:',mobile?'Android touch emulation with existing digits-only keypad':'desktop Enter',': one-action Grundschule advance, all numerical modes, selections, scoring/focus, Realschule persistence and fraction steps');
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
