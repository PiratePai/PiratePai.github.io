"""Publication contracts: crawlable metadata, real update dates and shared assets."""
from html.parser import HTMLParser
import importlib.util
import json
from pathlib import Path
import struct
import unittest
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('metadata', ROOT / 'scripts/build-metadata.py')
metadata = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metadata)


class Head(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.metas, self.canonicals, self.resources, self.schemas = [], [], [], []
        self.schema = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            self.metas.append(a)
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonicals.append(a['href'])
        if tag == 'script' and a.get('src'):
            self.resources.append(a['src'])
        if tag == 'link' and a.get('rel') == 'stylesheet':
            self.resources.append(a['href'])
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.schema = ''

    def handle_data(self, data):
        if self.schema is not None:
            self.schema += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema))
            self.schema = None


class Updates(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.groups, self.group, self.in_summary = [], None, False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'details':
            self.group = {'titles': [], 'changes': [], 'summary': ''}
            self.groups.append(self.group)
        if self.group is None:
            return
        if tag == 'summary':
            self.in_summary = True
        if tag == 'time':
            self.group['date'] = a['datetime']
        if tag == 'a':
            key = 'titles' if a.get('class') == 'update-title' else 'changes'
            self.group[key].append(a['href'])

    def handle_data(self, data):
        if self.in_summary:
            self.group['summary'] += data

    def handle_endtag(self, tag):
        if tag == 'summary':
            self.in_summary = False
        if tag == 'details':
            self.group = None


class PublicationTests(unittest.TestCase):
    def test_recent_updates_group_articles_without_losing_change_links(self):
        data = metadata.load_metadata()
        source = (ROOT / 'index.html').read_text(encoding='utf-8')
        fragment = source.split('<!-- recent-updates:start -->')[1].split('<!-- recent-updates:end -->')[0]
        actual = Updates(fragment).groups
        days = sorted({c['date'] for a in data['articles'].values() for c in a['changes']}, reverse=True)
        self.assertEqual([g['date'] for g in actual], days)
        for group in actual:
            titles, links = [], []
            for slug, item in data['articles'].items():
                changes = [c for c in item['changes'] if c['date'] == group['date']]
                if changes:
                    titles.append(f'posts/{slug}.html')
                links.extend(f'posts/{slug}.html#{c["anchor"]}' for c in changes)
            with self.subTest(day=group['date']):
                self.assertEqual(group['titles'], titles)
                self.assertEqual(len(group['titles']), len(set(group['titles'])))
                self.assertEqual(group['changes'], links)
                self.assertTrue(group['summary'].endswith(f'· {len(titles)} 篇'))

    def test_multiple_changes_in_one_day_keep_a_single_article_title(self):
        data = {'articles': {'example': {'title': 'A & B', 'changes': [
            {'date': '2026-11-04', 'anchor': 'one', 'kind': '资料核验', 'summary': 'First'},
            {'date': '2026-11-04', 'anchor': 'two', 'kind': '图解排版', 'summary': 'Second'},
            {'date': '2026-11-03', 'anchor': 'old', 'kind': '资料核验', 'summary': 'Older'}]}}}
        groups = Updates(metadata.recent_updates(data)).groups
        self.assertEqual([g['titles'] for g in groups], [['posts/example.html'], ['posts/example.html']])
        self.assertEqual(groups[0]['changes'], ['posts/example.html#one', 'posts/example.html#two'])
        self.assertEqual(groups[1]['changes'], ['posts/example.html#old'])
        self.assertIn('A &amp; B', metadata.recent_updates(data))

    def test_unique_metadata_and_editorial_dates(self):
        data = metadata.load_metadata()
        for slug, item in data['articles'].items():
            source = (ROOT / 'posts' / (slug + '.html')).read_text(encoding='utf-8')
            page = Head(source)
            with self.subTest(slug=slug):
                self.assertEqual([x['content'] for x in page.metas if x.get('name') == 'description'], [item['description']])
                self.assertEqual(page.canonicals, [data['siteUrl'] + '/posts/' + slug + '.html'])
                self.assertEqual(len(page.schemas), 1)
                self.assertEqual(page.schemas[0]['dateModified'], item['contentUpdated'])
                self.assertEqual(page.schemas[0]['datePublished'], item['published'])
                self.assertIn(f'datetime="{item["reviewed"]}"', source)
                self.assertIn('id="article-history"', source)
                self.assertNotIn('data:font/woff2;base64,', source)
                for asset in ('assets/reading-theme.css', 'scripts/chapter-reader.css', 'scripts/chapter-reader.js'):
                    self.assertIn(metadata.asset_url(asset), page.resources)
                self.assertTrue(all(not urlsplit(url).netloc for url in page.resources))

    def test_sitemap_covers_canonical_pages_and_uses_content_dates(self):
        data = metadata.load_metadata()
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        root = ET.parse(ROOT / 'sitemap.xml')
        actual = {n.find('s:loc', ns).text: n.find('s:lastmod', ns).text for n in root.findall('s:url', ns)}
        expected = {data['siteUrl'] + '/': data['siteUpdated']}
        expected.update({data['siteUrl'] + '/posts/' + slug + '.html': a['contentUpdated'] for slug, a in data['articles'].items()})
        self.assertEqual(actual, expected)

    def test_share_image_is_a_real_1200_by_630_png(self):
        image = (ROOT / 'assets/social-card.png').read_bytes()
        self.assertEqual(image[:8], b'\x89PNG\r\n\x1a\n')
        self.assertEqual(struct.unpack('>II', image[16:24]), (1200, 630))

    def test_homepage_routes_and_generated_metadata_work_without_javascript(self):
        source = (ROOT / 'index.html').read_text(encoding='utf-8')
        data = metadata.load_metadata()
        self.assertIn(f'· {len(data["articles"])}篇综述', source)
        for slug in data['articles']:
            self.assertEqual(source.count(f'id="article-{slug}"'), 1)
        self.assertIn('href="posts/attention-evolution.html#reading-path"', source)
        for anchor in ('problems', 'recent-updates', 'knowledge-map', 'all-articles'):
            self.assertIn(f'id="{anchor}"', source)
        self.assertEqual(Head(source).canonicals, ['https://piratepai.github.io/'])
        self.assertIn('data-index-gzip-url="search-index.json.gz?v=', source)


if __name__ == '__main__':
    unittest.main()
