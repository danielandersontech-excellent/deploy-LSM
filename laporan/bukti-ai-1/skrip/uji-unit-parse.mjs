#!/usr/bin/env node
// RUN AI-1 E — uji unit parser/validasi/sanitasi saran AI (TANPA panggilan Anthropic; lib dipanggil langsung).
//   1. validasiTopik: 2 karakter -> tolak; 121 karakter -> tolak; tag HTML & karakter kontrol dibuang
//   2. ekstrakArrayJson: pagar ```json dibuang; teks pengantar sebelum '[' diabaikan; JSON terpotong -> objek utuh selamat
//   3. validasiSaran: <script>/<iframe>/onerror/style dibuang (KEEP_CONTENT), tag daftar putih tetap
//   4. penjaga badan-bersih: <a href> -> DITOLAK; "https://" di teks -> DITOLAK; "www.contoh.id" -> DITOLAK; bagian "Sumber:" -> DITOLAK
//   5. kategoriSlug ngawur -> 'nasional' + catatan; tag > 5 dipotong; kueriGambar kosong -> judul; sumberRiset non-http dibuang
//   6. teksJawabanAkhir: hanya teks SETELAH web_search_tool_result terakhir; hasilPencarianDari mengumpulkan url unik
//   7. mode tiruan tidak aktif bila NEXT_PUBLIC_APP_URL = domain produksi
import { validasiTopik, ekstrakArrayJson, validasiSaran, sanitasiBadanAi, alasanBadanKotor, teksJawabanAkhir, hasilPencarianDari, modeTiruanAktif } from '../../../lib/ai/saranBerita.js';

let no = 0, gagal = 0;
const uji = (nama, fn) => { no++; try { const h = fn(); console.log(`  ${String(no).padStart(2)}. ${nama} -> ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${nama} -> GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const isiPanjang = (ekstra = '') => `<p>${'Kalimat berita yang cukup panjang untuk melewati ambang tiga ratus karakter teks polos. '.repeat(5)}</p><h2>Sub</h2><ul><li>Butir satu</li><li>Butir dua</li></ul>${ekstra}`;
const dasar = { judul: 'Judul berita uji yang valid', ringkasan: 'Ringkasan uji', isiHtml: isiPanjang(), kategoriSlug: 'daerah', tag: ['a', 'b'], kueriGambar: ['flood street', 'rain'], catatanVerifikasi: ['Cek angka'], sumberRiset: [{ judul: 'S1', url: 'https://contoh.go.id/x' }] };

console.log(`# RUN AI-1 E — uji unit parser/validasi/sanitasi — ${new Date().toISOString()}`);
uji('validasiTopik menolak 2 karakter', () => { let e; try { validasiTopik('ab'); } catch (g) { e = g; } wajib(e?.kode === 'TOPIK_PENDEK', `kode ${e?.kode}`); return 'TOPIK_PENDEK (422)'; });
uji('validasiTopik menolak 121 karakter', () => { let e; try { validasiTopik('x'.repeat(121)); } catch (g) { e = g; } wajib(e?.kode === 'TOPIK_PANJANG', `kode ${e?.kode}`); return 'TOPIK_PANJANG (422)'; });
uji('validasiTopik membuang tag HTML, karakter kontrol, spasi ganda', () => { const t = validasiTopik('  banjir <b>Jakarta</b>\u0007   2026 '); wajib(t === 'banjir Jakarta 2026', `hasil "${t}"`); return `"${t}"`; });

uji('ekstrakArrayJson: pagar markdown + teks pengantar dibuang', () => {
  const { daftar, terpotong } = ekstrakArrayJson('Berikut hasilnya:\n```json\n[{"judul":"A"},{"judul":"B"}]\n```');
  wajib(daftar.length === 2 && daftar[1].judul === 'B' && !terpotong, JSON.stringify(daftar)); return '2 objek, terpotong=false';
});
uji('ekstrakArrayJson: JSON terpotong (max_tokens) -> objek utuh diselamatkan, yang terpotong dibuang', () => {
  const { daftar, terpotong } = ekstrakArrayJson('[{"judul":"A","isiHtml":"<p>x \\"kutip\\" }]</p>"},{"judul":"B","isiHtml":"<p>belum sele');
  wajib(daftar.length === 1 && daftar[0].judul === 'A' && terpotong, JSON.stringify({ daftar, terpotong })); return '1 objek utuh, terpotong=true';
});
uji('ekstrakArrayJson: tanpa array -> kosong', () => { const r = ekstrakArrayJson('Maaf, tidak ada.'); wajib(r.daftar.length === 0, 'tidak kosong'); return 'daftar kosong'; });

uji('sanitasi: <script>, <iframe>, onerror, style, <img>, <table> dibuang; p/h2/ul/li/strong/blockquote tetap', () => {
  const hasil = sanitasiBadanAi('<p onclick="x()">A <strong>B</strong></p><script>alert(1)</script><iframe src="https://j.example"></iframe><img src="x" onerror="alert(2)"><style>p{}</style><h2>H</h2><blockquote>Q</blockquote><table><tr><td>T</td></tr></table><ul><li>L</li></ul>');
  wajib(!/<(script|iframe|img|style|table|tr|td)/i.test(hasil) && !/onclick|onerror/i.test(hasil), hasil);
  wajib(/<p>A <strong>B<\/strong><\/p>/.test(hasil) && /<h2>H<\/h2>/.test(hasil) && /<blockquote>Q<\/blockquote>/.test(hasil) && /<ul><li>L<\/li><\/ul>/.test(hasil), hasil);
  return hasil.replace(/\s+/g, ' ').slice(0, 120);
});
uji('penjaga badan-bersih: <a href> -> ditolak', () => { const r = validasiSaran({ ...dasar, isiHtml: isiPanjang('<p>Baca di <a href="https://m.example/x">sini</a></p>') }); wajib(r.tolak && /<a>/.test(r.tolak), JSON.stringify(r.tolak)); return r.tolak; });
uji('penjaga badan-bersih: "https://" di teks -> ditolak', () => { const r = validasiSaran({ ...dasar, isiHtml: isiPanjang('<p>Lihat https://contoh.id/berita</p>') }); wajib(r.tolak && /URL/.test(r.tolak), JSON.stringify(r.tolak)); return r.tolak; });
uji('penjaga badan-bersih: "www.contoh.id" -> ditolak', () => { const r = validasiSaran({ ...dasar, isiHtml: isiPanjang('<p>Kunjungi www.contoh.id untuk info</p>') }); wajib(r.tolak && /URL/.test(r.tolak), JSON.stringify(r.tolak)); return r.tolak; });
uji('penjaga badan-bersih: bagian "Sumber:" -> ditolak', () => { const r = validasiSaran({ ...dasar, isiHtml: isiPanjang('<p>Sumber: siaran pers kementerian dan media</p>') }); wajib(r.tolak && /Sumber/.test(r.tolak), JSON.stringify(r.tolak)); return r.tolak; });
uji('alasanBadanKotor pada badan bersih -> null', () => { const b = isiPanjang(); wajib(alasanBadanKotor(b, sanitasiBadanAi(b)) === null, 'tidak null'); return 'null (bersih)'; });
uji('atribusi jurnalistik ("menurut Kepala BPBD") TIDAK ditolak', () => { const r = validasiSaran({ ...dasar, isiHtml: isiPanjang('<p>Menurut Kepala BPBD, air surut. Berdasarkan keterangan tertulis Kementerian PUPR, tanggul diperbaiki.</p>') }); wajib(r.muatan, JSON.stringify(r)); return 'diterima'; });

uji('validasiSaran: muatan bersih lengkap', () => {
  const r = validasiSaran({ ...dasar, isiHtml: isiPanjang('<script>alert(1)</script>') });
  wajib(r.muatan && !/<script/.test(r.muatan.isiHtml), JSON.stringify(r).slice(0, 200));
  wajib(r.muatan.kategoriSlug === 'daerah' && r.muatan.tag.length === 2 && r.muatan.sumberRiset.length === 1 && r.muatan.kueriGambar.length === 2, JSON.stringify(r.muatan).slice(0, 300));
  return `kategori=${r.muatan.kategoriSlug} tag=${r.muatan.tag.length} kueri=${r.muatan.kueriGambar.length} sumber=${r.muatan.sumberRiset.length} script dibuang`;
});
uji('kategoriSlug ngawur -> nasional + catatan di depan', () => { const r = validasiSaran({ ...dasar, kategoriSlug: 'teknologi' }); wajib(r.muatan?.kategoriSlug === 'nasional' && /tidak dikenal/.test(r.muatan.catatanVerifikasi[0]), JSON.stringify(r.muatan?.catatanVerifikasi)); return `nasional; catatan[0]="${r.muatan.catatanVerifikasi[0].slice(0, 60)}"`; });
uji('tag > 5 dipotong, kueriGambar kosong -> judul, sumber non-http dibuang, catatan kosong -> bawaan', () => {
  const r = validasiSaran({ ...dasar, tag: ['1', '2', '3', '4', '5', '6', '7'], kueriGambar: [], catatanVerifikasi: [], sumberRiset: [{ judul: 'x', url: 'javascript:alert(1)' }, { judul: 'y', url: 'ftp://a' }, { judul: 'z', url: 'https://ok.id/a' }, { judul: 'z2', url: 'https://ok.id/a' }] });
  wajib(r.muatan.tag.length === 5 && r.muatan.kueriGambar[0] === dasar.judul && r.muatan.sumberRiset.length === 1 && r.muatan.catatanVerifikasi.length === 1, JSON.stringify(r.muatan).slice(0, 400));
  return `tag=5 kueri=["${r.muatan.kueriGambar[0]}"] sumber=1 (javascript:/ftp:/duplikat dibuang) catatan bawaan`;
});
uji('isi terlalu pendek (< 300 karakter) -> ditolak', () => { const r = validasiSaran({ ...dasar, isiHtml: '<p>Pendek.</p>' }); wajib(r.tolak && /pendek/.test(r.tolak), JSON.stringify(r)); return r.tolak; });

uji('teksJawabanAkhir: hanya teks setelah web_search_tool_result terakhir', () => {
  const konten = [{ type: 'text', text: 'Saya akan mencari [dulu].' }, { type: 'server_tool_use', name: 'web_search', input: { query: 'q' } }, { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://a.id/1', title: 'A' }, { type: 'web_search_result', url: 'https://a.id/1', title: 'A dup' }, { type: 'web_search_result', url: 'https://b.id/2', title: 'B' }] }, { type: 'text', text: '[{"judul":' }, { type: 'text', text: '"X"}]' }];
  const t = teksJawabanAkhir(konten); wajib(t === '[{"judul":"X"}]', t);
  const h = hasilPencarianDari(konten); wajib(h.length === 2 && h[0].url === 'https://a.id/1', JSON.stringify(h));
  return `teks="${t}"; hasil pencarian unik=${h.length}`;
});
uji('K2: em/en dash dari AI dinormalkan (angka: "2020–2024" -> "2020-2024"; teks: " — " -> ", ") pada judul, isi, catatan', () => {
  const r = validasiSaran({ ...dasar, judul: 'Banjir Solok — ratusan warga mengungsi', isiHtml: isiPanjang('<p>Periode 2020–2024 tercatat – menurut BPBD – naik.</p>'), catatanVerifikasi: ['Cek angka — beda sumber'] });
  wajib(r.muatan, JSON.stringify(r));
  const semua = `${r.muatan.judul} ${r.muatan.isiHtml} ${r.muatan.catatanVerifikasi.join(' ')}`;
  wajib(!/[–—]/.test(semua), `masih ada dash: ${semua.slice(0, 200)}`);
  wajib(r.muatan.judul === 'Banjir Solok, ratusan warga mengungsi' && /2020-2024/.test(r.muatan.isiHtml) && /tercatat, menurut BPBD, naik/.test(r.muatan.isiHtml), `judul="${r.muatan.judul}" isi="${r.muatan.isiHtml.slice(-120)}"`);
  return `judul="${r.muatan.judul}"; isi ...${r.muatan.isiHtml.slice(-70)}`;
});
uji('mode tiruan: AI_TIRUAN=1 + NEXT_PUBLIC_APP_URL produksi -> TIDAK aktif', () => {
  const l = { a: process.env.AI_TIRUAN, u: process.env.NEXT_PUBLIC_APP_URL };
  process.env.AI_TIRUAN = '1'; process.env.NEXT_PUBLIC_APP_URL = 'https://warkopnusantara.id';
  const prod = modeTiruanAktif();
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  const lokal = modeTiruanAktif();
  process.env.AI_TIRUAN = l.a; process.env.NEXT_PUBLIC_APP_URL = l.u;
  wajib(prod === false && lokal === true, `prod=${prod} lokal=${lokal}`); return 'produksi=false, lokal=true';
});

console.log(`\nRINGKASAN unit parse: ${no} butir, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(gagal ? 1 : 0);
