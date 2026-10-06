// Diagnosis koneksi ke api.anthropic.com TANPA tagihan: DNS lookup + 3x POST berbadan penuh (instruksi sistem + tool) dengan
// model yang tidak ada -> 404 not_found_error (tidak ditagih). Mengukur waktu & galat per percobaan.
import 'dotenv/config';
import dns from 'node:dns/promises';
import { INSTRUKSI_SISTEM } from '../../../lib/ai/saranBerita.js';
import { toolWebSearch } from '../../../lib/ai/anthropic.js';
console.log(`# diagnosis koneksi Anthropic — ${new Date().toISOString()}`);
try { console.log('dns.lookup api.anthropic.com:', JSON.stringify(await dns.lookup('api.anthropic.com', { all: true }))); } catch (g) { console.log('dns.lookup GAGAL:', g.message); }
const badan = { model: 'claude-model-tidak-ada', max_tokens: 12000, system: INSTRUKSI_SISTEM, tools: [toolWebSearch(8)], messages: [{ role: 'user', content: 'Tanggal hari ini: 7 Oktober 2026 (WIB).\nTopik yang diminta redaksi: "banjir"\n\nRiset berita terkini di Indonesia tentang topik itu, lalu kembalikan array JSON berisi 2 sampai 3 draf sesuai instruksi.' }] };
console.log('ukuran badan:', JSON.stringify(badan).length, 'byte');
for (let i = 1; i <= 3; i++) {
  const t0 = Date.now();
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify(badan) });
    const j = await r.json().catch(() => ({}));
    console.log(`percobaan ${i}: HTTP ${r.status} ${j?.error?.type || ''} "${(j?.error?.message || '').slice(0, 80)}" dalam ${Date.now() - t0} ms; request-id ${r.headers.get('request-id')}`);
  } catch (g) { console.log(`percobaan ${i}: GAGAL ${g.message} <- ${g.cause?.message || ''} (${g.cause?.code || ''}) dalam ${Date.now() - t0} ms`); }
}
