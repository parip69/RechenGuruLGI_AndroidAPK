const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const assets=path.resolve(__dirname,'../app/src/main/assets');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  for(const modern of [true,false]){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',r=>{
    const url=new URL(r.request().url()),name=url.pathname.replace('/RechenGuruLGI_AndroidAPK/','')||'index.html';
    if(url.searchParams.has('update-check')&&!name.endsWith('.apk'))return r.fulfill({body:'<footer data-app-version="999"></footer>',contentType:'text/html'});
    const file=path.join(assets,name);return fs.existsSync(file)&&fs.statSync(file).isFile()?r.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':undefined}):r.abort();
   });
   await page.addInitScript(modern=>{
    window.calls=[];window.AndroidInterface={getAppVersionName:()=> '230',openExternal:url=>{calls.push(['external',url]);return true;}};
    if(modern)AndroidInterface.downloadAndInstallUpdate=v=>{calls.push(['native',v]);return true;};
   },modern);
   await page.goto('https://parip69.github.io/RechenGuruLGI_AndroidAPK/');await page.waitForTimeout(500);
   await page.locator('#appUpdateBtn').click();await page.locator('#appUpdateDialogInstall').waitFor({state:'visible'});
   assert((await page.locator('#appUpdateDialogText').innerText()).includes('999'));
   await page.locator('#appUpdateDialogInstall').click();
   const calls=await page.evaluate(()=>window.calls);
   if(modern){
    assert.deepEqual(calls,[['native','999']]);
    await page.evaluate(()=>__matheNativeUpdate({title:'Update wird heruntergeladen (50 %)',text:'Download läuft',kind:'new'}));
    assert((await page.locator('#appUpdateDialogTitle').innerText()).includes('50 %'));
    await page.evaluate(()=>__matheNativeUpdate({title:'Update nicht abgeschlossen',text:'Verbindung unterbrochen',kind:'error'}));
    assert(await page.locator('#appUpdateDialogInstall').isVisible());
    await page.locator('#appUpdateDialogInstall').click();assert.equal(await page.evaluate(()=>calls.length),2);
    await page.evaluate(()=>__matheNativeUpdate({title:'Android-Installation geöffnet',text:'Bitte Installation bestätigen.',kind:'new'}));
    assert((await page.locator('#appUpdateDialogText').innerText()).includes('bestätigen'));
    assert.equal((await page.evaluate(()=>calls)).filter(c=>c[0]==='external').length,0);
   }else assert.equal(calls[0][0],'external');
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: native update bridge instead of browser, progress, errors/retry and installer confirmation; older APK browser fallback retained');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
