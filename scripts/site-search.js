/* Static article search in the browser, without an external search service. */
(function () {
  'use strict';

  function normalize(value) {
    return String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  function termsFor(query) {
    return Array.from(new Set(normalize(query).split(/\s+/).filter(Boolean)));
  }

  function prepare(documents) {
    return documents.map(function (doc) {
      return {
        title: doc.title, url: doc.url, titleKey: normalize(doc.title),
        sections: (doc.sections || []).map(function (section) {
          return {heading: section.heading, anchor: section.anchor, text: section.text,
            headingKey: normalize(section.heading), textKey: normalize(section.text)};
        })
      };
    });
  }

  function excerpt(text, terms) {
    const lower = text.toLowerCase();
    const positions = terms.map(function (term) { return lower.indexOf(term); }).filter(function (i) { return i >= 0; });
    const start = positions.length ? Math.max(0, Math.min.apply(null, positions) - 48) : 0;
    const end = Math.min(text.length, start + 190);
    return (start ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function search(documents, query) {
    const terms = termsFor(query);
    if (!terms.length) return [];
    const phrase = normalize(query);
    const results = [];
    documents.forEach(function (doc) {
      const titleMatch = terms.every(function (term) { return doc.titleKey.includes(term); });
      let best = null;
      doc.sections.forEach(function (section) {
        const haystack = doc.titleKey + ' ' + section.headingKey + ' ' + section.textKey;
        if (!terms.every(function (term) { return haystack.includes(term); })) return;
        let score = terms.reduce(function (sum, term) {
          return sum + (doc.titleKey.includes(term) ? 60 : 0) +
            (section.headingKey.includes(term) ? 35 : 0) + (section.textKey.includes(term) ? 2 : 0);
        }, 0);
        if (doc.titleKey.includes(phrase)) score += 200;
        if (section.headingKey.includes(phrase)) score += 45;
        if (!best || score > best.score) best = {section: section, score: score};
      });
      if (!best && !titleMatch) return;
      const section = best ? best.section : {heading: '', anchor: '', text: ''};
      const direct = titleMatch && !terms.every(function (term) { return section.headingKey && section.headingKey.includes(term); });
      results.push({
        article: doc.title, title: direct ? doc.title : section.heading || doc.title,
        url: doc.url + (!direct && section.anchor ? '#' + encodeURIComponent(section.anchor) : ''),
        snippet: excerpt(section.text, terms), score: best ? best.score : 200
      });
    });
    return results.sort(function (a, b) { return b.score - a.score || a.article.localeCompare(b.article, 'zh-CN'); });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {normalize: normalize, prepare: prepare, search: search};
  if (typeof document === 'undefined') return;

  const form = document.getElementById('site-search');
  if (!form) return;
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  const region = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const message = document.getElementById('search-message');
  const list = document.getElementById('search-list');
  const more = document.getElementById('more-results');
  const guide = document.getElementById('reading-content');
  const fallback = prepare(Array.from(document.querySelectorAll('.article-entry')).map(function (entry) {
    const link = entry.querySelector('h3 a');
    return {title: link.textContent.trim(), url: link.getAttribute('href'), sections: [{heading: '', anchor: '', text: entry.querySelector('.article-summary').textContent.trim()}]};
  }));
  let documents = null, pending = null, failed = false, composing = false, timer = null, limit = 12;

  function loadIndex(retry) {
    if (retry) { pending = null; failed = false; }
    if (documents) return Promise.resolve();
    if (pending) return pending;
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 8000);
    pending = fetch('search-index.json', {signal: controller.signal}).then(function (response) {
      if (!response.ok) throw new Error('Index unavailable');
      return response.json();
    }).then(function (data) {
      if (data.version !== 1 || !Array.isArray(data.documents) || !data.documents.length) throw new Error('Invalid index');
      data.documents.forEach(function (doc) {
        if (!/^posts\/[a-z0-9-]+\.html$/.test(doc.url) || typeof doc.title !== 'string' || !Array.isArray(doc.sections)) throw new Error('Invalid document');
        doc.sections.forEach(function (section) {
          if (typeof section.heading !== 'string' || typeof section.text !== 'string' || typeof section.anchor !== 'string') throw new Error('Invalid section');
        });
      });
      documents = prepare(data.documents);
      failed = false;
    }).catch(function () { failed = true; }).finally(function () {
      clearTimeout(timeout);
      render();
    });
    return pending;
  }

  function highlighted(parent, text, terms) {
    const escaped = terms.slice().sort(function (a, b) { return b.length - a.length; }).map(function (term) { return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    if (!escaped.length) { parent.textContent = text; return; }
    const pattern = new RegExp(escaped.join('|'), 'giu');
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      const mark = document.createElement('mark');
      mark.textContent = match[0];
      parent.appendChild(mark);
      cursor = match.index + match[0].length;
    }
    parent.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function render() {
    const query = input.value.trim();
    const active = Boolean(query);
    region.hidden = !active;
    guide.hidden = active;
    clear.hidden = !input.value;
    list.replaceChildren();
    message.replaceChildren();
    if (!active) { status.textContent = ''; return; }
    const terms = termsFor(query);
    const results = search(documents || fallback, query);
    status.textContent = terms.length ? '找到 ' + results.length + ' 篇相关文章' : '请输入中文、英文或数字关键词';
    if (!documents) {
      message.appendChild(document.createTextNode(failed ? '章节索引暂时无法加载，当前搜索文章标题与摘要。' : '正在载入章节索引，先显示标题与摘要结果。'));
      if (failed) {
        const retry = document.createElement('button');
        retry.type = 'button'; retry.textContent = '重试';
        retry.addEventListener('click', function () { loadIndex(true); render(); });
        message.appendChild(retry);
      }
    }
    results.slice(0, limit).forEach(function (result) {
      const item = document.createElement('li'); item.className = 'search-result';
      if (result.article !== result.title) {
        const article = document.createElement('p'); article.className = 'result-article';
        article.textContent = result.article; item.appendChild(article);
      }
      const heading = document.createElement('h3');
      const link = document.createElement('a'); link.href = result.url;
      highlighted(link, result.title, terms); heading.appendChild(link); item.appendChild(heading);
      const snippet = document.createElement('p'); highlighted(snippet, result.snippet, terms); item.appendChild(snippet);
      list.appendChild(item);
    });
    if (terms.length && !results.length) {
      const item = document.createElement('li'); item.className = 'empty-state';
      const title = document.createElement('strong'); title.textContent = '没有找到匹配内容';
      const hint = document.createElement('p'); hint.textContent = '试试更短的关键词，例如“量化”“KV Cache”或“分页”。多个词会共同匹配同一章节。';
      item.append(title, hint); list.appendChild(item);
    }
    more.hidden = results.length <= limit;
    more.textContent = '显示其余 ' + Math.max(0, results.length - limit) + ' 篇';
  }

  function update() {
    limit = 12;
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    render();
    if (input.value.trim() && !failed) loadIndex(false);
  }
  input.disabled = false;
  input.placeholder = '搜索专题、术语或章节';
  input.addEventListener('focus', function () { loadIndex(false); });
  input.addEventListener('input', function () { if (!composing) { clearTimeout(timer); timer = setTimeout(update, 120); } });
  input.addEventListener('compositionstart', function () { composing = true; clearTimeout(timer); });
  input.addEventListener('compositionend', function () { composing = false; update(); });
  form.addEventListener('submit', function (event) {
    event.preventDefault(); clearTimeout(timer); update();
    const first = list.querySelector('h3 a'); if (first) first.focus();
  });
  clear.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
  more.addEventListener('click', function () {
    const next = limit;
    limit = Infinity;
    render();
    const added = list.querySelectorAll('h3 a')[next];
    if (added) added.focus();
  });
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    if (input.value) { input.value = ''; clearTimeout(timer); update(); }
    if (link.closest('.stage-nav, .mobile-nav')) {
      document.querySelectorAll('.stage-nav a, .mobile-nav a').forEach(function (item) {
        if (item.getAttribute('href') === link.getAttribute('href')) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    }
  });
  document.addEventListener('keydown', function (event) {
    const target = event.target;
    const editing = target.matches('input,textarea,select') || target.isContentEditable;
    if ((event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault(); input.focus(); input.select();
    }
    if (event.key === 'Escape' && target === input) { input.value = ''; clearTimeout(timer); update(); }
  });
  input.value = (new URL(location.href).searchParams.get('q') || '').slice(0, 160);
  update();
}());
