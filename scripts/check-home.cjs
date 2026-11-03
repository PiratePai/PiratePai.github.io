/* Homepage regression checks. Requires Playwright and Microsoft Edge.
 * Run: node scripts/check-home.cjs http://127.0.0.1:8947
 * Optional HOME_QA_DIR saves desktop/mobile screenshots.
 */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.argv[2] || 'http://127.0.0.1:8947';
const metadata = require('../data/articles.json');
const output = process.env.HOME_QA_DIR;
if (output) fs.mkdirSync(output, {recursive:true});

(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    for (const width of [1440,375]) {
      const context = await browser.newContext({viewport:{width,height:950}});
      await context.route('**/*', r => new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : r.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/');
      const updates = await page.locator('.update-group').evaluateAll(groups => groups.map(group => ({
        day:group.querySelector('time').dateTime,
        summary:group.querySelector('summary').textContent,
        articles:[...group.querySelectorAll('.update-title')].map(a=>a.getAttribute('href')),
        changes:[...group.querySelectorAll('.update-changes a')].map(a=>a.getAttribute('href'))
      })));
      for (const group of updates) {
        const expected = Object.entries(metadata.articles).filter(([,a])=>a.changes.some(c=>c.date===group.day));
        assert.deepEqual(group.articles,expected.map(([slug])=>'posts/'+slug+'.html'));
        assert.equal(new Set(group.articles).size,group.articles.length,'One title per article and date');
        assert.ok(group.summary.endsWith(`· ${expected.length} 篇`));
        assert.deepEqual(group.changes,expected.flatMap(([slug,a])=>a.changes.filter(c=>c.date===group.day).map(c=>`posts/${slug}.html#${c.anchor}`)));
      }
      await page.locator('.update-group summary').first().click();
      await page.locator('#recent-updates').scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'Expanded updates fit viewport');
      if (output) await page.screenshot({path:path.join(output,`home-updates-${width}.png`)});
      const change = page.locator('.update-changes a').nth(1);
      const href = await change.getAttribute('href');
      await change.click();
      await page.locator('html.reader-ready').waitFor();
      await page.locator('#'+href.split('#')[1]).waitFor({state:'visible'});

      const nav = '.stage-nav';
      async function navigateStage(id) {
        await page.locator(nav+` a[href="#${id}"]`).click();
        await page.waitForFunction(id=>location.hash==='#'+id,id);
        await page.waitForFunction(({nav,id})=>document.querySelector(nav+' a[aria-current]')?.getAttribute('href')==='#'+id,{nav,id});
      }
      if (width===1440) {
        await page.goto(base+'/#systems');
        await page.waitForFunction(nav=>document.querySelector(nav+' a[aria-current]')?.getAttribute('href')==='#systems',nav);
        await navigateStage('core');
        await page.goBack();
        await page.waitForFunction(nav=>document.querySelector(nav+' a[aria-current]')?.getAttribute('href')==='#systems',nav);
        await page.goForward();
        await page.waitForFunction(nav=>document.querySelector(nav+' a[aria-current]')?.getAttribute('href')==='#core',nav);
      }

      await page.goto(base+'/?q='+encodeURIComponent('量化'));
      await page.locator('#search-list a[href*="quantization-survey"]').waitFor();
      await page.locator('.topbar-links a[href="#all-articles"]').click();
      await page.waitForFunction(()=>location.hash==='#all-articles');
      assert.equal(await page.locator('#reading-content').isVisible(),true);
      assert.equal(new URL(page.url()).searchParams.has('q'),false);
      await page.goBack();
      await page.locator('#search-list a[href*="quantization-survey"]').waitFor();
      assert.equal(await page.locator('#search-input').inputValue(),'量化');
      assert.equal(new URL(page.url()).searchParams.get('q'),'量化');
      assert.equal(await page.locator('#reading-content').isVisible(),false);
      await page.goForward();
      await page.locator('#reading-content').waitFor({state:'visible'});
      assert.equal(await page.locator('#search-input').inputValue(),'');
      // Navigate before the input debounce fires: Back must retain the last edit.
      await page.evaluate(()=>{
        const input=document.querySelector('#search-input');
        input.value='KV Cache'; input.dispatchEvent(new Event('input',{bubbles:true}));
        document.querySelector('.topbar-links a[href="#all-articles"]').click();
      });
      await page.goBack();
      await page.locator('#search-list a[href*="kv-cache-survey"]').waitFor();
      assert.equal(await page.locator('#search-input').inputValue(),'KV Cache');

      // Parseable but invalid gzip must still reach the full ordinary JSON index.
      let plainRequests = 0, unavailable = false;
      await page.route('**/search-index.json.gz*',r=>r.fulfill({json:{version:99,documents:[]}}));
      await page.route('**/search-index.json?*',r=>{
        plainRequests++;
        return unavailable ? r.fulfill({status:503,body:'Unavailable'}) : r.continue();
      });
      await page.goto(base+'/?q='+encodeURIComponent('分页管理'));
      await page.locator('#search-list a[href$="#s4"]').waitFor();
      assert.equal(plainRequests,1);
      assert.equal(await page.locator('#search-message').textContent(),'');
      unavailable = true;
      await page.reload();
      await page.getByRole('button',{name:'重试',exact:true}).waitFor();
      unavailable = false;
      await page.getByRole('button',{name:'重试',exact:true}).click();
      await page.locator('#search-list a[href$="#s4"]').waitFor();
      assert.deepEqual(errors,[]);
      console.log(`PASS ${width}px: grouped updates, section links, search history, navigation, index fallback and retry`);
      await context.close();
    }
    const plain = await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:950}});
    await plain.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
    const page = await plain.newPage();
    await page.goto(base+'/');
    await page.locator('.update-group summary').first().click();
    const latest = await page.locator('.update-group[open] time').getAttribute('datetime');
    const articles = Object.values(metadata.articles).filter(a=>a.changes.some(c=>c.date===latest));
    assert.equal(await page.locator('.update-group[open] .update-title').count(),articles.length);
    assert.equal(await page.locator('.update-group[open] .update-changes a').count(),articles.flatMap(a=>a.changes.filter(c=>c.date===latest)).length);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
    await page.setViewportSize({width:320,height:950});
    await page.goto(base+'/posts/agent-inference-systems.html');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'Long hero labels wrap without JavaScript');
    console.log('PASS no-JavaScript update list and chapter links');
    await plain.close();
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
