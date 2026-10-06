// lib/gambarBerlisensi.js — MESIN GAMBAR MULTI-SUMBER BERLISENSI (RUN AI-1 butir B).
//
// Semua penyedia diakses lewat API RESMI; DILARANG mutlak mengunduh dari Google Images/situs tak berlisensi.
// Hanya kandidat yang lisensinya SAH TANPA ATRIBUSI yang diterima:
//   (1) Pexels    — Pexels License (bebas dipakai tanpa atribusi)        — aktif bila PEXELS_API_KEY ada
//   (2) Pixabay   — Pixabay Content License (tanpa atribusi)             — aktif bila PIXABAY_API_KEY ada
//   (3) Openverse — api.openverse.org, filter lisensi cc0 + pdm saja     — tanpa kunci
//   (4) Wikimedia Commons — api.php extmetadata; HANYA CC0 / Public domain — tanpa kunci; selain itu DIBUANG
// Alur: untuk tiap kueri (spesifik -> umum) tanya SEMUA penyedia aktif secara paralel -> kumpulkan kandidat
// {url unduh terbesar, lebar, tinggi, penyedia, pembuat, lisensi, urlAsal, judul, tag} -> saring (lisensi sah,
// lebar >= 1200, landscape diutamakan) -> skor relevansi sederhana (kecocokan kata kueri pada judul/tag) + resolusi
// -> pilih 1 terbaik lintas penyedia -> unduh -> simpanGambar (sharp, subfolder 'ai').
// Asal foto (gambar_sumber) disimpan INTERNAL saja — tidak pernah ada label/kredit di artikel maupun tampilan publik.
import { simpanGambar, GalatUnggahan } from './unggahan.js';

export const LEBAR_MIN = 1200;
const UA = 'WarkopNusantaraBot/1.0 (https://warkopnusantara.id; redaksi@warkopnusantara.id)';
const TIMEOUT_CARI_MS = 12_000;
const TIMEOUT_UNDUH_MS = 25_000;
const MAKS_BYTE_UNDUH = 20 * 1024 * 1024;
const PER_HALAMAN = 12;
const MAKS_PERCOBAAN_UNDUH = 4;

const STOPWORD = new Set(['the', 'and', 'with', 'for', 'from', 'into', 'onto', 'over', 'under', 'near', 'this', 'that', 'photo', 'image', 'picture', 'view', 'indonesia', 'indonesian']);

export const LISENSI = Object.freeze({
  pexels: 'Pexels License (bebas, tanpa atribusi)',
  pixabay: 'Pixabay Content License (bebas, tanpa atribusi)',
  cc0: 'CC0 1.0 (domain publik)',
  pdm: 'Public Domain Mark (domain publik)',
  pd: 'Public domain',
});

async function fetchJson(url, { headers = {}, timeoutMs = TIMEOUT_CARI_MS } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json', ...headers }, signal: ac.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// ------------------------------------------------------------------ adaptor per penyedia

/** Pexels: https://api.pexels.com/v1/search — large2x (lebar 1880 untuk landscape) cukup (>= 1200), original bisa puluhan MB. */
async function cariPexels(kueri) {
  const kunci = process.env.PEXELS_API_KEY;
  if (!kunci) return [];
  const j = await fetchJson(`https://api.pexels.com/v1/search?query=${encodeURIComponent(kueri)}&per_page=${PER_HALAMAN}&orientation=landscape`, { headers: { Authorization: kunci } });
  return (j.photos || []).map((p) => {
    const lebar = Number(p.width) || 0, tinggi = Number(p.height) || 0;
    const skala = lebar > 1880 ? 1880 / lebar : 1;
    return {
      penyedia: 'pexels', id: String(p.id), url: p.src?.large2x || p.src?.original, lebar: Math.round(lebar * skala), tinggi: Math.round(tinggi * skala),
      judul: p.alt || '', tag: [], pembuat: p.photographer || '', lisensi: LISENSI.pexels, urlAsal: p.url || '',
    };
  }).filter((k) => k.url);
}

/** Pixabay: https://pixabay.com/api/ — largeImageURL = sisi terpanjang 1280 px (landscape -> lebar 1280 >= 1200). */
async function cariPixabay(kueri) {
  const kunci = process.env.PIXABAY_API_KEY;
  if (!kunci) return [];
  const u = `https://pixabay.com/api/?key=${encodeURIComponent(kunci)}&q=${encodeURIComponent(kueri)}&image_type=photo&orientation=horizontal&min_width=${LEBAR_MIN}&per_page=${PER_HALAMAN}&safesearch=true&lang=en`;
  const j = await fetchJson(u);
  return (j.hits || []).map((h) => {
    const lebar = Number(h.imageWidth) || 0, tinggi = Number(h.imageHeight) || 0;
    const skala = Math.max(lebar, tinggi) > 1280 ? 1280 / Math.max(lebar, tinggi) : 1;
    return {
      penyedia: 'pixabay', id: String(h.id), url: h.largeImageURL, lebar: Math.round(lebar * skala), tinggi: Math.round(tinggi * skala),
      judul: '', tag: String(h.tags || '').split(',').map((t) => t.trim()).filter(Boolean), pembuat: h.user || '', lisensi: LISENSI.pixabay, urlAsal: h.pageURL || '',
    };
  }).filter((k) => k.url);
}

/** Openverse: https://api.openverse.org/v1/images/ — hanya lisensi cc0 dan pdm (filter di permintaan + diperiksa ulang). */
async function cariOpenverse(kueri) {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(kueri)}&license=cc0,pdm&extension=jpg,png&page_size=${PER_HALAMAN}&mature=false`;
  const j = await fetchJson(u);
  return (j.results || []).filter((r) => ['cc0', 'pdm'].includes(String(r.license || '').toLowerCase())).map((r) => ({
    penyedia: 'openverse', id: String(r.id), url: r.url, lebar: Number(r.width) || 0, tinggi: Number(r.height) || 0,
    judul: r.title || '', tag: (r.tags || []).map((t) => t?.name).filter(Boolean), pembuat: r.creator || '', lisensi: LISENSI[String(r.license).toLowerCase()] || r.license, urlAsal: r.foreign_landing_url || '',
    lisensiMentah: String(r.license || '').toLowerCase(),
  })).filter((k) => k.url);
}

/** Lisensi Wikimedia yang diterima: HANYA CC0 atau domain publik (dibaca dari extmetadata License + LicenseShortName). */
export function lisensiWikimediaBebas(extmetadata = {}) {
  const pendek = String(extmetadata?.LicenseShortName?.value || '').trim();
  const kode = String(extmetadata?.License?.value || '').trim().toLowerCase();
  if (/^cc0\b/i.test(pendek) || kode === 'cc0' || kode.startsWith('cc0')) return { bebas: true, lisensi: LISENSI.cc0 };
  if (/^public domain\b/i.test(pendek) || kode === 'pd' || /^pd[-_ ]/.test(kode)) return { bebas: true, lisensi: LISENSI.pd };
  return { bebas: false, lisensi: pendek || kode || 'tidak diketahui' };
}

/**
 * Wikimedia Commons: generator=search di namespace File + imageinfo (url, ukuran, extmetadata, thumb 1920).
 * Mengembalikan {kandidat, dibuang} agar uji dapat membuktikan kandidat CC-BY benar-benar terbuang.
 */
async function cariWikimediaRinci(kueri) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(`${kueri} filetype:bitmap`) +
    `&gsrnamespace=6&gsrlimit=${PER_HALAMAN}&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata%7Cmime&iiurlwidth=1920&iiextmetadatafilter=LicenseShortName%7CLicense%7CArtist%7CImageDescription%7CCategories&format=json&formatversion=2`;
  const j = await fetchJson(u);
  const kandidat = [], dibuang = [];
  for (const p of j.query?.pages || []) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || '')) continue;
    const { bebas, lisensi } = lisensiWikimediaBebas(ii.extmetadata);
    const judul = String(p.title || '').replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ');
    if (!bebas) { dibuang.push({ judul, lisensi }); continue; }
    const lebarAsli = Number(ii.width) || 0, tinggiAsli = Number(ii.height) || 0;
    const pakaiThumb = ii.thumburl && lebarAsli > 1920;
    kandidat.push({
      penyedia: 'wikimedia', id: String(p.pageid), url: pakaiThumb ? ii.thumburl : ii.url,
      lebar: pakaiThumb ? Number(ii.thumbwidth) || 1920 : lebarAsli, tinggi: pakaiThumb ? Number(ii.thumbheight) || Math.round(tinggiAsli * 1920 / lebarAsli) : tinggiAsli,
      judul, tag: String(ii.extmetadata?.Categories?.value || '').split('|').map((t) => t.trim()).filter(Boolean).slice(0, 12),
      pembuat: String(ii.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 120), lisensi, urlAsal: ii.descriptionurl || '',
    });
  }
  return { kandidat, dibuang };
}
async function cariWikimedia(kueri) { return (await cariWikimediaRinci(kueri)).kandidat; }

export const ADAPTOR = Object.freeze({ pexels: cariPexels, pixabay: cariPixabay, openverse: cariOpenverse, wikimedia: cariWikimedia });

/** Penyedia yang aktif pada konfigurasi saat ini (Pexels/Pixabay butuh kunci; Openverse/Wikimedia selalu aktif). */
export function penyediaAktif() {
  return Object.keys(ADAPTOR).filter((n) => (n === 'pexels' ? !!process.env.PEXELS_API_KEY : n === 'pixabay' ? !!process.env.PIXABAY_API_KEY : true));
}

// ------------------------------------------------------------------ penyaringan & skor

function kataKueri(kueri) {
  return [...new Set(String(kueri).toLowerCase().split(/[^a-z0-9]+/).filter((k) => k.length >= 3 && !STOPWORD.has(k)))];
}

/**
 * Kecocokan kata kueri pada judul/tag kandidat: 0..1. Kata dibandingkan sebagai AWALAN dua arah (>= 4 huruf) agar
 * bentuk kata serumpun saling cocok ("flooded" ~ "flood", "houses" ~ "house"); kata pendek (3 huruf) harus persis.
 */
export function skorRelevansi(kandidat, kueri) {
  const kata = kataKueri(kueri);
  if (!kata.length) return 0;
  const token = `${kandidat.judul || ''} ${(kandidat.tag || []).join(' ')}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const cocokKata = (k) => token.some((t) => t === k || (k.length >= 4 && t.length >= 4 && (t.startsWith(k) || k.startsWith(t))));
  const cocok = kata.filter(cocokKata).length;
  return cocok / kata.length;
}

/** Saring: lisensi sah, lebar >= 1200. Mengembalikan kandidat yang lolos (landscape diprioritaskan lewat skor, bukan dibuang). */
export function saringKandidat(daftar) {
  return daftar.filter((k) => k.url && k.lisensi && Number(k.lebar) >= LEBAR_MIN && Number(k.tinggi) > 0);
}

// Stok foto terkurasi (Pexels/Pixabay) = ilustrasi berita yang layak; Wikimedia/Openverse memuat banyak peta, citra satelit,
// diagram, logo -> bonus penyedia lebih besar untuk stok, dan judul/tag bertema non-foto dilewati (TEMUAN uji e2e nyata:
// pilihan pertama adalah citra satelit Wikimedia dari kueri paling umum "heavy rain flood").
const BONUS_PENYEDIA = { pexels: 12, pixabay: 10, openverse: 2, wikimedia: 0 };
const RE_BUKAN_FOTO = /\b(satellite|satelit|map|maps|peta|diagram|chart|graph|plot|logo|icon|screenshot|table|tabel|infographic|svg|drawing|illustration|sketch|radar|forecast)\b/i;

/**
 * Skor gabungan: relevansi (0..100, DIKALIKAN bobot kekhususan kueri: 1.0 / 0.8 / 0.6 agar kecocokan pada kueri paling
 * spesifik selalu menang atas kecocokan pada kueri umum) + resolusi (0..20) + landscape (15) + bonus penyedia.
 * -1 = tidak layak (Openverse/Wikimedia tanpa kecocokan kata, atau judul/tag bertema non-foto).
 */
export function skorKandidat(kandidat, kueri, indeksKueri = 0) {
  const relevansi = skorRelevansi(kandidat, kueri);
  // Pexels/Pixabay sudah mengurutkan relevansi di mesinnya (judul/tag sering tidak memuat kata harfiah);
  // Openverse/Wikimedia (pencarian teks penuh, hasil bisa jauh) wajib memuat >= 1 kata kueri agar layak.
  if (relevansi === 0 && (kandidat.penyedia === 'openverse' || kandidat.penyedia === 'wikimedia')) return -1;
  if ((kandidat.penyedia === 'openverse' || kandidat.penyedia === 'wikimedia') && RE_BUKAN_FOTO.test(`${kandidat.judul || ''} ${(kandidat.tag || []).join(' ')}`)) return -1;
  const resolusi = Math.min(Number(kandidat.lebar) || 0, 2400) / 2400 * 20;
  const landscape = Number(kandidat.lebar) >= Number(kandidat.tinggi) ? 15 : 0;
  const bobotKueri = [1, 0.8, 0.6][indeksKueri] ?? 0.6;
  return relevansi * 100 * bobotKueri + resolusi + landscape + (BONUS_PENYEDIA[kandidat.penyedia] || 0);
}

/**
 * Mengumpulkan kandidat dari SEMUA penyedia aktif untuk SEMUA kueri (paralel), dengan statistik per penyedia.
 * Penyedia yang gagal/timeout dilewati dan dicatat (tidak menggagalkan keseluruhan).
 */
export async function kumpulkanKandidat(daftarKueri, { penyedia = penyediaAktif() } = {}) {
  const kueri = [...new Set(daftarKueri.map((k) => String(k || '').trim()).filter(Boolean))].slice(0, 3);
  const statistik = Object.fromEntries(penyedia.map((n) => [n, { mentah: 0, lolos: 0, galat: [] }]));
  const tugas = [];
  kueri.forEach((q, i) => penyedia.forEach((n) => tugas.push(
    ADAPTOR[n](q).then((hasil) => ({ n, i, q, hasil }), (g) => ({ n, i, q, galat: g })),
  )));
  const semua = [];
  const terlihat = new Set();
  for (const r of await Promise.all(tugas)) {
    if (r.galat) { statistik[r.n].galat.push(`${r.q}: ${String(r.galat?.message || r.galat).slice(0, 80)}`); continue; }
    statistik[r.n].mentah += r.hasil.length;
    for (const k of saringKandidat(r.hasil)) {
      const kunci = `${k.penyedia}:${k.id}`;
      if (terlihat.has(kunci)) continue;
      terlihat.add(kunci);
      statistik[r.n].lolos += 1;
      semua.push({ ...k, kueri: r.q, indeksKueri: r.i, skor: skorKandidat(k, r.q, r.i) });
    }
  }
  semua.sort((a, b) => b.skor - a.skor);
  return { kandidat: semua.filter((k) => k.skor >= 0), statistik, kueri };
}

// ------------------------------------------------------------------ unduh & simpan

async function unduhBiner(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_UNDUH_MS);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/*' }, signal: ac.signal, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const panjang = Number(r.headers.get('content-length') || 0);
    if (panjang > MAKS_BYTE_UNDUH) throw new Error('berkas terlalu besar');
    const tipe = r.headers.get('content-type') || '';
    if (tipe && !/^image\//i.test(tipe)) throw new Error(`bukan gambar (${tipe.slice(0, 30)})`);
    const potongan = [];
    let total = 0;
    for await (const bagian of r.body) {
      total += bagian.length;
      if (total > MAKS_BYTE_UNDUH) throw new Error('berkas terlalu besar');
      potongan.push(bagian);
    }
    return Buffer.concat(potongan);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Mencari dan mengunduh SATU gambar terbaik untuk daftar kueri (spesifik -> umum). Mencoba kandidat berurutan
 * (maks 4) bila unduhan gagal / hasil sharp < 1200 px.
 * @returns {Promise<{ hasil: null | { jalur, lebar, tinggi, ukuran, sumber: object }, statistik, kandidat: number, dicoba: object[] }>}
 */
export async function cariDanUnduhGambar(daftarKueri, { subfolder = 'ai' } = {}) {
  const { kandidat, statistik, kueri } = await kumpulkanKandidat(daftarKueri);
  const dicoba = [];
  for (const k of kandidat.slice(0, MAKS_PERCOBAAN_UNDUH)) {
    try {
      const buffer = await unduhBiner(k.url);
      const simpan = await simpanGambar(buffer, { subfolder, maksByte: MAKS_BYTE_UNDUH });
      if (simpan.lebar < LEBAR_MIN) { dicoba.push({ penyedia: k.penyedia, id: k.id, hasil: `lebar ${simpan.lebar} < ${LEBAR_MIN} setelah diproses` }); continue; }
      dicoba.push({ penyedia: k.penyedia, id: k.id, hasil: 'dipakai' });
      const sumber = {
        penyedia: k.penyedia, judul: k.judul || null, pembuat: k.pembuat || null, lisensi: k.lisensi, urlAsal: k.urlAsal || null, urlUnduh: k.url,
        idPenyedia: k.id, kueri: k.kueri, lebarAsal: k.lebar, tinggiAsal: k.tinggi, skor: Math.round(k.skor), diunduhPada: new Date().toISOString(),
      };
      return { hasil: { jalur: simpan.jalur, lebar: simpan.lebar, tinggi: simpan.tinggi, ukuran: simpan.ukuran, sumber }, statistik, kandidat: kandidat.length, dicoba, kueri };
    } catch (g) {
      dicoba.push({ penyedia: k.penyedia, id: k.id, hasil: `gagal: ${g instanceof GalatUnggahan ? g.kode : String(g?.message || g).slice(0, 80)}` });
    }
  }
  return { hasil: null, statistik, kandidat: kandidat.length, dicoba, kueri };
}

export { cariWikimediaRinci };
