const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {prepare, search} = require('./site-search.js');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, '../search-index.json'), 'utf8'));
const docs = prepare(index.documents);

test('all existing articles and chapter anchors are indexed', () => {
  assert.equal(docs.length, 16);
  for (const doc of index.documents) {
    const source = fs.readFileSync(path.join(__dirname, '..', doc.url), 'utf8');
    assert.ok(doc.sections.length > 0);
    for (const section of doc.sections) assert.ok(source.includes('id="' + section.anchor + '"'), doc.url + '#' + section.anchor);
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
