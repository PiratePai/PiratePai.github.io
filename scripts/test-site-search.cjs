const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {prepare, search, readIndex} = require('./site-search.js');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, '../search-index.json'), 'utf8'));
const docs = prepare(index.documents);

test('all existing articles and chapter anchors are indexed', () => {
  const articles = fs.readdirSync(path.join(__dirname, '../posts')).filter(file => file.endsWith('.html')).map(file => 'posts/' + file).sort();
  assert.deepEqual(index.documents.map(doc => doc.url).sort(), articles);
  for (const doc of index.documents) {
    const source = fs.readFileSync(path.join(__dirname, '..', doc.url), 'utf8');
    assert.ok(doc.sections.length > 0);
    for (const section of doc.sections) assert.ok(source.includes('id="' + section.anchor + '"'), doc.url + '#' + section.anchor);
  }
});
test('evaluation, reasoning budgets and Agent recovery are discoverable', () => {
  for (const [query, slug] of [['可复算账本', 'inference-evaluation'], ['预算预留', 'test-time-compute'], ['幂等', 'agent-inference-systems']]) {
    assert.ok(search(docs, query).some(result => result.url.includes(slug)), query);
  }
});
test('Chinese topic and case/punctuation-normalized English return the relevant article first', () => {
  assert.match(search(docs, '量化')[0].url, /quantization-survey/);
  assert.match(search(docs, 'ＫＶ－ＣＡＣＨＥ')[0].url, /kv-cache-survey/);
});
test('chapter query lands on a matching chapter rather than just the article', () => {
  const result = search(docs, '分页管理').find(result => result.url.includes('kv-cache-survey'));
  assert.ok(result);
  assert.match(result.url, /#s4$/);
  assert.ok(result.snippet.length > 0);
});
test('multiword search requires all terms in a single article section', () => {
  const fixture = prepare([{title:'Example',url:'posts/example.html',sections:[{heading:'a',anchor:'a',text:'alpha'},{heading:'b',anchor:'b',text:'beta'}]}]);
  assert.deepEqual(search(fixture, 'alpha beta'), []);
});
test('blank, punctuation and absent terms have no bogus results', () => {
  for (const query of ['', '   ', '[].*', '<img onerror=bad>', '不存在的搜索词xyz987']) assert.deepEqual(search(docs, query), []);
});
test('style and JavaScript implementation text is excluded from the index', () => {
  assert.deepEqual(search(docs, 'function updateReader'), []);
  assert.deepEqual(search(docs, 'grid-template-columns'), []);
});

test('compressed index expands to the complete JSON index without changing search results', async () => {
  const packed = fs.readFileSync(path.join(__dirname, '../search-index.json.gz'));
  const loaded = await readIndex(async () => new Response(packed), {plain:'index.json',gzip:'index.json.gz'}, undefined, DecompressionStream);
  assert.deepEqual(loaded, index);
  assert.deepEqual(search(prepare(loaded.documents), '分页管理'), search(docs, '分页管理'));
});

test('missing or corrupt gzip falls back to JSON; browsers without a decoder skip gzip', async () => {
  for (const failure of [new Response('', {status:404}), new Response('invalid gzip')]) {
    const calls = [];
    const loaded = await readIndex(async url => {
      calls.push(url);
      return url.endsWith('.gz') ? failure : Response.json(index);
    }, {plain:'index.json',gzip:'index.json.gz'}, undefined, DecompressionStream);
    assert.deepEqual(loaded, index);
    assert.deepEqual(calls, ['index.json.gz','index.json']);
  }
  const calls = [];
  await readIndex(async url => { calls.push(url); return Response.json(index); }, {plain:'index.json',gzip:'index.json.gz'});
  assert.deepEqual(calls, ['index.json']);
});

test('transparently decoded gzip is accepted and an abort does not start a fallback request', async () => {
  const loaded = await readIndex(async () => Response.json(index), {gzip:'index.json.gz'}, undefined, DecompressionStream);
  assert.deepEqual(loaded, index);
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(readIndex(async () => { calls++; throw new Error('aborted'); }, {gzip:'index.json.gz',plain:'index.json'}, controller.signal, DecompressionStream));
  assert.equal(calls, 1);
});

test('valid JSON with invalid index data falls back from gzip to the ordinary index', async () => {
  const {gzipSync} = require('node:zlib');
  const invalid = [null, {}, {version:99,documents:[]}, {version:1,documents:[]},
    {version:1,documents:[{title:'Bad URL',url:'https://example.org/',sections:[]}]},
    {version:1,documents:[{title:'Bad section',url:'posts/example.html',sections:[null]}]}];
  for (const data of invalid) {
    const calls = [];
    const loaded = await readIndex(async url => {
      calls.push(url);
      return url.endsWith('.gz') ? new Response(gzipSync(JSON.stringify(data))) : Response.json(index);
    }, {plain:'index.json',gzip:'index.json.gz'}, undefined, DecompressionStream);
    assert.deepEqual(loaded, index);
    assert.deepEqual(calls, ['index.json.gz','index.json']);
  }
  await assert.rejects(readIndex(async () => Response.json({version:1,documents:[]}), {plain:'index.json'}), /Invalid index/);
});
