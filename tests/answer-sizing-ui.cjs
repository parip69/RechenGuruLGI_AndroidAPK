const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const assets=path.resolve(__dirname,'../app/src/main/assets');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
try{for(const width of [320,390,1280]){
 const context=await browser.newContext({viewport:{width,height:844},...(width<500?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}:{})});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{const name=new URL(r.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);return fs.existsSync(file)&&fs.statSync(file).isFile()?r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined}):r.abort();});
 await page.addInitScript(()=>window.AndroidInterface={getAppVersionName:()=> '99999',openExternal:()=>true,shareLink:()=>true});
 await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(400);
 await page.evaluate(()=>{setAutoNextCorrect(false);RealschuleUI.switchSection('grundschule');document.getElementById('settingsDetails').open=false;});
 const input=()=>page.locator('#zeilenAufgaben input').first();
 async function inject(range,correct=8){await page.evaluate(({range,correct})=>{document.getElementById('viewSelect').value='plus';document.getElementById('maxWert').value=range;initGame(false);const root=document.getElementById('zeilenAufgaben');root.replaceChildren();renderTask(root,{op:'plus',fmt:'standard',a:3,b:correct-3,res:correct,sym:'+',missing:2,key:'size-test'},range);}, {range,correct});}
 async function layout(control,label){const result=await control.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),box=e.closest('.steinInput').getBoundingClientRect(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const content=e.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);return {digits:Number(e.closest('.steinInput').style.getPropertyValue('--answer-digits')),text:ctx.measureText(e.value).width,content,scroll:e.scrollWidth,client:e.clientWidth,left:box.left,right:box.right,inputLeft:r.left,inputRight:r.right,viewport:innerWidth,font:parseFloat(s.fontSize)};});assert(result.content>=result.text+1,label+': digits and caret fit '+JSON.stringify(result));assert(result.scroll<=result.client+1,label+': no hidden text '+JSON.stringify(result));assert(result.left>=0&&result.right<=result.viewport,label+': box inside viewport');assert(result.inputLeft>=result.left&&result.inputRight<=result.right,label+': input inside border');return result;}
 for(const [range,digits] of [[10,2],[100,3],[1000,4]]){
  await inject(range);assert.equal((await layout(input(),'empty '+range)).digits,digits,'width follows range, even for short solutions');
  await input().fill(String(range));assert.equal(await input().inputValue(),String(range));await layout(input(),'range boundary '+range);
  const longer='1'.repeat(Math.max(4,digits+1));await input().fill(longer);assert.equal(await input().inputValue(),longer);assert.equal((await layout(input(),'extra wrong digit')).digits,longer.length);
  await input().fill('');assert.equal((await layout(input(),'erased')).digits,digits);
  await input().fill('8');assert.equal(await input().evaluate(e=>e.parentElement.dataset.state),'correct');await layout(input(),'green border');
 }
 // Correct 1000, including the green border, keeps every digit readable.
 await inject(1000,1000);await input().fill('1000');const correct=await layout(input(),'correct 1000');assert(correct.font>=24,'retain large task type');
 if(width<500){await input().fill('');await input().click();for(const digit of '1000')await page.locator(`#mgKeypad [data-mgk="${digit}"]`).click();assert.equal(await input().inputValue(),'1000');await layout(input(),'Android keypad');}
 if(width===390){await page.locator('#zeilenAufgaben').screenshot({path:'/tmp/mathekids-answer-sizing-1000.png'});}
 // Inline answers in chains and mixed multiplication keep the same readable width.
 for(const mode of ['chain','mixedMal']){await page.evaluate(mode=>{document.getElementById('viewSelect').value=mode;wechselAnsicht(false);document.getElementById('maxWert').value='1000';initGame(false);},mode);await input().fill('11111');await layout(input(),mode);}
 // The same sizing also reaches pyramid/grape inputs.
 for(const mode of ['pyramide','traube']){await page.evaluate(mode=>{document.getElementById('viewSelect').value=mode;wechselAnsicht(false);document.getElementById('maxWert').value='1000';initGame(false);},mode);const fields=page.locator(`#${mode==='pyramide'?'mauer':'traube'} input`);assert(await fields.count());for(let i=0;i<await fields.count();i++){await fields.nth(i).fill('1000');assert((await layout(fields.nth(i),mode)).digits>=4);}}
 assert.deepEqual(errors,[]);await context.close();console.log('PASS',width,'px: 2/3/4 digits by range, input grows and shrinks, green border/caret, keypad, pyramid/grape, no clipping');
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
