// Fetch site PV/UV from busuanzi and append a daily snapshot to views.json.
// Runs inside GitHub Actions (see .github/workflows/snapshot-views.yml).
import { readFileSync, writeFileSync } from 'node:fs';

const res = await fetch('https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback', {
  headers: { Referer: 'https://piratepai.github.io/' },
});
const text = await res.text();
const m = text.match(/BusuanziCallback\((\{.*\})\)/);
if (!m) throw new Error('busuanzi response parse failed: ' + text.slice(0, 200));
const d = JSON.parse(m[1]);

// Use the Beijing-time calendar date for the snapshot label.
const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

let data = { series: [] };
try { data = JSON.parse(readFileSync('views.json', 'utf8')); } catch { /* first run */ }
data.series = (data.series || []).filter((x) => x.date !== today);
data.series.push({ date: today, pv: Number(d.site_pv) || 0, uv: Number(d.site_uv) || 0 });
if (data.series.length > 3650) data.series = data.series.slice(-3650);

writeFileSync('views.json', JSON.stringify(data, null, 2) + '\n');
console.log(`snapshot ${today}: site_pv=${d.site_pv} site_uv=${d.site_uv}`);
