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
  await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(400);
  await page.evaluate(()=>{
    const sum=MatheBuilder.fromLegacy('mix',{maxWert:'100'});sum.numbers.forEach(n=>n.query=true);
    appStorage.setItem('mathModeSettings:mix',JSON.stringify({maxWert:'100',taskFormat:'positions',positionConfig:JSON.stringify(sum)}));
    const product=MatheBuilder.fromLegacy('mal',{maxWert:'100',rowTrain:'7',mulProfile:'table'});product.numbers[1].query=true;product.numbers[1].min=1;product.numbers[1].max=10;
    appStorage.setItem('mathModeSettings:mal',JSON.stringify({maxWert:'100',rowTrain:'7',mulProfile:'table',taskFormat:'positions',positionConfig:JSON.stringify(product)}));
    const chain=MatheBuilder.fromLegacy('chain',{maxWert:'100',chainLength:'7',chainOps:'plus,minus,mal,geteilt'});chain.numbers.forEach((n,i)=>{n.min=i?1:0;n.max=i?9:20;});chain.numbers[1].query=true;
    appStorage.setItem('mathModeSettings:chain',JSON.stringify({maxWert:'100',chainLength:'7',taskFormat:'positions',positionConfig:JSON.stringify(chain)}));
    document.getElementById('viewSelect').value='mix';wechselAnsicht(false);
  });
  await page.evaluate(()=>openViewSelectPopup());
  await page.evaluate(()=>{focusFirstTaskInput(true);mgSetActiveInput(document.querySelector('#zeilenAufgaben input'));});
  await page.waitForTimeout(300);
  assert(!(await page.locator('#mgKeypad').evaluate(e=>e.classList.contains('show'))),'delayed focus must not reopen keypad over the selector');
  assert.equal(await page.locator('.position-tile').count(),9);
  for(const width of [320,360,390,412,768]){
    await page.setViewportSize({width,height:900});
    const results=await page.locator('.position-tile').evaluateAll(rows=>rows.map(row=>{
      const box=row.getBoundingClientRect(),pick=row.querySelector('.position-tile-pick'),gear=row.querySelector('.position-tile-gear'),title=pick.querySelector('strong');
      const r=gear.getBoundingClientRect(),p=pick.getBoundingClientRect(),t=title.getBoundingClientRect(),style=getComputedStyle(title);
      return {x:box.x,right:box.right,y:box.y,bottom:box.bottom,width:box.width,gearX:r.x,gearRight:r.right,gearWidth:r.width,gearHeight:r.height,gearCenter:r.y+r.height/2,rowCenter:box.y+box.height/2,pickRight:p.right,title:title.textContent,titleScroll:title.scrollWidth,titleWidth:title.clientWidth,titleHeight:t.height,lineHeight:parseFloat(style.lineHeight),lines:pick.children.length,selected:row.classList.contains('selected'),pressed:pick.getAttribute('aria-pressed'),border:getComputedStyle(row).borderLeftWidth};
    }));
    for(let i=0;i<results.length;i++){
      const r=results[i];assert(r.width>width*.7,'full width bar '+width);assert(r.gearX>=r.pickRight-1,'gear beside text');assert(r.gearRight<=r.right-4&&r.right-r.gearRight<20,'gear at right edge');assert(r.gearWidth>=48&&r.gearHeight>=48,'touch target');assert(Math.abs(r.gearCenter-r.rowCenter)<2,'gear vertically centered');assert(r.titleScroll<=r.titleWidth+1,'title fits '+r.title+' at '+width);assert(r.titleHeight<=r.lineHeight+1,'one line title');assert.equal(r.lines,3);if(i)assert(results[i-1].bottom<=r.y+1,'single vertical column');
    }
    const active=results.filter(r=>r.selected);assert.equal(active.length,1);assert.equal(active[0].pressed,'true');assert(parseFloat(active[0].border)>=3);
    assert(await page.locator('.selectPopupCard').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  }
  await page.setViewportSize({width:390,height:900});await page.screenshot({path:'/tmp/mathekids-selection-bars.png',fullPage:true});
  assert((await page.locator('[data-family=chain] .position-tile-detail').innerText()).includes('7 Zahlen'));
  assert((await page.locator('[data-family=chain] .position-tile-limits').innerText()).includes('2. Zahl / Ergebnis'));
  assert((await page.locator('[data-family=product] .position-tile-detail').innerText()).includes('7er-Reihe'));
  await page.locator('[data-family=chain] .position-tile-pick').click();assert.equal(await page.locator('#viewSelect').inputValue(),'chain');
  await page.evaluate(()=>openViewSelectPopup());assert(await page.locator('[data-family=chain]').evaluate(e=>e.classList.contains('selected')));
  await page.locator('[data-family=chain] .position-tile-gear').click();assert(await page.locator('#tileSettingsDialog').isVisible());
  assert.deepEqual(errors,[]); console.log('PASS: full-width three-line bars, unbroken titles, right-aligned 48px gears, strong active row, real profile summaries, selection and gear navigation at 320/360/390/412/768px');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
