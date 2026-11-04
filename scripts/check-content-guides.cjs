const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8957';
const slugs = ['inference-evaluation', 'test-time-compute', 'agent-inference-systems', 'diffusion-flow-sampling'];
const output = process.env.SITE_QA_OUTPUT || path.join(require('node:os').tmpdir(), 'piratepai-content-qa');
fs.mkdirSync(output,{recursive:true});
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    for (const width of [375,1440]) {
      await page.setViewportSize({width,height:950});
      for (const slug of slugs) {
        await page.goto(`${base}/posts/${slug}.html`);
        await page.evaluate(()=>document.fonts.ready);
        const state=await page.evaluate(()=>({
          overflow:document.documentElement.scrollWidth > innerWidth + 1,
          scrollWidth:document.documentElement.scrollWidth,
          reader:document.documentElement.className,
          pages:document.querySelectorAll('.reader-page').length,
          headings:document.querySelectorAll('h2').length,
          controls:[...document.querySelectorAll('button')].map(b=>({text:b.textContent,title:b.title,aria:b.getAttribute('aria-label')}))
        }));
        console.log(width,slug,JSON.stringify(state));
        await page.screenshot({path:path.join(output,`${slug}-${width}.png`),fullPage:false});
        assert.ok(!state.overflow,`${slug} horizontal overflow ${width}: ${state.scrollWidth}`);
        assert.ok(state.pages>0,'Reader initialized');
        assert.equal(await page.locator('.reader-legacy-home:visible').count(),0,'Legacy home button hidden when reader is active');
        await page.locator('.reader-theme-toggle').click();
        assert.equal(await page.locator('html').getAttribute('data-reader-theme'),'dark');
        await page.goto(`${base}/posts/${slug}.html#s3`);
        assert.equal(await page.locator('html').getAttribute('data-reader-theme'),'dark','Theme preference persists');
        await page.screenshot({path:path.join(output,`${slug}-${width}-dark-chapter.png`),fullPage:false});
        await page.locator('.reader-theme-toggle').click();
        if(width===375){
          await page.getByRole('button',{name:'☰ 目录',exact:true}).click();
          await page.locator('.reader-sidebar').getByRole('link',{name:/^5 /}).click();
          await page.locator('#s5').waitFor({state:'visible'});
        }
        const next=page.locator('[data-reader-next]').first();
        const target=await next.getAttribute('href');
        if(target){await next.click();assert.ok(page.url().endsWith(target));}
        for (const anchor of ['s0','s1','s3','s5','refs']) {
          await page.goto(`${base}/posts/${slug}.html#${anchor}`);
          await page.locator('#'+anchor).waitFor({state:'visible'});
        }
        const ref = await page.locator('.refs li').first().getAttribute('id');
        await page.goto(`${base}/posts/${slug}.html#${ref}`);
        await page.locator('#'+ref).waitFor({state:'visible'});
        await page.goto(`${base}/posts/${slug}.html?view=all`);
        assert.equal(await page.locator('h2:visible').count(),state.headings,'Full text exposes every chapter');
      }
    }
    await page.goto(base);
    const articles=fs.readdirSync(path.join(__dirname,'../posts')).filter(name=>name.endsWith('.html'));
    assert.equal(await page.locator('.article-entry').count(),articles.length);
    for (const [query,slug] of [['可复算账本','inference-evaluation'],['预算预留','test-time-compute'],['幂等','agent-inference-systems'],['时间网格','diffusion-flow-sampling']]) {
      await page.locator('#search-input').fill(query);
      await page.locator(`#search-list a[href*="${slug}"]`).first().waitFor({state:'visible'});
    }
    await page.screenshot({path:path.join(output,'search-desktop.png'),fullPage:false});
    assert.deepEqual(errors,[]);
    await context.close();
    const plain = await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});
    const p = await plain.newPage();
    for (const slug of slugs) {
      await p.goto(`${base}/posts/${slug}.html`);
      assert.ok(await p.locator('.toc').isVisible());
      assert.equal(await p.locator('h2').count(),await p.locator('h2:visible').count());
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1), `No-JS mobile overflow in ${slug}`);
    }
    console.log('PASS mobile/desktop chapters, references, full text, no-JS and search');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
