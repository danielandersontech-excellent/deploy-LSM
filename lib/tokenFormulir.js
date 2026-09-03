// lib/tokenFormulir.js — "tantangan sederhana" formulir publik (TAHAP-06 §11), bukan CAPTCHA pihak
// ketiga (tidak melacak pengguna). Token = HMAC-SHA256(waktu_terbit) dengan JWT_SECRET; formulir
// hanya diterima bila token sah, berumur ≥ 3 detik (skrip mengirim seketika) dan ≤ 2 jam.
// Dipadukan dengan honeypot (field `situs_web` yang harus kosong) di route API.
// Tidak ada yang disimpan di server dan tidak ada data pelapor di token.
import { createHmac, timingSafeEqual } from 'node:crypto';

const UMUR_MIN_MS = 3_000;
const UMUR_MAKS_MS = 2 * 60 * 60 * 1000;

function rahasia() {
  const r = process.env.JWT_SECRET;
  if (!r) throw new Error('JWT_SECRET belum diatur');
  return r;
}

function tanda(waktu) {
  return createHmac('sha256', rahasia()).update(`formulir:${waktu}`).digest('hex');
}

/** Token untuk disematkan di formulir (dibuat saat halaman dirender di server). */
export function buatTokenFormulir(kini = Date.now()) {
  return `${kini}.${tanda(kini)}`;
}

/** @returns {{sah:boolean, alasan?:string}} */
export function periksaTokenFormulir(token, kini = Date.now()) {
  const m = /^(\d{10,16})\.([0-9a-f]{64})$/.exec(String(token ?? ''));
  if (!m) return { sah: false, alasan: 'TOKEN_TIDAK_SAH' };
  const waktu = Number(m[1]);
  const harapan = Buffer.from(tanda(waktu));
  const diberi = Buffer.from(m[2]);
  if (harapan.length !== diberi.length || !timingSafeEqual(harapan, diberi)) return { sah: false, alasan: 'TOKEN_TIDAK_SAH' };
  const umur = kini - waktu;
  if (umur < UMUR_MIN_MS) return { sah: false, alasan: 'TERLALU_CEPAT' };
  if (umur > UMUR_MAKS_MS) return { sah: false, alasan: 'TOKEN_KEDALUWARSA' };
  return { sah: true };
}
