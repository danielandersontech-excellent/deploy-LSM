// lib/ai/anthropic.js — klien tipis Anthropic Messages API (RUN AI-1).
//
// KEPUTUSAN BARU: memakai `fetch` bawaan Node 22+, BUKAN paket `@anthropic-ai/sdk` — aturan 4 CLAUDE.md melarang
// paket npm di luar daftar cetak biru tanpa izin pemilik, dan perintah pemilik menyebut "Anthropic Messages API"
// (bentuk HTTP: POST https://api.anthropic.com/v1/messages, header x-api-key + anthropic-version). Bila pemilik
// kelak mengizinkan SDK resmi, modul ini satu-satunya yang perlu diganti.
//
// Yang ditangani di sini:
//   * kunci dari ANTHROPIC_API_KEY (tidak pernah dicetak/dibalas ke klien),
//   * model utama claude-sonnet-5-5; 404 not_found_error -> coba claude-sonnet-5 (model yang dipakai dicatat),
//   * tool server web_search (type web_search_20250305, max_uses dari pemanggil) — pencarian dijalankan di sisi
//     Anthropic; hasilnya kembali sebagai blok `web_search_tool_result`,
//   * stop_reason 'pause_turn' (loop server-side terhenti sementara) -> kirim ulang maksimal 2 kali,
//   * batas waktu (AbortController) + pemetaan galat API ke pesan ramah berbahasa Indonesia,
//   * penjumlahan usage (input/output tokens + web_search_requests) dari semua putaran.
const URL_MESSAGES = 'https://api.anthropic.com/v1/messages';
const VERSI_API = '2023-06-01';
export const MODEL_UTAMA = process.env.AI_MODEL || 'claude-sonnet-5-5';
export const MODEL_CADANGAN = 'claude-sonnet-5';
const MAKS_LANJUTAN_PAUSE = 2;
const JEDA_ULANG_MS = [1000, 3000];

export class GalatAI extends Error {
  constructor(pesan, kode = 'AI_GALAT', status = 502, detail = null) {
    super(pesan);
    this.kode = kode;
    this.status = status;
    this.detail = detail;
  }
}

function kunciApi() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new GalatAI('Asisten AI belum dikonfigurasi di server (kunci API kosong); hubungi superadmin', 'AI_TIDAK_DIKONFIGURASI', 503);
  return k;
}

/** Pesan ramah untuk pengguna + kode, dari status/tipe galat API. Pesan asli API tidak diteruskan utuh ke klien. */
function petakanGalatApi(status, tipe, pesanApi = '') {
  if (status === 401) return ['Kunci API Anthropic ditolak; hubungi superadmin', 'AI_KUNCI', 502];
  if (status === 402 || tipe === 'billing_error') return ['Saldo atau kredit Anthropic habis; hubungi superadmin', 'AI_SALDO', 502];
  if (status === 403) return ['Kunci API tidak diizinkan untuk permintaan ini; hubungi superadmin', 'AI_IZIN', 502];
  if (status === 404) return ['Model AI tidak tersedia untuk akun ini; hubungi superadmin', 'AI_MODEL', 502];
  if (status === 429) return ['Layanan AI sedang membatasi permintaan (terlalu banyak dalam waktu singkat); coba lagi beberapa menit', 'AI_LAJU', 503];
  if (status === 529 || tipe === 'overloaded_error') return ['Layanan AI sedang kelebihan beban; coba lagi beberapa menit', 'AI_SIBUK', 503];
  if (status >= 500) return ['Layanan AI sedang bermasalah; coba lagi nanti', 'AI_SERVER', 502];
  if (status === 400 && /web search/i.test(pesanApi)) return ['Fitur pencarian web belum aktif di akun Anthropic; hubungi superadmin', 'AI_WEBSEARCH', 502];
  return [`Permintaan ke AI ditolak (${String(pesanApi || tipe || status).slice(0, 140)})`, 'AI_PERMINTAAN', 502];
}

async function kirimSekali(badan, timeoutMs, ulangan = 0) {
  const ac = new AbortController();
  const pengatur = setTimeout(() => ac.abort(), timeoutMs);
  try {
    let r;
    try {
      r = await fetch(URL_MESSAGES, {
        method: 'POST',
        headers: { 'x-api-key': kunciApi(), 'anthropic-version': VERSI_API, 'content-type': 'application/json' },
        body: JSON.stringify(badan),
        signal: ac.signal,
      });
    } catch (g) {
      if (g?.name === 'AbortError') throw new GalatAI('Riset AI melewati batas waktu; coba lagi atau persempit topik', 'AI_TIMEOUT', 504);
      // TEMUAN uji e2e: setelah balasan 400, permintaan berikutnya pada soket keep-alive yang sudah ditutup server gagal
      // ("fetch failed" / other side closed). Galat lapisan koneksi terjadi SEBELUM balasan diterima -> aman diulang sekali.
      const sebab = `${g?.message || g}${g?.cause?.message ? ` <- ${g.cause.message}` : ''}`;
      // TEMUAN uji e2e lokal: dari proses server pernah terjadi ECONNRESET lalu ENOTFOUND beruntun (Wi-Fi laptop
      // tidak stabil) padahal proses node lain tersambung -> diulang sampai 2 kali dengan jeda 1 s dan 3 s.
      if (ulangan < JEDA_ULANG_MS.length) {
        console.warn(`[ai] galat koneksi ke Anthropic (${sebab}); ulangan ke-${ulangan + 1} dalam ${JEDA_ULANG_MS[ulangan]} ms`);
        await new Promise((r) => setTimeout(r, JEDA_ULANG_MS[ulangan]));
        return kirimSekali(badan, Math.max(10_000, timeoutMs - JEDA_ULANG_MS[ulangan]), ulangan + 1);
      }
      console.error(`[ai] galat koneksi ke Anthropic setelah ${ulangan + 1} percobaan: ${sebab}`);
      throw new GalatAI('Tidak dapat menghubungi layanan AI; periksa koneksi server', 'AI_JARINGAN', 502, { sebab: sebab.slice(0, 200) });
    }
    const teks = await r.text();
    let j = {};
    try { j = teks ? JSON.parse(teks) : {}; } catch { j = {}; }
    if (!r.ok) {
      const tipe = j?.error?.type || '';
      const pesanApi = j?.error?.message || '';
      const [pesan, kode, status] = petakanGalatApi(r.status, tipe, pesanApi);
      const galat = new GalatAI(pesan, kode, status, { statusApi: r.status, tipeApi: tipe, pesanApi: pesanApi.slice(0, 300), requestId: r.headers.get('request-id') });
      throw galat;
    }
    return j;
  } finally {
    clearTimeout(pengatur);
  }
}

function tambahUsage(total, usage) {
  total.token_masuk += Number(usage?.input_tokens) || 0;
  total.token_keluar += Number(usage?.output_tokens) || 0;
  total.cache_baca += Number(usage?.cache_read_input_tokens) || 0;
  total.cache_tulis += Number(usage?.cache_creation_input_tokens) || 0;
  total.pencarian += Number(usage?.server_tool_use?.web_search_requests) || 0;
}

/**
 * Satu "giliran" lengkap ke Messages API, termasuk lanjutan pause_turn dan cadangan model.
 * @param {{ sistem: string, teksPengguna: string, maxTokens?: number, tools?: object[], timeoutMs?: number, model?: string }} opsi
 * @returns {Promise<{ model: string, konten: object[], stopReason: string, usage: object, idPesan: string[], putaran: number }>}
 *   `konten` = gabungan blok isi seluruh putaran (text, server_tool_use, web_search_tool_result) berurutan.
 */
export async function panggilMessages({ sistem, teksPengguna, maxTokens = 12000, tools = [], timeoutMs = 240_000, model = MODEL_UTAMA, effort = 'medium' }) {
  // KEPUTUSAN BARU (diperbarui dari TEMUAN uji e2e): parameter `thinking` TIDAK dikirim sama sekali. Rencana awal
  // `thinking: {type: 'disabled'}` (hemat token) DITOLAK claude-sonnet-5-5 dengan 400; model menjalankan penalaran
  // adaptif bawaan. Anggaran keluaran tetap dibatasi max_tokens; usage dicatat per panggilan untuk biaya terukur.
  // PENGUKURAN 1 (12.000 max_tokens, tanpa output_config): 109.436 masuk / 12.427 keluar, balasan terpotong (draf ke-3
  // hilang). Penalaran adaptif memakan sebagian besar anggaran keluaran -> effort 'medium' + max_tokens dinaikkan
  // pemanggil; bila model menolak output_config (400, tak ditagih) dikirim ulang tanpa parameter itu.
  const dasar = {
    model,
    max_tokens: maxTokens,
    output_config: { effort },
    system: sistem,
    tools,
    messages: [{ role: 'user', content: teksPengguna }],
  };
  const usage = { token_masuk: 0, token_keluar: 0, cache_baca: 0, cache_tulis: 0, pencarian: 0 };
  const idPesan = [];
  let konten = [];
  let putaran = 0;
  let modelDipakai = model;
  let badan = dasar;
  const mulai = Date.now();

  for (;;) {
    putaran++;
    const sisa = Math.max(10_000, timeoutMs - (Date.now() - mulai));
    let j;
    try {
      j = await kirimSekali(badan, sisa);
    } catch (g) {
      // Model utama tidak tersedia (404 not_found_error) -> coba model cadangan sekali, catat.
      if (g instanceof GalatAI && g.detail?.statusApi === 404 && modelDipakai === MODEL_UTAMA && MODEL_CADANGAN !== MODEL_UTAMA && putaran === 1) {
        console.warn(`[ai] model ${MODEL_UTAMA} tidak ditemukan (404); mencoba ${MODEL_CADANGAN}`);
        modelDipakai = MODEL_CADANGAN;
        badan = { ...badan, model: modelDipakai };
        putaran--;
        continue;
      }
      // 400 karena parameter opsional tidak dikenal model ini (thinking / user_location) -> kirim ulang tanpa parameter
      // itu; 400 tidak ditagih. Dicatat agar laporan tahu bentuk permintaan yang akhirnya dipakai.
      if (g instanceof GalatAI && g.detail?.statusApi === 400 && putaran === 1) {
        const p = g.detail.pesanApi || '';
        if (/output_config|effort/i.test(p) && badan.output_config) { console.warn('[ai] model menolak output_config.effort; dikirim ulang tanpa parameter itu'); const { output_config: _o, ...tanpa } = badan; badan = tanpa; putaran--; continue; }
        if (/thinking/i.test(p) && badan.thinking) { console.warn('[ai] model menolak parameter thinking; dikirim ulang tanpa thinking'); const { thinking: _t, ...tanpa } = badan; badan = tanpa; putaran--; continue; }
        if (/user_location/i.test(p) && badan.tools?.some((t) => t.user_location)) { console.warn('[ai] model menolak user_location; dikirim ulang tanpa lokasi'); badan = { ...badan, tools: badan.tools.map(({ user_location: _u, ...t }) => t) }; putaran--; continue; }
      }
      throw g;
    }
    idPesan.push(j.id);
    tambahUsage(usage, j.usage);
    konten = konten.concat(Array.isArray(j.content) ? j.content : []);
    if (j.stop_reason === 'pause_turn' && putaran <= MAKS_LANJUTAN_PAUSE) {
      // Lanjutkan: kirim balik pesan asisten apa adanya (termasuk encrypted_content) tanpa pesan pengguna tambahan.
      badan = { ...badan, messages: [{ role: 'user', content: teksPengguna }, { role: 'assistant', content: j.content }] };
      continue;
    }
    return { model: modelDipakai, konten, stopReason: j.stop_reason, usage, idPesan, putaran, durasiMs: Date.now() - mulai };
  }
}

/** Definisi tool web_search (versi dasar sesuai perintah pemilik), hasil dilokalkan ke Indonesia. */
export function toolWebSearch(maxUses = 8) {
  return {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: maxUses,
    user_location: { type: 'approximate', country: 'ID', timezone: 'Asia/Jakarta' },
  };
}
