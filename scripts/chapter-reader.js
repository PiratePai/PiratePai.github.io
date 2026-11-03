/* Progressive reader: semantic pages inside each chapter, full HTML fallback. */
(function () {
  'use strict';
  const guide = document.getElementById('reading-path');
  const originalTOC = document.querySelector('.toc');
  if (!guide || !originalTOC) return;
  const root = guide.parentElement;
  const html = document.documentElement;
  root.classList.add('reader-content');
  let theme = 'paper';
  try { theme = localStorage.getItem('reader-theme') === 'dark' ? 'dark' : 'paper'; } catch (_) {}
  html.dataset.readerTheme = theme;
  document.querySelectorAll('a[href="../index.html"]').forEach(a => {
    if (a.parentElement.style.position === 'fixed') a.parentElement.classList.add('reader-legacy-home');
  });
  const chapters = [], pages = [], flows = [];
  let pageSerial = 0;
  const mobile = matchMedia('(max-width:980px)');
  const clean = node => node.textContent.replace(/\s+/g, ' ').trim();
  function label(node) {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('sup,.roadmap,.sub').forEach(n => n.remove());
    copy.querySelectorAll('.no,.num').forEach(n => n.after(document.createTextNode(' ')));
    return clean(copy);
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function link(text, id, className) {
    const a = element('a', className, text);
    a.href = '#' + encodeURIComponent(id);
    return a;
  }
  // Keep the original nodes, IDs and demo listeners; only add reading containers.
  const start = document.getElementById('evidence-scope') || guide;
  let collecting = false, chapter, pending = [];
  function newChapter(id, title, before) {
    const node = element('section', 'reader-chapter');
    node.setAttribute('aria-label', title);
    root.insertBefore(node, before);
    chapter = {id, title, node, pages:[]};
    chapters.push(chapter);
    if (id !== 'reading-path') { pending.forEach(n => node.append(n)); pending = []; }
  }
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === 1 && node.matches('span.anchor')) { pending.push(node); continue; }
    if (node === start) collecting = true;
    if (!collecting || node === originalTOC) continue;
    let heading = null;
    if (node.nodeType === 1) {
      if (node.matches('h2[id]')) heading = node;
      else if (node.matches('section[id]:not(#reading-path)')) heading = node.querySelector('h2');
      else if (node.matches('footer.foot')) {
        node.id = node.id || 'reader-references'; heading = node.querySelector('h3');
      }
    }
    if (!chapter) newChapter('reading-path', '阅读导引', node);
    if (heading) newChapter(node.id || heading.id, label(heading), node);
    chapter.node.append(node);
  }
  pending.forEach(n => chapter.node.append(n));
  // Legacy MoE aliases sN refer to headings chN, including the reference chapter.
  root.querySelectorAll('span.anchor[id]').forEach(anchor => {
    if (/^s\d+$/.test(anchor.id)) {
      const heading = document.getElementById(anchor.id.replace(/^s/, 'ch'));
      if (heading) heading.before(anchor);
    }
  });

  function weight(node) {
    if (node.nodeType !== 1) return node.nodeType === 3 ? node.textContent.trim().length : 0;
    if (node.matches('script,style')) return 0;
    const copy = node.cloneNode(true);
    copy.querySelectorAll('script,style,details:not([open]) > :not(summary)').forEach(n => n.remove());
    return clean(copy).length + copy.querySelectorAll('img,svg,canvas').length * 650;
  }
  // Split long reference/update lists between complete items; retain OL numbering.
  function splitLists(parent) {
    for (const list of Array.from(parent.children)) {
      if (!list.matches('ol,ul') || weight(list) < 5000 || list.children.length < 4) continue;
      const items = Array.from(list.children);
      let chunk = list, used = 0, index = Number(list.getAttribute('start') || 1);
      for (const item of items) {
        const size = weight(item);
        if (used > 2400 && used + size > 3400) {
          const next = list.cloneNode(false); next.removeAttribute('id');
          if (list.tagName === 'OL') next.start = index;
          chunk.after(next); chunk = next; used = 0;
        }
        chunk.append(item); used += size;
        index = item.hasAttribute('value') ? Number(item.value) + 1 : index + 1;
      }
    }
  }
  function splitReferenceTables(parent, owner) {
    if (!/参考|引用出处/.test(owner.title)) return;
    for (const table of Array.from(parent.children)) {
      if (table.tagName !== 'TABLE' || weight(table) < 5000) continue;
      const rows = Array.from(table.rows), headers = rows.filter(r => r.querySelector('th'));
      let chunk = table, used = 0;
      for (const row of rows.filter(r => !headers.includes(r))) {
        const size = weight(row);
        if (used > 2400 && used + size > 3400) {
          const next = table.cloneNode(false); next.removeAttribute('id');
          const head = next.createTHead();
          headers.forEach(r => {
            const repeated = r.cloneNode(true); repeated.setAttribute('data-reader-repeat', '');
            repeated.removeAttribute('id'); repeated.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
            head.append(repeated);
          });
          chunk.after(next); chunk = next; used = 0;
        }
        (chunk.tBodies[0] || chunk.createTBody()).append(row); used += size;
      }
    }
  }
  function paginate(parent, owner) {
    parent.classList.add('reader-flow'); flows.push(parent);
    splitLists(parent); splitReferenceTables(parent, owner);
    let page = null, used = 0, title = owner.title, part = 0, leading = [];
    const nodes = Array.from(parent.childNodes);
    for (const node of nodes) {
      const isElement = node.nodeType === 1;
      // Recurse through structural sections, keeping their IDs and styling intact.
      if (!owner.keepWhole && isElement && node.matches('section,footer.foot,div.grid2,div.refs,div.reflist') && node.querySelector('h2,h3,ol,ul') && weight(node) > 4800) {
        page = null; used = 0;
        paginate(node, owner);
        continue;
      }
      const size = weight(node);
      const heading = isElement && node.matches('h2,h3,h4');
      const attached = isElement && node.matches('figure,.fig,.citebox,.codecap,.cap,script,style');
      if (heading) { title = label(node); part = 0; }
      const boundary = !owner.keepWhole && page && ((heading && used >= 2800) || (!heading && !attached && used >= 2600 && used + size > 5000));
      if (boundary) { page = null; used = 0; }
      if (!page) {
        // Ignore whitespace-only tails instead of creating empty pages.
        if (!size) {
          if (owner.pages.length) owner.pages.at(-1).node.append(node);
          else leading.push(node);
          continue;
        }
        const wrapper = element('div', 'reader-page');
        wrapper.id = 'reader-page-' + (++pageSerial);
        parent.insertBefore(wrapper, node);
        leading.forEach(n => wrapper.append(n)); leading = [];
        part += 1;
        page = {id:wrapper.id, title:title + (part > 1 ? '（续 ' + part + '）' : ''), node:wrapper, chapter:owner};
        pages.push(page); owner.pages.push(page);
      }
      page.node.append(node); used += size;
    }
  }
  chapters.forEach(c => {
    c.keepWhole = weight(c.node) <= 4800;
    paginate(c.node, c);
    // A short remainder should stay with its context, rather than cost a click.
    for (let i = 0; i < c.pages.length - 1;) {
      const previous = c.pages[i], next = c.pages[i + 1];
      const a = weight(previous.node), b = weight(next.node);
      const siblings = previous.node.parentElement === next.node.parentElement;
      const prefix = a < 1000 && previous.node.parentElement.contains(next.node);
      const suffix = b < 1000 && next.node.parentElement.contains(previous.node);
      if ((siblings || prefix || suffix) && Math.min(a, b) < 1400 && a + b <= 7000) {
        if (prefix && !siblings) {
          const alias = element('span'); alias.id = previous.id;
          next.node.prepend(alias, ...Array.from(previous.node.childNodes));
          previous.node.remove(); c.pages.splice(i, 1); pages.splice(pages.indexOf(previous), 1);
          continue;
        }
        const alias = element('span'); alias.id = next.id;
        previous.node.append(alias, ...Array.from(next.node.childNodes));
        next.node.remove(); c.pages.splice(i + 1, 1); pages.splice(pages.indexOf(next), 1);
      } else i += 1;
    }
  });
  if (!pages.length) return;

  // Figures stay expanded with their surrounding explanation, including no-JS HTML.
  const figures = [];
  root.querySelectorAll('img').forEach((img, i) => {
    if (!img.id) img.id = 'reader-figure-' + (i + 1);
    const caption = img.closest('figure')?.querySelector('figcaption');
    figures.push({id:img.id, title:caption ? clean(caption) : img.alt || '论文配图 ' + (i + 1)});
    let ancestor = img.parentElement;
    while (ancestor && ancestor !== root) { if (ancestor.tagName === 'DETAILS') ancestor.open = true; ancestor = ancestor.parentElement; }
  });

  // Preserve readable labels instead of shrinking a wide diagram into a phone.
  // Setup and explicit button clicks only: no resize or animation polling.
  root.querySelectorAll('svg[data-handbook-diagram]').forEach(svg => {
    const box = svg.viewBox.baseVal;
    const sizes = [...svg.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize)).filter(n => n > 0);
    if (!box.width || !sizes.length) return;
    const readable = Math.ceil(box.width * 12 / Math.min(...sizes));
    const viewport = element('div', 'reader-diagram-scroll');
    viewport.style.setProperty('--diagram-readable-width', readable + 'px');
    viewport.tabIndex = 0; viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', '图解，可横向滚动');
    const controls = element('div', 'reader-ui reader-diagram-tools');
    controls.append(element('span', '', '文字保持可读 · 窄屏可左右滑动'));
    const fit = element('button', '', '整图预览'); fit.type = 'button'; fit.setAttribute('aria-pressed', 'false');
    fit.addEventListener('click', () => {
      const fitted = viewport.toggleAttribute('data-fit');
      fit.textContent = fitted ? '恢复可读尺寸' : '整图预览'; fit.setAttribute('aria-pressed', String(fitted));
    });
    controls.append(fit); svg.before(controls, viewport); viewport.append(svg);
  });

  const sidebar = element('aside', 'reader-ui reader-sidebar'); sidebar.id = 'reader-sidebar';
  sidebar.setAttribute('aria-label', '文章目录');
  const head = element('div', 'reader-sidebar-head');
  const identity = element('div', 'reader-identity');
  const home = element('a', 'reader-brand', "Pai's Blog"); home.href = '../index.html';
  home.setAttribute('aria-label', "Pai's Blog · 返回首页");
  identity.append(home, element('p', 'reader-brand-note', '大模型效率技术综述'));
  const close = element('button', '', '收起'); close.type = 'button'; close.setAttribute('aria-label', '收起目录');
  head.append(identity, close);
  const scroll = element('div', 'reader-sidebar-scroll');
  const nav = element('nav'); nav.setAttribute('aria-label', '章节与章内分页');
  const navLinks = [];
  for (const c of chapters) {
    if (!c.pages.length) continue;
    if (c.pages.length === 1) {
      const p = c.pages[0]; p.link = link(c.title, p.id, 'reader-chapter-link');
      navLinks.push(p.link); nav.append(p.link); continue;
    }
    const details = element('details');
    const summary = element('summary', '', c.title + ' · ' + c.pages.length + ' 页');
    details.append(summary); c.nav = details;
    c.pages.forEach((p, i) => {
      p.link = link((i + 1) + '. ' + p.title, p.id, 'reader-page-link');
      navLinks.push(p.link); details.append(p.link);
    });
    nav.append(details);
  }
  const highlights = document.getElementById('hl');
  if (highlights) nav.append(link('近期进展', 'hl'));
  if (figures.length) {
    const gallery = element('details'); gallery.append(element('summary', '', '论文配图 · ' + figures.length + ' 张'));
    figures.forEach((f, i) => gallery.append(link((i + 1) + '. ' + f.title.slice(0, 90), f.id, 'reader-figure-link')));
    nav.append(gallery);
  }
  scroll.append(element('p', 'reader-nav-label', '文章目录'), nav);
  sidebar.append(head, scroll);
  const toolbar = element('div', 'reader-ui reader-toolbar');
  const toggle = element('button', '', '☰ 目录'); toggle.type = 'button'; toggle.setAttribute('aria-controls', sidebar.id);
  const toolbarHome = element('a', 'reader-home', '首页'); toolbarHome.href = '../index.html';
  const status = element('span', 'reader-toolbar-label'); status.setAttribute('aria-live', 'polite');
  const currentTitle = element('span', 'reader-current-title');
  const counter = element('span'); status.append(currentTitle, counter);
  const previousButton = element('a', 'reader-arrow', '←'); previousButton.setAttribute('aria-label', '上一页');
  const nextButton = element('a', 'reader-arrow', '→'); nextButton.setAttribute('aria-label', '下一页'); nextButton.setAttribute('data-reader-next', '');
  const mode = element('button'); mode.type = 'button';
  const themeButton = element('button', 'reader-theme-toggle'); themeButton.type = 'button';
  function showTheme() {
    html.dataset.readerTheme = theme;
    themeButton.textContent = theme === 'dark' ? '☀' : '☾';
    themeButton.setAttribute('aria-label', theme === 'dark' ? '切换为浅色主题' : '切换为深色主题');
    themeButton.title = themeButton.getAttribute('aria-label');
    themeButton.setAttribute('aria-pressed', String(theme === 'paper'));
  }
  themeButton.addEventListener('click', () => {
    theme = theme === 'dark' ? 'paper' : 'dark'; showTheme();
    try { localStorage.setItem('reader-theme', theme); } catch (_) {}
  });
  showTheme();
  toolbar.append(toolbarHome, toggle, previousButton, status, nextButton, themeButton, mode);
  const backdrop = element('button', 'reader-ui reader-backdrop'); backdrop.type = 'button'; backdrop.setAttribute('aria-label', '关闭目录'); backdrop.tabIndex = -1;
  const skip = link('跳到正文', pages[0].id, 'reader-ui reader-skip');
  document.body.append(skip, backdrop, sidebar, toolbar);

  const pagers = [element('nav', 'reader-ui reader-pager')];
  pagers.forEach(p => p.setAttribute('aria-label', '阅读翻页'));
  root.append(pagers[0]);
  let current = pages[0], collapsed = true, full = false;
  function setCollapsed(value, remember, focus) {
    collapsed = value; html.classList.toggle('reader-collapsed', value); sidebar.hidden = value;
    toggle.setAttribute('aria-expanded', String(!value));
    document.body.style.overflow = !value && mobile.matches ? 'hidden' : '';
    if (remember && !mobile.matches) { saved = value; try { localStorage.setItem('reader-sidebar-collapsed', value ? '1' : '0'); } catch (_) {} }
    if (focus) (value ? toggle : close).focus({preventScroll:true});
  }
  let saved = false; try { saved = localStorage.getItem('reader-sidebar-collapsed') === '1'; } catch (_) {}
  toggle.addEventListener('click', () => setCollapsed(!collapsed, true, true));
  close.addEventListener('click', () => setCollapsed(true, true, true));
  backdrop.addEventListener('click', () => setCollapsed(true, false, true));
  mobile.addEventListener('change', () => setCollapsed(mobile.matches || saved, false, false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !collapsed) { setCollapsed(true, true, true); return; }
    if (e.key === 'Tab' && mobile.matches && !collapsed) {
      const focusables = Array.from(sidebar.querySelectorAll('a,button,summary')).filter(n => n.getClientRects().length);
      const first = focusables[0], last = focusables.at(-1);
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });
  function pageFor(target) {
    if (!target) return null;
    return pages.find(p => p.node === target || p.node.contains(target)) || pages.find(p => target.contains(p.node));
  }
  function render(shouldScroll) {
    full = new URL(location.href).searchParams.get('view') === 'all';
    let id = ''; try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) {}
    const target = id ? document.getElementById(id) : null;
    current = pageFor(target) || pages[0];
    pages.forEach(p => { p.node.hidden = !full && p !== current; });
    flows.slice().reverse().forEach(f => { f.hidden = !full && !f.querySelector('.reader-page:not([hidden])'); });
    chapters.forEach(c => {
      c.node.hidden = !full && c !== current.chapter;
      if (c.nav) { c.nav.toggleAttribute('data-reader-active', c === current.chapter); c.nav.open = c === current.chapter; }
    });
    navLinks.forEach(a => a.removeAttribute('aria-current')); current.link.setAttribute('aria-current', 'page');
    const localIndex = current.chapter.pages.indexOf(current);
    currentTitle.textContent = current.chapter.title + ' · ';
    counter.textContent = full ? '全文' : (localIndex + 1) + ' / ' + current.chapter.pages.length;
    status.title = current.title;
    mode.textContent = full ? '分页阅读' : '全文阅读'; mode.setAttribute('aria-pressed', String(full));
    skip.href = '#' + current.id;
    const index = pages.indexOf(current);
    [previousButton, nextButton].forEach((a, i) => {
      const p = pages[index + (i ? 1 : -1)];
      a.hidden = full || !p;
      if (p) { a.href = '#' + p.id; a.title = p.title; }
    });
    pagers.forEach(pager => {
      pager.replaceChildren(); pager.hidden = full;
      const previous = pages[index - 1], next = pages[index + 1];
      pager.append(previous ? link((previous.chapter === current.chapter ? '← 上一页：' : '← 上一章：') + previous.title, previous.id) : element('span', '', '已是首页'));
      pager.append(element('span', 'reader-pager-status', '章内 ' + (localIndex + 1) + ' / ' + current.chapter.pages.length));
      pager.append(next ? link((next.chapter === current.chapter ? '下一页：' : '下一章：') + next.title + ' →', next.id) : element('span', '', '已读至文末'));
    });
    if (target) { let n = target; while (n && n !== root) { if (n.tagName === 'DETAILS') n.open = true; n = n.parentElement; } }
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      if (!collapsed) current.link.scrollIntoView({block:'nearest', behavior:'instant'});
      if (shouldScroll) (target || current.node).scrollIntoView({block:'start', behavior:'instant'});
    });
  }
  mode.addEventListener('click', () => {
    const url = new URL(location.href);
    if (full) url.searchParams.delete('view'); else url.searchParams.set('view', 'all');
    if (!url.hash) url.hash = current.id;
    history.pushState(null, '', url); render(true);
  });
  // Same-anchor clicks must still close a mobile drawer and reveal folded targets.
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    if (mobile.matches && !collapsed) setCollapsed(true, false, false);
    if (url.hash === location.hash) render(true);
  });
  window.addEventListener('hashchange', () => render(true));
  window.addEventListener('popstate', () => render(true));
  html.classList.add('reader-ready'); setCollapsed(mobile.matches || saved, false, false);
  render(Boolean(location.hash));
})();
