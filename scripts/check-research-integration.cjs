/* Targeted browser acceptance for the three integrated research articles and diagrams.
 * NODE_PATH must resolve Playwright; uses installed Microsoft Edge.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.argv[2]||'http://127.0.0.1:8964';
const articles=['cost-efficient-inference-2026','inference-research-roadmap','self-forcing-inference-research'];
const diagrams=fs.readdirSync(path.join(__dirname,'../posts/img')).filter(f=>/^sc-(sf-|roadmap-|cost-pipeline|responsiveness)/.test(f));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const width of [1440,375,320]) {
   const context=await browser.newContext({viewport:{width,height:950}});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
   for(const article of articles) {
    await page.goto(`${base}/posts/${article}.html`);
    await page.waitForSelector('html.reader-ready');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),article);
    // Cold deep links must keep their original semantic destination.
    if(article===articles[0]) for(const [id,text] of [['s8','落地'],['s9','局限'],['video-response','视频案例']]) {
     await page.goto(`${base}/posts/${article}.html#${id}`);
     assert((await page.locator('#'+id).textContent()).includes(text));
     assert(await page.locator('#'+id).isVisible());
    }
   }
   await page.goto(base+'/posts/self-forcing-inference-research.html#sf-block-wait-example');
   const demo=page.locator('#sf-block-wait-demo');
   for(const [value,total] of [['4','237.5'],['1','50'],['8','487.5']]) {
    await demo.locator('select').selectOption(value);
    assert((await demo.locator('output').textContent()).endsWith('总计 '+total+' ms。'));
   }
   for(const [slug,chapter,target] of [
    ['kv-cache-survey','s4','kv-page-steps'],
    ['inference-serving','s5','fig-pd-interactive']
   ]) {
    await page.goto(base+'/posts/'+slug+'.html#'+chapter);
    await page.locator('html.reader-ready').waitFor();
    const jump=page.locator('.reader-chapter-jump');
    await jump.locator('summary').click();
    await jump.getByRole('button',{name:'连续读本章'}).click();
    await page.waitForFunction(()=>new URL(location.href).searchParams.get('view')==='chapter');
    assert.equal(await page.locator('.reader-chapter:not([hidden])').count(),1);
    assert(await page.locator('.reader-page:not([hidden])').count()>1);
    await jump.locator('summary').click();
    await jump.locator('a[href="#'+target+'"]').click();
    await page.waitForFunction(id=>location.hash==='#'+id,target);
    await page.waitForFunction(id=>{
     const rect=document.getElementById(id).getBoundingClientRect();
     const toolbar=document.querySelector('.reader-toolbar').getBoundingClientRect();
     return rect.top>=toolbar.bottom && rect.top<innerHeight;
    },target);
    assert.equal(await jump.getAttribute('open'),null);
    await jump.locator('summary').click();
    await jump.getByRole('button',{name:'恢复分页'}).click();
    assert.equal(await page.locator('.reader-page:not([hidden])').count(),1);
   }
   for(const file of diagrams) {
    await page.goto(`${base}/posts/img/${file}`);
    const svg=page.locator('svg.sc-svg').first();
    assert(await svg.evaluate(el=>el.classList.contains('sc-still')),`${file}: default motion`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file);
    for(const theme of ['light','dark']) {
     await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
     const stage=page.locator('.sc-stage').first();
     if(width<=375) assert(await stage.evaluate(el=>el.scrollWidth>el.clientWidth),`${file}: readable local scroll`);
    }
    const next=page.locator('[data-sc-action="next"]');
    const steps=Number(await svg.getAttribute('data-sc-steps'));
    if(steps && await next.isVisible()) {
     for(let i=0;i<=steps;i++) await next.click();
     assert.equal(await svg.locator('[data-sc-step]:not(.is-shown)').count(),0,file);
    }
    const live=page.locator('[data-sc-action="live"]');
    if(await live.isVisible()) {
     await live.click();
     await page.evaluate(()=>{document.querySelector('.sc-stage').style.marginTop='10000px';});
     await page.waitForFunction(()=>document.querySelector('svg.sc-svg').classList.contains('sc-still'));
     await page.evaluate(()=>document.querySelector('.sc-stage').style.marginTop='');
     await page.emulateMedia({reducedMotion:'reduce'});
     await page.reload();
     assert(await svg.evaluate(el=>el.classList.contains('sc-still')),file);
     await page.emulateMedia({reducedMotion:'no-preference'});
    }
   }
   assert.deepEqual(errors,[]);
   console.log(`PASS ${width}px: articles, historical anchors, ${diagrams.length} diagrams, steps, local scroll, motion lifecycle`);
   await context.close();
  }
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:950}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  const page=await context.newPage();
  for(const article of articles) {
   await page.goto(`${base}/posts/${article}.html`);
   assert(await page.locator('#refs').isVisible());
   assert(await page.locator('h2').count()>=7);
  }
  await page.goto(base+'/posts/self-forcing-inference-research.html#sf-block-wait-example');
  assert.equal(await page.locator('#sf-block-wait-demo').isVisible(),false);
  assert((await page.locator('#sf-block-wait-example ~ table').first().textContent()).includes('487.5 ms'));
  for(const file of diagrams) {
   await page.goto(`${base}/posts/img/${file}`);
   assert(await page.locator('svg.sc-svg').isVisible());
  }
  console.log('PASS no-JavaScript article bodies, references and diagram fallbacks');
  await context.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
