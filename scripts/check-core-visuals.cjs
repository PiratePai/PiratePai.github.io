/* Browser QA for authored diagram geometry and deterministic teaching controls. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.argv[2]||'http://127.0.0.1:8947';
const files=fs.readdirSync(path.join(__dirname,'../posts')).filter(f=>f.endsWith('.html'));
const demos=[['kv-cache-survey','kv-block-map'],['moe-survey','moe-route-combine'],['speculative-decoding','spec-rejection']];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext();const page=await context.newPage(),errors=[];
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  page.on('pageerror',e=>errors.push(e.message));let diagrams=0;
  for(const width of [1440,375,320]){
   await page.setViewportSize({width,height:1000});
   for(const file of files){
    await page.goto(base+'/posts/'+file+'?view=all');await page.evaluate(()=>document.fonts.ready);
    const result=await page.evaluate(()=>{
     const failures=[];let count=0;
     for(const svg of document.querySelectorAll('svg[data-handbook-diagram]')){
      count++;const v=svg.viewBox.baseVal,inv=svg.getScreenCTM().inverse();
      const labels=[...svg.querySelectorAll('text')].filter(t=>t.textContent.trim()).map(t=>{
       const b=t.getBBox(),matrix=inv.multiply(t.getScreenCTM());
       const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
       const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));
       const c=t.getScreenCTM();return {text:t.textContent,x,y,right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y)),px:parseFloat(getComputedStyle(t).fontSize)*Math.hypot(c.a,c.b)};
      });
      for(const x of labels){
       if(x.x<v.x-2||x.y<v.y-2||x.right>v.x+v.width+2||x.bottom>v.y+v.height+2)failures.push(svg.id+' clipped: '+x.text);
       if(x.px<11.8)failures.push(svg.id+' small: '+x.text+' '+x.px);
      }
      for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
       const a=labels[i],b=labels[j];
       if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>3&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>3)failures.push(svg.id+' overlap: '+a.text+' / '+b.text);
      }
     }
     return {failures,count,overflow:document.documentElement.scrollWidth>innerWidth+2};
    });
    assert.deepEqual(result.failures,[],width+' '+file);assert(!result.overflow,width+' '+file+' page overflow');
    if(width===1440)diagrams+=result.count;
   }
   console.log('PASS '+width+'px: all article SVG labels, bounds and page widths');
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const [file,id] of demos){
   await page.goto(base+'/posts/'+file+'.html?view=all#'+id);const d=page.locator('#'+id);
   await d.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
   const frames=()=>d.evaluate(n=>+n.dataset.motionFrames);
   const a=await frames();await page.waitForTimeout(400);assert.equal(await frames(),a,'default idle');
   for(let phase=1;phase<=3;phase++){
    await d.locator('.motion-step').click();assert.equal(await d.getAttribute('data-core-phase'),String(phase));
   }
   if(id==='kv-block-map'){
    assert.equal(await d.locator('[data-block="1"]').innerText(),'P1\n引用 1 · A');
    assert.equal(await d.locator('[data-block="7"] [data-filled="true"]').count(),1);
   }
   if(id==='moe-route-combine')assert.match(await d.locator('.core-equation').innerText(),/= 3$/);
   if(id==='spec-rejection'){
    assert.match(await d.locator('.core-equation').innerText(),/输出 B/);
    await d.locator('select').selectOption('accept');for(let i=0;i<3;i++)await d.locator('.motion-step').click();
    assert.match(await d.locator('.core-equation').innerText(),/保留 A/);
   }
   await d.locator('[data-core-reset]').click();await d.locator('.ppx-play').click();
   await page.waitForTimeout(200);const before=await frames();await page.waitForTimeout(1000);
   const delta=await frames()-before;assert(delta>=2&&delta<=5,'low redraw rate '+delta);
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(200);
   const off=await frames();await page.waitForTimeout(500);assert.equal(await frames(),off,'actual offscreen pause');
   await d.scrollIntoViewIfNeeded();await d.locator('.ppx-play').click();await page.waitForTimeout(200);
   const stopped=await frames();await page.waitForTimeout(350);assert.equal(await frames(),stopped,'manual pause');
   await d.locator('[data-core-reset]').click();await page.emulateMedia({reducedMotion:'reduce'});
   await d.locator('.ppx-play').click();await page.waitForTimeout(100);
   const reduce=await frames();await page.waitForTimeout(400);assert.equal(await frames(),reduce);
   await d.locator('.motion-step').click();assert.equal(await d.getAttribute('data-core-phase'),'1');
   await page.emulateMedia({reducedMotion:'no-preference'});
   console.log('PASS '+id+': semantic steps, 4 fps cap, scroll pause, reduced motion');
  }
  await page.goto(base+'/posts/parallelism-survey.html#zero-memory-figure');
  await page.locator('#zero-degree').selectOption('64');
  assert.deepEqual(await page.locator('#zero-memory-figure .zero-total').allTextContents(),['16 GB / 卡','4.188 GB / 卡','2.219 GB / 卡','0.25 GB / 卡']);
  // Render both palettes, all four steps, and touch widths without relying on screenshots alone.
  for(const width of [320,375,768,1440]){
   await page.setViewportSize({width,height:1000});
   for(const [file,id] of demos){
    await page.goto(base+'/posts/'+file+'.html#'+id);const d=page.locator('#'+id);
    for(const theme of ['paper','dark']){
     await page.evaluate(t=>document.documentElement.dataset.readerTheme=t,theme);
     await d.locator('[data-core-reset]').click();
     for(let phase=0;phase<4;phase++){
      if(phase)await d.locator('.motion-step').click();
      const invalid=await d.evaluate(n=>[...n.querySelectorAll('button,select,.core-stage-copy,.kv-block,.moe-expert,.spec-table')].some(e=>e.scrollWidth>e.clientWidth+2));
      assert(!invalid,id+' content overflow '+width+' '+phase);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
     }
    }
   }
  }
  assert.deepEqual(errors,[]);
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}}),fallback=await nojs.newPage();
  for(const [file,id] of [...demos,['parallelism-survey','zero-memory-figure']]){
   await fallback.goto(base+'/posts/'+file+'.html');assert(await fallback.locator('#'+id+' .core-stage').innerText());
  }
  await nojs.close();await context.close();console.log('PASS '+diagrams+' SVGs, four core diagrams, palettes and no-JS content');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
