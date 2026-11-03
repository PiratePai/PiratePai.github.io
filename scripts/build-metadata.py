"""Build article dates, scoped change records, SEO metadata and the sitemap.

Edit data/articles.json; dates are editorial data, never the build clock.
"""
import argparse
from datetime import date
from html import escape
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

from site_assets import ROOT, asset_url, preserve_line_endings


def block(source, name, content, before):
    start, end = f'<!-- {name}:start -->', f'<!-- {name}:end -->'
    generated = f'{start}\n{content}\n{end}'
    if start in source:
        return re.sub(re.escape(start) + '.*?' + re.escape(end), lambda _: generated, source, flags=re.S)
    if before not in source:
        raise ValueError(f'Missing insertion point: {before}')
    return source.replace(before, generated + '\n' + before, 1)


def load_metadata():
    data = json.loads((ROOT / 'data/articles.json').read_text(encoding='utf-8'))
    if set(data['articles']) != {p.stem for p in (ROOT / 'posts').glob('*.html')}:
        raise ValueError('Metadata must cover every article exactly once')
    for slug, item in data['articles'].items():
        for field in ('published', 'contentUpdated', 'reviewed'):
            date.fromisoformat(item[field])
        if not item['published'] <= item['contentUpdated'] or item['reviewed'] > item['contentUpdated']:
            raise ValueError(f'Inconsistent dates: {slug}')
        if item['contentUpdated'] != max(change['date'] for change in item['changes']):
            raise ValueError(f'Content date must match a change record: {slug}')
        for change in item['changes']:
            date.fromisoformat(change['date'])
            source = (ROOT / 'posts' / (slug + '.html')).read_text(encoding='utf-8')
            if not re.search(r'\bid=["\x27]' + re.escape(change['anchor']) + r'["\x27]', source):
                raise ValueError(f'Missing change anchor: {slug}#{change["anchor"]}')
            if not (ROOT / change['evidence']).is_file():
                raise ValueError(f'Missing change evidence: {change["evidence"]}')
    return data


def seo(data, item=None, slug=None):
    site = data['siteUrl']
    url = site + (f'/posts/{slug}.html' if slug else '/')
    title = item['title'] if item else "Pai's Blog · 大模型效率技术知识全景"
    description = item['description'] if item else f'{len(data["articles"])} 篇中文大模型效率技术综述：从注意力、缓存与解码，到并行、服务、性能验证、推理预算与 Agent 系统。按阅读路线、实际问题或最近更新进入专题。'
    schema = {'@context': 'https://schema.org', '@type': 'BlogPosting' if item else 'WebSite',
              'name': title, 'url': url, 'description': description, 'inLanguage': 'zh-CN'}
    if item:
        schema.update(headline=title, datePublished=item['published'], dateModified=item['contentUpdated'],
                      author={'@type': 'Person', 'name': 'PiratePai', 'url': 'https://github.com/PiratePai'},
                      image=site + '/assets/social-card.png', mainEntityOfPage=url)
    tags = [('name', 'description', description), ('property', 'og:type', 'article' if item else 'website'),
            ('property', 'og:title', title), ('property', 'og:description', description),
            ('property', 'og:url', url), ('property', 'og:site_name', "Pai's Blog"),
            ('property', 'og:locale', 'zh_CN'), ('property', 'og:image', site + '/assets/social-card.png'),
            ('property', 'og:image:width', '1200'), ('property', 'og:image:height', '630'),
            ('property', 'og:image:alt', "Pai's Blog，大模型效率技术综述"),
            ('name', 'twitter:card', 'summary_large_image')]
    if item:
        tags += [('property', 'article:published_time', item['published']),
                 ('property', 'article:modified_time', item['contentUpdated'])]
    return ('\n'.join(f'<meta {kind}="{name}" content="{escape(value, quote=True)}">' for kind, name, value in tags)
            + f'\n<link rel="canonical" href="{url}">\n'
            + '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>')


def maintenance(item, slug):
    dates = ' <span aria-hidden="true">·</span> '.join(
        f'<span>{label} <time datetime="{item[key]}">{item[key]}</time></span>'
        for label, key in [('首次发布', 'published'), ('内容更新', 'contentUpdated'), ('最近核验', 'reviewed')])
    changes = ''.join(f'<li><time datetime="{c["date"]}">{c["date"]}</time> · {escape(c["kind"])}：'
                      f'<a href="#{c["anchor"]}">{escape(c["summary"])}</a> '
                      f'<a href="https://github.com/PiratePai/PiratePai.github.io/blob/main/{c["evidence"]}">范围说明</a></li>'
                      for c in item['changes'])
    history = (f'https://github.com/PiratePai/PiratePai.github.io/commit/{item["publicationCommit"]}'
               if item.get('publicationCommit') else f'https://github.com/PiratePai/PiratePai.github.io/commits/main/posts/{slug}.html')
    return (f'<div class="article-maintenance"><div class="article-dates">{dates}</div>'
            '<details id="article-history"><summary>变更记录与核验范围</summary>'
            '<p>核验日期只对应以下记录中的资料，不表示全文所有历史结论均已重新核验。'
            '论文报告、源码核对与独立复现，以正文各处的说明为准。</p>'
            f'<ul>{changes}</ul><p>首次发布以<a href="{history}">本仓库首次收录</a>为准；原稿日期与历史实验快照保留在正文。</p>'
            '</details></div>')


def build():
    data = load_metadata()
    outputs = {}
    for slug, item in data['articles'].items():
        path = ROOT / 'posts' / (slug + '.html')
        source = path.read_text(encoding='utf-8')
        source = re.sub(r'<title>.*?</title>', lambda _: '<title>' + escape(item['title']) + '</title>', source, count=1, flags=re.S)
        source = block(source, 'site-metadata', seo(data, item, slug), '</head>')
        source = block(source, 'article-maintenance', maintenance(item, slug), '</header>')
        outputs[path] = source
    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    # Old manually maintained description is superseded by the generated block.
    home = re.sub(r'<meta name="description"[^>]*>\s*', '', home, count=1) if '<!-- site-metadata:start -->' not in home else home
    home = block(home, 'site-metadata', seo(data), '</head>')
    groups = {}
    for slug, item in data['articles'].items():
        for change in item['changes']:
            groups.setdefault(change['date'], []).append((slug, item, change))
    updates = '<p>日期对应具体改动；展开后可直接到修改章节。页面维护不改变研究资料的核验日期。</p>'
    for day, entries in sorted(groups.items(), reverse=True):
        label = '专题新增与内容修订' if any(c['kind'] == '新增专题' for _, _, c in entries) else '内容更新'
        article_count = len({slug for slug, _, _ in entries})
        updates += f'<details class="update-group"><summary><time datetime="{day}">{day}</time> · {label} · {article_count} 篇</summary><ul>'
        for slug, item, change in entries:
            updates += f'<li><a href="posts/{slug}.html#{change["anchor"]}">{escape(item["title"])}</a><span>{escape(change["summary"])}</span></li>'
        updates += '</ul></details>'
    home = block(home, 'recent-updates', updates, '</main>')
    for slug, item in data['articles'].items():
        pattern = r'(<article class="article-entry" id="article-' + re.escape(slug) + r'">)(.*?)(</article>)'
        def update(match):
            body = re.sub(r'<p class="article-foot">.*?</p>', '', match[2], flags=re.S)
            foot = f'<p class="article-foot">内容更新 <time datetime="{item["contentUpdated"]}">{item["contentUpdated"]}</time> · <a href="posts/{slug}.html#article-history">变更记录</a></p>'
            return match[1] + body + foot + match[3]
        home = re.sub(pattern, update, home, flags=re.S)
    for asset in ('assets/reading-theme.css', 'assets/site.css', 'scripts/site-search.js'):
        home = re.sub(r'((?:href|src)=")' + re.escape(asset) + r'(?:\?[^" ]*)?"',
                      lambda m: m[1] + asset_url(asset, '') + '"', home)
    outputs[ROOT / 'index.html'] = home
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', ns)
    sitemap = ET.Element(f'{{{ns}}}urlset')
    for path, modified in [('/', data['siteUpdated'])] + [(f'/posts/{slug}.html', item['contentUpdated']) for slug, item in data['articles'].items()]:
        url = ET.SubElement(sitemap, 'url')
        ET.SubElement(url, 'loc').text = data['siteUrl'] + path
        ET.SubElement(url, 'lastmod').text = modified
    ET.indent(sitemap, space='  ')
    outputs[ROOT / 'sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(sitemap, encoding='unicode') + '\n'
    outputs[ROOT / 'robots.txt'] = f'User-agent: *\nAllow: /\n\nSitemap: {data["siteUrl"]}/sitemap.xml\n'
    return outputs


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    changed = []
    for path, content in build().items():
        if not path.exists() or path.read_text(encoding='utf-8') != content:
            changed.append(str(path.relative_to(ROOT)))
            if not args.check:
                raw = path.read_bytes().decode('utf-8') if path.exists() else ''
                path.write_bytes(preserve_line_endings(raw, content).encode('utf-8'))
    if args.check and changed:
        raise SystemExit('Metadata is stale: ' + ', '.join(changed))
    print(f'{"CHECK" if args.check else "BUILD"} metadata, dates and sitemap: {len(changed)} changed')
