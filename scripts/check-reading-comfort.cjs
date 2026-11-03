/* Visual style checks beyond navigation: both palettes, prose contrast and widths.
 * Run against a local preview: node scripts/check-reading-comfort.cjs URL
 * Requires Playwright + Microsoft Edge, like check-reader.cjs.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:8944';
const files=fs.readdirSync(path.join(__dirname,'../posts')).filter(f=>f.endsWith('.html'));
const out=process.env.READER_QA_DIR;
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const results=[];
  try {
    for(const width of [1440,375]) {
      const context=await browser.newContext({viewport:{width,height:950}});
      await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
      const page=await context.newPage();
      // A first visit continues the homepage palette; only an explicit choice enables dark mode.
      await page.goto(base+'/');
      const homeStyle=await page.evaluate(()=>({
        paper:getComputedStyle(document.body).backgroundColor,
        ink:getComputedStyle(document.body).color,
        rail:getComputedStyle(document.querySelector('.sidebar')).backgroundColor,
        accent:getComputedStyle(document.querySelector('.topbar-links a')).color,
        headingFont:getComputedStyle(document.querySelector('h1')).fontFamily
      }));
      await page.goto(base+'/posts/attention-evolution.html');
      assert.equal(await page.locator('html').getAttribute('data-reader-theme'),'paper');
      const readerStyle=await page.evaluate(()=>({
        paper:getComputedStyle(document.body).backgroundColor,
        ink:getComputedStyle(document.body).color,
        rail:getComputedStyle(document.querySelector('.reader-sidebar')).backgroundColor,
        accent:getComputedStyle(document.querySelector('.reader-home')).color,
        headingFont:getComputedStyle(document.querySelector('.hero h1')).fontFamily
      }));
      for(const key of ['paper','ink','rail','accent','headingFont'])assert.equal(readerStyle[key],homeStyle[key],key+': homepage/reader mismatch');
      assert.equal(await page.locator('.reader-brand').getAttribute('href'),'../index.html');
      await page.locator('.reader-theme-toggle').click();
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('data-reader-theme'),'dark');
      await page.goto(base+'/posts/kv-cache-survey.html');
      assert.equal(await page.locator('html').getAttribute('data-reader-theme'),'dark');
      for(const file of files) {
        await page.goto(base+'/posts/'+file+'?view=all');
        for(const theme of ['dark','paper']) {
          const button=page.locator('.reader-theme-toggle');
          if(await page.locator('html').getAttribute('data-reader-theme')!==theme) await button.click();
          const audit=await page.evaluate(()=>{
            document.querySelectorAll('.reader-content details').forEach(n=>n.open=true);
            const styles=new Map(), backgrounds=new Map();
            const style=n=>{if(!styles.has(n))styles.set(n,getComputedStyle(n));return styles.get(n)};
            const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
            function background(n) {
              if(!n)return [255,255,255];
              if(backgrounds.has(n))return backgrounds.get(n);
              const color=rgb(style(n).backgroundColor),alpha=color[3]??1;
              const parent=alpha===1?[255,255,255]:background(n.parentElement);
              const composite=parent.map((v,i)=>(color[i]||0)*alpha+v*(1-alpha));
              backgrounds.set(n,composite);return composite;
            }
            function luminance(color) {return color.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
            const lowContrast=[],smallProse=[];
            const walker=document.createTreeWalker(document.querySelector('.reader-content'),NodeFilter.SHOW_TEXT);
            let n,checked=0;
            while(n=walker.nextNode()) {
              const el=n.parentElement,text=n.textContent.trim();
              if(text.length<4||el.closest('script,style,svg,pre,code,.ppx-demo,.reader-ui')||!el.getClientRects().length)continue;
              const css=style(el),a=luminance(rgb(css.color)),b=luminance(background(el));
              const contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
              const large=parseFloat(css.fontSize)>=24||(parseFloat(css.fontSize)>=18&&parseFloat(css.fontWeight)>=600);
              if(contrast<(large?3:4.5)-.05)lowContrast.push({tag:el.tagName,cls:el.className,color:css.color,bg:background(el),ratio:Math.round(contrast*100)/100,text:text.slice(0,70)});
              if(el.tagName==='P'&&text.length>60&&!el.closest('blockquote,.quote,.citebox,.q,figcaption,td,th,.codecap,.cap,footer,.footer,.fig,.diagram')&&parseFloat(css.fontSize)<15.5)smallProse.push(text.slice(0,60));
              checked++;
            }
            for(const el of document.querySelectorAll('.reader-content pre,.reader-content pre span')) {
              if(!el.textContent.trim()||!el.getClientRects().length)continue;
              const a=luminance(rgb(style(el).color)),b=luminance(background(el));
              const contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
              if(contrast<4.45)lowContrast.push({tag:el.tagName,cls:el.className,color:style(el).color,bg:background(el),ratio:Math.round(contrast*100)/100,text:el.textContent.slice(0,70)});
            }
            const numberIssues=[...document.querySelectorAll('.reader-content h2 .no,.reader-content h2 .num')].filter(n=>{
              const number=style(n),heading=style(n.closest('h2'));
              return number.display!=='inline'||number.verticalAlign!=='baseline'||number.fontSize!==heading.fontSize||parseFloat(number.borderTopWidth)!==0;
            }).map(n=>n.closest('h2').textContent.trim());
            const toolbar=[...document.querySelectorAll('.reader-toolbar button,.reader-toolbar a')].filter(n=>n.getClientRects().length).map(n=>({left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right}));
            return {theme:document.documentElement.dataset.readerTheme,checked,lowContrast:lowContrast.slice(0,25),lowContrastCount:lowContrast.length,smallProse,numberIssues,overflow:document.documentElement.scrollWidth>innerWidth+2,toolbarFits:toolbar.every(r=>r.left>=0&&r.right<=innerWidth+1),contentWidth:document.querySelector('.reader-content').clientWidth};
          });
          results.push({file,width,...audit});
          console.log(JSON.stringify({file,width,...audit}));
          if(out&&['attention-evolution.html','parallelism-survey.html','quantization-survey.html'].includes(file)) {
            await page.getByRole('button',{name:'分页阅读',exact:true}).click();
            const target=await page.locator('.reader-chapter').nth(3).locator('.reader-page').first().getAttribute('id');
            await page.evaluate(id=>{location.hash=id},target);
            await page.waitForTimeout(80);
            await page.screenshot({path:path.join(out,file.replace('.html','')+'-'+width+'-'+theme+'.png')});
            await page.getByRole('button',{name:'全文阅读',exact:true}).click();
          }
        }
        // Theme choice survives reload and article navigation.
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('data-reader-theme'),'paper');
      }
      // Toolbar must remain usable even on narrow phones with both arrows shown.
      await page.setViewportSize({width:320,height:800});
      await page.goto(base+'/posts/attention-evolution.html#s3');
      assert(await page.locator('.reader-toolbar').evaluate(n=>[...n.querySelectorAll('button,a')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().right<=innerWidth+1)));
      await context.close();
    }
    if(out)fs.writeFileSync(path.join(out,'comfort-results.json'),JSON.stringify(results,null,2));
    const failures=results.filter(r=>r.lowContrastCount||r.smallProse.length||r.numberIssues.length||r.overflow||!r.toolbarFits);
    assert.deepEqual(failures,[], 'reading style failures (see report above)');
  } finally {await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
