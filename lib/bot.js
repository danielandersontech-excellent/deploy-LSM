// lib/bot.js — pembeda perayap/bot dari pengunjung manusia berdasarkan User-Agent.
// Dipakai halaman detail artikel agar jumlah_dibaca tidak dinaikkan oleh perayap mesin pencari,
// pratinjau tautan (WhatsApp/Telegram/Facebook), alat audit (Lighthouse), peramban tanpa kepala,
// dan alat baris perintah (curl/wget/python-requests/Go-http-client).
//
// KEPUTUSAN BARU (TAHAP-05 bagian 2): pembedaan memakai header User-Agent saja —
// murah, tanpa cookie/JavaScript, dan cukup untuk statistik baca (bukan untuk keamanan).
// UA kosong dianggap bot: peramban sungguhan selalu mengirim User-Agent.
// Batasannya jujur: bot yang memalsukan UA peramban tetap terhitung; tidak ada cara pasti
// tanpa JavaScript/tantangan, dan itu di luar tujuan penghitung sederhana ini.

const POLA_BOT = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|curl|wget|python-requests|Go-http-client)/i;

/** true bila User-Agent kosong atau cocok dengan pola perayap/alat otomatis. */
export function adalahBot(userAgent) {
  const ua = String(userAgent ?? '').trim();
  if (!ua) return true;
  return POLA_BOT.test(ua);
}
