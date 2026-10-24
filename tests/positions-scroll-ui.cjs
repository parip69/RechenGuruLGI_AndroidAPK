const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=process.env.MATHE_ASSETS||path.resolve(__dirname,'../app/src/main/assets');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  // No Android bridge: exercise the actual mobile-web pull-to-refresh handler.
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.route('**/*',r=>{const name=new URL(r.request().url()).pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html',file=path.join(assets,name);return fs.existsSync(file)&&fs.statSync(file).isFile()?r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined}):r.abort();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(500);
  const cdp=await context.newCDPSession(page);
  async function swipe(down){
   // Start on the scroll surface's padding, as on the user's screenshot.
   const {x,y}=await page.locator('.position-dialog-body').evaluate((e,down)=>{const r=e.getBoundingClientRect();return {x:r.left+3,y:down?r.top+70:r.bottom-70};},down);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(down?1:-1)*i*15}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(220);
  }
  for(const m of ['plus','minus','mix','mal','geteilt','mixMD','chain','mixALL','squareMal','squareDiv','pyramide','traube','double','half','fehler']){
   await page.evaluate(m=>{document.getElementById('viewSelect').value=m;wechselAnsicht(false);window.scrollTo(0,0);MathePositions.openSettings();},m);
   // Expand real existing settings to make every mode scrollable, including landscape.
   await page.locator('#positionLegacyOptions').evaluate(e=>e.open=true);
   await page.waitForTimeout(80);
   const body=page.locator('.position-dialog-body');
   assert(await body.evaluate(e=>e.scrollHeight>e.clientHeight+100),'scrollable settings '+m);
   await body.evaluate(e=>e.scrollTop=Math.min(250,(e.scrollHeight-e.clientHeight)/2));
   let before=await body.evaluate(e=>e.scrollTop);
   await swipe(true);
   let after=await body.evaluate(e=>e.scrollTop);
   assert(after<before-20,'downward finger swipe must scroll towards top: '+m+' '+before+' -> '+after);
   assert(!(await page.locator('#pullRefreshIndicator').evaluate(e=>e.classList.contains('visible'))),'no page refresh inside settings');
   before=after;await swipe(false);after=await body.evaluate(e=>e.scrollTop);
   assert(after>before+20,'upward finger swipe must scroll towards bottom: '+m);
   await body.evaluate(e=>e.scrollTop=0);await swipe(true);await swipe(false);
   assert(await body.evaluate(e=>e.scrollTop>20),'can reverse direction at top: '+m);
   await page.locator('#tileSettingsDialog [data-close]').click();
  }
  // Page refresh remains available outside overlays. Inspect touchmove cancellation
  // without releasing the gesture, so this test does not reload its document.
  const pull=await page.evaluate(()=>{
   document.activeElement?.blur();window.scrollTo(0,0);
   const target=document.getElementById('grundschulePanel');
   const send=(type,y)=>{const touch=new Touch({identifier:1,target,clientX:10,clientY:y});const e=new TouchEvent(type,{bubbles:true,cancelable:true,touches:[touch]});target.dispatchEvent(e);return e.defaultPrevented;};
   send('touchstart',50);const captured=send('touchmove',140);target.dispatchEvent(new TouchEvent('touchcancel',{bubbles:true}));return captured;
  });assert(pull,'normal page pull-to-refresh retained');
  assert.deepEqual(errors,[]);console.log('PASS: real touch swipes up/down/top reversal in all 15 modes; no dialog refresh capture; page pull-to-refresh retained');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
