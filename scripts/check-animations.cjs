/* Browser behavior checks: no idle/background draw loops, controls, reduced motion.
 * Requires Playwright + installed Edge. Run against the static preview server.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=process.argv[2]||'http://127.0.0.1:8946';
const root=path.resolve(__dirname,'..');
const demos=[['attention-evolution','PPX-W2'],['kv-cache-survey','PPX-W3'],['quantization-survey','PPX-W4'],['speculative-decoding','PPX-W1'],['inference-serving','PPX-W5'],['moe-survey','PPX-W6'],['parallelism-survey','PPX-W7'],['vit-sparsification','PPX-W8'],['llm-perf-simulation-2026','q-demo'],['parallelism-survey','overlap-demo']];
// Check the actual causal-softmax function used in the visual, including early rows.
const source=fs.readFileSync(path.join(root,'posts/attention-evolution.html'),'utf8');
const softmax=source.match(/function softmaxRow\(i\)\{[\s\S]*?return w;\s*\}/)[0];
const state={N:8,temp:.2,S:Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>j<=i?1+i+j:99))};
vm.runInNewContext(softmax+';this.softmaxRow=softmaxRow;',state);
for(let i=0;i<8;i++){
 const w=state.softmaxRow(i);assert(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-12);
 assert(w.slice(i+1).every(x=>x===0),'future positions must have exactly zero probability');
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:950}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  // Reproduce a batched stale-hidden + current-visible observation after DOM moves.
  await context.addInitScript(()=>{
   const NativeObserver=window.IntersectionObserver;
   window.IntersectionObserver=class extends NativeObserver{
    constructor(callback,options){super((entries,observer)=>{
     const latest=entries[entries.length-1];
     callback(latest&&latest.isIntersecting?[{target:latest.target,isIntersecting:false},...entries]:entries,observer);
    },options);}
   };
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [file,id] of demos){
   await page.goto(base+'/posts/'+file+'.html#'+id);
   const demo=page.locator('#'+id);await demo.scrollIntoViewIfNeeded();
   const count=()=>demo.evaluate(n=>+(n.dataset.motionFrames||0));
   await page.waitForTimeout(180);const initial=await count();
   await page.waitForTimeout(350);assert.equal(await count(),initial,id+' must be idle by default');
   if(id==='PPX-W4'){
    await demo.locator('input[type=range]').first().fill('3');
    await page.waitForTimeout(100);assert(await count()>initial,'static input redraw');
   }else{
    const beforeLayer=id==='PPX-W8'?+(await demo.locator('.ppx-layer').inputValue()):null;
    await demo.locator('.motion-step').click();
    await page.waitForFunction(([key,before])=>+document.getElementById(key).dataset.motionFrames>before,[id,initial],{timeout:2000});
    if(beforeLayer!==null) assert.equal(+(await demo.locator('.ppx-layer').inputValue()),(beforeLayer+1)%25,'single step advances a ViT layer');
    await demo.locator('.ppx-play,.motion-play').click();await page.waitForTimeout(150);
    const a=await count();await page.waitForTimeout(650);const delta=await count()-a;
    assert(delta>=3&&delta<=15,id+' bounded active frame rate: '+delta);
    if(beforeLayer!==null) assert.notEqual(+(await demo.locator('.ppx-layer').inputValue()),(beforeLayer+1)%25,'ViT playback accumulates fractional time');
    await demo.locator('.ppx-play,.motion-play').click();await page.waitForTimeout(100);
    const paused=await count();await page.waitForTimeout(300);assert.equal(await count(),paused,id+' paused loop stopped');
    await demo.locator('.ppx-play,.motion-play').click();await page.waitForTimeout(100);
    await page.evaluate(()=>{location.hash='reading-path';});await page.waitForTimeout(180);
    const hidden=await count();await page.waitForTimeout(350);assert.equal(await count(),hidden,id+' hidden chapter stopped');
   }
   console.log('PASS motion '+id+' '+file);
  }
  assert.deepEqual(errors,[]);
  // Media preference is honored even if the user presses Play; manual stepping works.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'/posts/parallelism-survey.html#overlap-demo');
  const d=page.locator('#overlap-demo');await d.scrollIntoViewIfNeeded();await page.waitForTimeout(180);
  await d.locator('.ppx-play').click();await page.waitForTimeout(120);
  const before=await d.getAttribute('data-motion-frames');await page.waitForTimeout(350);
  assert.equal(await d.getAttribute('data-motion-frames'),before,'reduced motion prevents continuous animation');
  await d.locator('.motion-step').click();await page.waitForTimeout(100);
  assert.notEqual(await d.getAttribute('data-motion-frames'),before,'reduced motion retains single step');
  // New source anchors and licensed figures are visible and fit a phone screen.
  await page.setViewportSize({width:375,height:900});
  for(const file of fs.readdirSync(path.join(root,'posts')).filter(f=>f.endsWith('.html'))){
   await page.goto(base+'/posts/'+file+'#research-20261103');
   assert(await page.locator('#research-20261103').isVisible(),file+' new content deep link');
   assert(await page.locator('#research-20261103').evaluate(n=>!n.closest('[data-research-updates]')),file+' research belongs in the main chapters');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),file+' mobile width');
  }
  const output=process.env.RESEARCH_QA_DIR;
  if(output){
   fs.mkdirSync(output,{recursive:true});
   for(const [file,id] of [['kv-cache-survey','fig-nov03-2610.39853'],['loop-transformer-survey','fig-nov03-2610.40325'],['parallelism-survey','overlap-demo']]){
    for(const width of [375,1440]){
     await page.setViewportSize({width,height:1000});await page.goto(base+'/posts/'+file+'.html#'+id);
     await page.locator('[id="'+id+'"]').scrollIntoViewIfNeeded();await page.waitForTimeout(150);
     await page.screenshot({path:path.join(output,file+'-'+width+'.png')});
    }
   }
  }
  console.log('PASS causal softmax, reduced motion, 16 new mobile anchors, source figures');
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
