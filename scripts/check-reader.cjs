/* Browser regression checks. Requires Playwright and installed Microsoft Edge.
 * Preview: python -m http.server 8943 --bind 127.0.0.1
 * Test:    node scripts/check-reader.cjs [http://127.0.0.1:8943]
 */
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8943';
const root = path.resolve(__dirname, '..');
const out = process.env.READER_QA_DIR;
if (out) fs.mkdirSync(out, {recursive:true});
(async () => {
  const browser = await chromium.launch({channel:'msedge', headless:true});
  const results = [];
  try {
    for (const width of [1440,375]) {
      const context = await browser.newContext({viewport:{width,height:950}});
      await context.route('**/*', r => new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : r.abort());
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      for (const file of fs.readdirSync(path.join(root,'posts')).filter(f => f.endsWith('.html'))) {
        errors.length = 0;
        await page.goto(base+'/posts/'+file, {waitUntil:'load'});
        await page.waitForSelector('html.reader-ready');
        const audit = await page.evaluate(async () => {
          const raw = new DOMParser().parseFromString(await (await fetch(location.pathname)).text(), 'text/html');
          function content(doc) {
            const container = (doc.querySelector('.reader-chapter')?.parentElement || doc.querySelector('#reading-path').parentElement).cloneNode(true);
            container.querySelectorAll('script,style,.toc,.reader-ui,[data-reader-repeat],[id^=PPX-],#rl-demo,#q-demo').forEach(n => n.remove());
            return container.textContent.replace(/\s+/g,'');
          }
          const originalIDs = [...raw.querySelectorAll('[id]')].map(n=>n.id);
          const missingIDs = originalIDs.filter(id=>document.querySelectorAll('[id]').length && !document.getElementById(id));
          const duplicateIDs = [...document.querySelectorAll('[id]')].map(n=>n.id).filter((id,i,a)=>a.indexOf(id)!==i);
          const allPages = [...document.querySelectorAll('.reader-page')];
          const allChapters = [...document.querySelectorAll('.reader-chapter')];
          const oversized = [], brokenPages = [], overflows = [];
          const setHash = id => { history.replaceState(null,'','#'+encodeURIComponent(id)); dispatchEvent(new HashChangeEvent('hashchange')); };
          for (const p of allPages) {
            setHash(p.id);
            const visible = allPages.filter(n=>n.getClientRects().length);
            if (visible.length !== 1 || visible[0] !== p) brokenPages.push(p.id);
            if (p.scrollHeight > 5600) oversized.push({id:p.id,height:p.scrollHeight,text:p.textContent.trim().slice(0,80)});
            if (document.documentElement.scrollWidth > innerWidth+2) overflows.push(p.id);
          }
          const hiddenFigures = [];
          for (const img of document.images) {
            setHash(img.id);
            if (!img.getClientRects().length || img.closest('details:not([open])')) hiddenFigures.push(img.id);
          }
          const brokenAnchors = [];
          for (const a of raw.querySelectorAll('a[href^="#"]')) {
            let id; try { id=decodeURIComponent(a.getAttribute('href').slice(1)); } catch { continue; }
            const t=document.getElementById(id); if (!t) continue;
            setHash(id);
            if (t.closest('.reader-chapter') && !t.getClientRects().length && !t.matches('style,script')) brokenAnchors.push(id);
          }
          return {pages:allPages.length, chapters:allChapters.length, chapterPageCounts:allChapters.map(c=>c.querySelectorAll('.reader-page').length),textPreserved:content(raw)===content(document),missingIDs,duplicateIDs,brokenPages,overflows,hiddenFigures,brokenAnchors,oversized,images:[...document.images].map(i=>i.getAttribute('src'))};
        });
        assert(audit.textPreserved, file+': lost or reordered article text');
        for (const key of ['missingIDs','duplicateIDs','brokenPages','overflows','hiddenFigures','brokenAnchors']) assert.deepEqual(audit[key],[],file+': '+key);
        assert(audit.chapterPageCounts.some(n=>n>1),file+': expected pagination inside chapters');
        // Start at the first page, follow Next, and exercise browser Back.
        await page.goto(base+'/posts/'+file+'#reader-page-1');
        const first = await page.locator('.reader-page:visible').getAttribute('id');
        await page.locator('[data-reader-next]').click();
        await page.waitForFunction(id=>document.querySelector('.reader-page:not([hidden])').id!==id,first);
        await page.goBack();
        await page.waitForFunction(id=>document.querySelector('.reader-page:not([hidden])').id===id,first);
        await page.getByRole('button',{name:'全文阅读',exact:true}).click();
        assert.equal(await page.locator('.reader-page:visible').count(),audit.pages,file+': full view');
        const brokenImages = await page.evaluate(async () => {
          const images = [...document.images]; images.forEach(i => i.loading = 'eager');
          await Promise.all(images.map(i => i.decode().catch(() => {})));
          return images.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));
        });
        assert.deepEqual(brokenImages,[],file+': image decoding');
        await page.getByRole('button',{name:'分页阅读',exact:true}).click();
        assert.equal(await page.locator('.reader-page:visible').count(),1,file+': paged view');
        if (width===375) {
          await page.getByRole('button',{name:'☰ 目录',exact:true}).click();
          assert.equal(await page.locator('#reader-sidebar').isVisible(),true);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#reader-sidebar').isVisible(),false);
          await page.getByRole('button',{name:'☰ 目录',exact:true}).click();
          const destination=page.locator('.reader-page-link').nth(1);
          await destination.locator('..').locator('summary').click();
          await destination.click();
          assert.equal(await page.locator('#reader-sidebar').isVisible(),false);
        } else {
          const toggle=page.getByRole('button',{name:'☰ 目录',exact:true});
          if (await page.locator('#reader-sidebar').isVisible()) await page.getByRole('button',{name:'收起目录',exact:true}).click();
          await page.reload();
          assert.equal(await page.locator('#reader-sidebar').isVisible(),false,file+': remember collapsed sidebar');
          await toggle.click();
        }
        // Deep links must survive a cold load, including figure targets.
        const deep = await page.locator('.reader-page').last().getAttribute('id');
        await page.goto(base+'/posts/'+file+'#'+deep);
        assert.equal(await page.locator('.reader-page:visible').getAttribute('id'),deep,file+': deep link');
        // Moving intact DOM nodes must retain existing demonstration listeners.
        if (file==='attention-evolution.html') {
          await page.goto(base+'/posts/'+file+'#PPX-W2');
          await page.locator('.ppx-mode[data-m="mqa"]').click();
          assert(await page.locator('.ppx-mode[data-m="mqa"]').evaluate(n=>n.classList.contains('on')));
          await page.locator('.ppx-temp').fill('42');
          assert.equal(await page.locator('.ppx-tv').textContent(),'0.42');
        }
        if (file==='llm-perf-simulation-2026.html') {
          await page.goto(base+'/posts/'+file+'#rl-demo');
          await page.locator('#rl-slider').fill('64');
          assert.equal(await page.locator('#rl-b').textContent(),'64');
          await page.goto(base+'/posts/'+file+'#q-demo');
          await page.locator('#q-lambda').fill('35');
          assert.equal(await page.locator('#q-lv').textContent(),'0.35');
        }
        if (file==='vit-sparsification.html') {
          const demo=await page.locator('[id^="PPX-"]').getAttribute('id');
          await page.goto(base+'/posts/'+file+'#'+demo);
          await page.locator('.ppx-mode[data-m="fastv"]').click();
          assert(await page.locator('.ppx-mode[data-m="fastv"]').evaluate(n=>n.classList.contains('on')));
        }
        assert.deepEqual(errors,[],file+': browser errors');
        if(out && ['attention-evolution.html','parallelism-survey.html','speculative-decoding.html'].includes(file)) {
          await page.goto(base+'/posts/'+file+'#s3');
          await page.screenshot({path:path.join(out,file.replace('.html','')+'-'+width+'.png')});
        }
        results.push({file,width,...audit,errors:[...errors]});
        console.log(`PASS ${width}px ${file}: ${audit.chapters} chapters / ${audit.pages} pages; ${audit.oversized.length} large atomic pages`);
      }
      await context.close();
    }
    // Progressive fallback: all prose and figures remain available without JS.
    const fallback=await browser.newContext({javaScriptEnabled:false});
    await fallback.route('**/*', r => new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : r.abort());
    const page=await fallback.newPage();
    for(const file of fs.readdirSync(path.join(root,'posts')).filter(f=>f.endsWith('.html'))) {
      await page.goto(base+'/posts/'+file);
      assert.equal(await page.locator('details:not([open]) img').count(),0,file+': no-JS images folded');
      assert(await page.locator('#reading-path').isVisible());
    }
    await fallback.close();
    if(out) fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
