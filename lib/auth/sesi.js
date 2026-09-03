// lib/auth/sesi.js — cookie sesi + pembacaan pengguna aktif (lapisan 3 dan 4).
//
// Cookie: httpOnly + sameSite=lax + secure (di produksi / di balik HTTPS).
// ambilPenggunaSesi(): verifikasi JWT LALU periksa basis data — token_version
// harus sama dengan users.token_version dan akun harus aktif. Pemeriksaan DB
// ini sengaja TIDAK ada di proxy.js (kueri per permintaan di proxy dilarang);
// ia dilakukan di sini, sekali per permintaan (React cache) di layout dan di
// setiap route API.

import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { verifikasiToken, masaBerlakuToken } from './jwt.js';
import { ambilUserUntukSesi } from '../db/users.js';

export const NAMA_COOKIE = 'warkop_token';

/** Konversi "8h"/"30m"/"7d" -> detik (untuk maxAge cookie). */
function masaBerlakuDetik() {
  const m = String(masaBerlakuToken()).match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 8 * 3600;
  const n = Number(m[1]);
  return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2].toLowerCase()];
}

/** Apakah permintaan datang lewat HTTPS (langsung atau di balik Traefik/Cloudflare). */
function permintaanAman(request) {
  if (process.env.NODE_ENV === 'production') return true;
  const proto = request?.headers?.get?.('x-forwarded-proto');
  return proto === 'https';
}

/** Opsi cookie sesi. secure=true di produksi atau bila proto https (agar dev di http://localhost tetap bisa masuk). */
export function opsiCookieSesi(request) {
  return {
    httpOnly: true,
    secure: permintaanAman(request),
    sameSite: 'lax',
    path: '/',
    maxAge: masaBerlakuDetik(),
  };
}

export function opsiHapusCookieSesi(request) {
  return { ...opsiCookieSesi(request), maxAge: 0 };
}

/**
 * Pengguna aktif dari cookie permintaan saat ini, sudah diverifikasi terhadap DB.
 * Mengembalikan {id, nama, email, peran, wilayah_id, wilayah_nama, token_version}
 * TANPA kata_sandi_hash, atau null. Di-cache per permintaan (layout + halaman
 * dalam satu render hanya memeriksa DB sekali).
 */
export const ambilPenggunaSesi = cache(async function ambilPenggunaSesi() {
  const toko = await cookies();
  const token = toko.get(NAMA_COOKIE)?.value;
  if (!token) return null;
  const muatan = await verifikasiToken(token);
  if (!muatan) return null;
  const pengguna = await ambilUserUntukSesi(muatan.id);
  if (!pengguna || !pengguna.aktif) return null;
  if (Number(pengguna.token_version) !== Number(muatan.token_version)) return null; // sesi lama dibatalkan
  const { aktif: _aktif, ...aman } = pengguna;
  return aman;
});

/** Alamat IP klien dari header proxy (Traefik/Cloudflare), untuk audit & pembatas laju. */
export async function alamatIpPermintaan(request = null) {
  const h = request?.headers ?? (await headers());
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return h.get('x-real-ip')?.trim() || '0.0.0.0';
}
