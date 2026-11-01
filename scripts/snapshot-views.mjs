// Snapshot the PiratePai profile-views counter (komarev.com, the same counter shown
// on the GitHub profile README and repo READMEs like CurveMEF) once a day into views.json.
// Runs inside GitHub Actions (see .github/workflows/snapshot-views.yml).
import { readFileSync, writeFileSync } from 'node:fs';

const res = await fetch('https://komarev.com/ghpvc/?username=PiratePai');
const svg = await res.text();
// The count is the last <text> node of the shields-style SVG badge.
const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim());
const count = Number(texts[texts.length - 1]);
if (!Number.isFinite(count) || count <= 0) throw new Error('komarev parse failed: ' + svg.slice(0, 200));

// Use the Beijing-time calendar date for the snapshot label.
const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

let data = { series: [] };
try { data = JSON.parse(readFileSync('views.json', 'utf8')); } catch { /* first run */ }
data.series = (data.series || []).filter((x) => x.date !== today);
data.series.push({ date: today, pv: count });
if (data.series.length > 3650) data.series = data.series.slice(-3650);

writeFileSync('views.json', JSON.stringify(data, null, 2) + '\n');
console.log(`snapshot ${today}: profile_views=${count}`);
