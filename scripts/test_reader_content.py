"""Reader publication contracts: stable links, numbering and semantic SVG colors."""
import importlib.util
from pathlib import Path
import re
import unittest
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('reader_build', ROOT / 'scripts/build-reader.py')
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)


class ReaderContentTests(unittest.TestCase):
    def test_lists_and_image_attributes_keep_their_semantics(self):
        class Structure(HTMLParser):
            def __init__(self):
                super().__init__()
                self.stack = []
                self.errors = []

            def handle_starttag(self, tag, attrs):
                line = self.getpos()[0]
                if self.stack and self.stack[-1] in ('ul', 'ol') and tag not in ('li', 'script', 'template'):
                    self.errors.append((line, 'list child', tag))
                if tag == 'img':
                    allowed = {'src', 'srcset', 'sizes', 'alt', 'title', 'loading', 'decoding',
                               'fetchpriority', 'width', 'height', 'style', 'class', 'id',
                               'role', 'crossorigin', 'referrerpolicy'}
                    for key, value in attrs:
                        if (key not in allowed and not key.startswith(('data-', 'aria-'))) or value is None:
                            self.errors.append((line, 'image attribute', key))
                    if dict(attrs).get('alt') is None:
                        self.errors.append((line, 'missing image alt'))
                if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                               'link', 'meta', 'param', 'source', 'track', 'wbr'}:
                    self.stack.append(tag)

            def handle_endtag(self, tag):
                if tag in self.stack:
                    self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

        for path in sorted((ROOT / 'posts').glob('*.html')):
            with self.subTest(article=path.name):
                parser = Structure()
                parser.feed(path.read_text(encoding='utf-8'))
                self.assertEqual(parser.errors, [])

    def test_paragraphs_end_before_block_elements(self):
        # Browsers silently repair these errors, while source parsers can swallow
        # a whole appendix into one paragraph and break indexing/pagination.
        class Paragraphs(HTMLParser):
            def __init__(self):
                super().__init__()
                self.paragraph = None
                self.errors = []

            def handle_starttag(self, tag, attrs):
                if self.paragraph and tag in {
                    'p', 'div', 'ul', 'ol', 'li', 'table', 'section',
                    'h1', 'h2', 'h3', 'h4', 'pre', 'blockquote', 'details',
                }:
                    self.errors.append((self.paragraph, self.getpos()[0], tag))
                    self.paragraph = None
                if tag == 'p':
                    self.paragraph = self.getpos()[0]

            def handle_endtag(self, tag):
                if tag == 'p':
                    self.paragraph = None

        for path in sorted((ROOT / 'posts').glob('*.html')):
            with self.subTest(article=path.name):
                parser = Paragraphs()
                parser.feed(path.read_text(encoding='utf-8'))
                self.assertEqual(parser.errors, [], 'paragraph line, block line, tag')

    def test_numbered_chapters_are_contiguous(self):
        for slug in ('kv-cache-survey', 'inference-serving', 'parallelism-survey',
                     'quantization-survey', 'speculative-decoding'):
            with self.subTest(slug=slug):
                source = (ROOT / 'posts' / (slug + '.html')).read_text(encoding='utf-8')
                numbers = [int(n) for n in re.findall(
                    r'<h2\b[^>]*>\s*<span class="(?:no|num)">(\d+)</span>', source)]
                self.assertTrue(numbers)
                self.assertEqual(numbers, list(range(numbers[0], numbers[-1] + 1)))

    def test_historical_links_keep_their_subject(self):
        for slug, anchor, title in (
            ('kv-cache-survey', 's11', '未来发展方向'),
            ('kv-cache-survey', 's12', '动手实验'),
            ('inference-serving', 's10', '未来发展方向'),
            ('quantization-survey', 's10', '未来发展方向'),
            ('quantization-survey', 's11', '术语速查表'),
            ('speculative-decoding', 'future', '未来发展方向'),
            ('speculative-decoding', 'summary', '一张表总结所有方法'),
        ):
            with self.subTest(slug=slug, anchor=anchor):
                source = (ROOT / 'posts' / (slug + '.html')).read_text(encoding='utf-8')
                heading = re.search(r'<h2\b[^>]*\bid="' + anchor + r'"[^>]*>(.*?)</h2>', source, re.S)
                self.assertIsNotNone(heading)
                self.assertIn(title, heading[1])
        for slug, anchor in (
            ('inference-serving', 's9-content'), ('quantization-survey', 's9-content'),
            ('parallelism-survey', 'ch10-content'), ('vit-sparsification', 's6-content'),
            ('spec-decoding-post-training', 'latest-content'),
        ):
            source = (ROOT / 'posts' / (slug + '.html')).read_text(encoding='utf-8')
            with self.subTest(slug=slug, anchor=anchor):
                self.assertEqual(source.count('id="' + anchor + '"'), 1)

    def test_semantic_points_use_foreground_without_recoloring_backgrounds(self):
        source = '<svg viewBox="0 0 100 100"><rect fill="#6ea8ff"/><circle data-diagram-point="blue" fill="#6ea8ff"/></svg>'
        result = reader.style_diagrams(source, 'example')
        self.assertIn('<rect fill="var(--d-blue-soft)"', result)
        self.assertIn('data-diagram-point="blue" fill="var(--d-blue)"', result)
        self.assertEqual(reader.style_diagrams(result, 'example'), result)


if __name__ == '__main__':
    unittest.main()
