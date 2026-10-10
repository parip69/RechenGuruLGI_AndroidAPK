const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=path.resolve(__dirname,'../app/src/main/assets'),version=fs.readFileSync(path.resolve(__dirname,'../version.properties'),'utf8').match(/VERSION_NAME=(\d+)/)[1];
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname!=='parip69.github.io')return r.abort();const name=url.pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);if(fs.existsSync(file)&&fs.statSync(file).isFile())return r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.js')?'application/javascript':undefined});return r.abort();});
 await page.addInitScript(v=>{window.AndroidInterface={getAppVersionName:()=>v,openExternal:()=>true};},version);
 await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/?v='+version);await page.locator('#realschuleTab').click();
 const regenerate=()=>page.evaluate(()=>{const c=RealschuleUI.getState().session.current;let seed=c.seed;return MatheRealschule.generate(c.id,c.grade,c.difficulty,()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});});
 async function begin(grade,id){await page.evaluate(()=>document.querySelector('.rs-settings').open=true);await page.locator('#rsGrade').selectOption(String(grade));if(await page.locator('#rsAll').isChecked())await page.locator('#rsAll').uncheck();for(const c of await page.locator('[data-topic]').all())await c.uncheck();await page.locator(`[data-topic="${grade}:${id}"]`).check();await page.locator('#rsStart').click();}
 for(const id of ['fractionAdd','fractionSubtract','fractionDivide','mixedFractions']){
   await begin(6,id);const task=await regenerate();assert(await page.locator('.rs-fraction').count()>0);
   await page.locator('#rsAnswer').fill(task.steps[1]);await page.locator('#rsCheck').click();assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.count),0);
   await page.locator('#rsAnswer').fill(task.steps[0]);await page.locator('#rsCheck').click();assert.equal(await page.locator('.rs-history li').count(),1);
   await page.reload();assert.equal(await page.locator('.rs-history li').count(),1);assert.equal((await regenerate()).prompt,task.prompt);
   await page.locator('#rsAnswer').fill(task.steps[1]);await page.locator('#rsCheck').click();assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.correct),1);
   assert(await page.locator('#rsAnswer').isDisabled());
 }
 await begin(9,'systems');const task=await regenerate();assert.equal(await page.locator('.rs-system > span').count(),2);
 const final=`x = ${task.steps[1].split('=')[1].trim()}; y = ${task.steps[2].split('=')[1].trim()}`;
 await page.locator('#rsAnswer').fill(final);await page.locator('#rsCheck').click();assert((await page.locator('#rsFeedback').innerText()).includes('zuerst'));assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.count),0);
 await page.locator('#rsAnswer').fill('2x=9999');await page.locator('#rsCheck').click();assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.wrong),1);
 await page.locator('#rsAnswer').fill(task.steps[0]);await page.locator('#rsCheck').click();await page.locator('#rsAnswer').fill(task.steps[1]);await page.locator('#rsCheck').click();assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.correct),0);
 await page.locator('#rsAnswer').fill(task.steps[2]);const input=await page.locator('#rsAnswer').inputValue();await page.locator('#grundschuleTab').click();await page.locator('#realschuleTab').click();assert.equal(await page.locator('#rsAnswer').inputValue(),input);
 await page.reload();assert.equal(await page.locator('#rsAnswer').inputValue(),input);assert.equal(await page.locator('.rs-history li').count(),2);
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/workspace/.cloud-tools/artifacts/system'+version+'.png',fullPage:true});await page.locator('#rsCheck').click();assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.correct),1);
 await page.locator('#rsNext').click();await page.locator('#rsHint').click();assert((await page.locator('#rsFeedback').innerText()).length>20);await page.locator('#rsSolution').click();assert((await page.locator('#rsFeedback').innerText()).includes('y ='));assert.equal(await page.evaluate(()=>RealschuleUI.getState().session.assisted),1);
 // Version 200 sessions regenerate identically after upgrading, without changing history or progress.
 const oldTask=JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/realschule-v200.json'),'utf8'));
 await page.evaluate(({prompt})=>{const data=RealschuleUI.getState();data.progress['6:fractions']={label:'Brüche · Rechenweg',grade:6,correct:7,wrong:2,attempts:12,assisted:1,skipped:0};data.session={pool:[{id:'fractions',grade:6,label:'Brüche · Rechenweg'}],difficulty:'medium',limit:10,queue:[],review:false,count:0,correct:0,attempts:1,wrong:0,assisted:0,skipped:0,byTopic:{},finished:false,current:{id:'fractions',grade:6,label:'Brüche · Rechenweg',difficulty:'medium',seed:1234567,history:[''+prompt],input:'1/',hints:0,assisted:false,done:false,hadError:false}};localStorage.setItem('MatheKids_Realschule_v1',JSON.stringify(data));}, {prompt:oldTask.firstStep});
 await page.reload();assert.equal(await page.locator('.rs-prompt').innerHTML(),oldTask.prompt);assert.equal(await page.locator('.rs-history li').innerText(),oldTask.firstStep);assert.equal(await page.locator('#rsAnswer').inputValue(),'1/');assert.equal(await page.evaluate(()=>RealschuleUI.getState().progress['6:fractions'].correct),7);
 assert.deepEqual(errors,[]);console.log('PASS: new fraction operations, systems, final-answer evidence, both variables, reload and tab preservation, mobile widths, solution/hints and version 200 compatibility');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
