// lib/auth/penjaga.js — lapisan 3 (requireUser di layout) dan lapisan 4 (requireRole
// di SETIAP route API). Ini PAGAR; proxy.js hanya kenyamanan.
//
// Agar requireRole sulit terlupa (TAHAP-02 bagian 4), dipakai DUA mekanisme:
//   1. denganPeran([...peran], handler) — pembungkus yang memverifikasi sesi + peran
//      sebelum handler dipanggil, dan menyeragamkan balasan 401/403/500.
//   2. Uji otomatis laporan/bukti-tahap-02/skrip/uji-l-route-tanpa-penjaga.mjs
//      menelusuri seluruh app/api/**/route.js dan GAGAL bila ada route non-publik
//      yang tidak memakai denganPeran/requireRole.

import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ambilPenggunaSesi, NAMA_COOKIE } from './sesi.js';
import { peranValid } from './hakAkses.js';

/** Galat HTTP yang membawa kode status; ditangkap denganPeran() menjadi JSON. */
export class GalatHttp extends Error {
  constructor(status, pesan, kode = null) {
    super(pesan);
    this.status = status;
    this.kode = kode;
  }
}

/**
 * Lapisan 3 — dipakai di layout area staf (server component).
 * Tanpa sesi sah -> redirect ke /login (?lanjut=jalur). Peran tidak berhak -> /tanpa-akses.
 * Mengembalikan pengguna (tanpa kata_sandi_hash).
 */
export async function requireUser(peranDiizinkan, { jalur = '/staf/dashboard' } = {}) {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) {
    // QA-2 B0a: cookie ADA tetapi sesi tidak sah (token_version naik / kadaluarsa / nonaktif) -> hapus cookie dulu lewat
    // /api/auth/bersihkan-sesi agar /login menampilkan formulir, bukan loop /login <-> /staf.
    const adaCookie = !!(await cookies()).get(NAMA_COOKIE)?.value;
    redirect(`${adaCookie ? '/api/auth/bersihkan-sesi' : '/login'}?lanjut=${encodeURIComponent(jalur)}`);
  }
  if (!peranDiizinkan.includes(pengguna.peran)) redirect('/tanpa-akses');
  return pengguna;
}

/**
 * Lapisan 4 — dipanggil di setiap route API (langsung atau lewat denganPeran).
 * Melempar GalatHttp 401 bila tidak ada pengguna, 403 bila peran tidak termasuk.
 */
export function requireRole(pengguna, peranDiizinkan) {
  if (!pengguna) throw new GalatHttp(401, 'Belum masuk', 'BELUM_MASUK');
  if (!peranValid(pengguna.peran) || !peranDiizinkan.includes(pengguna.peran)) {
    throw new GalatHttp(403, 'Peran Anda tidak berhak mengakses sumber daya ini', 'TIDAK_BERHAK');
  }
  return pengguna;
}

/** Membaca body JSON; JSON rusak -> GalatHttp 400 (ditangkap denganPeran). */
export async function bacaJson(request) {
  try {
    return await request.json();
  } catch {
    throw new GalatHttp(400, 'Muatan harus JSON yang sah', 'JSON_TIDAK_SAH');
  }
}

/**
 * Tahap 9 B5 (CSRF) — permintaan pengubah data (bukan GET/HEAD/OPTIONS) wajib SAME-ORIGIN.
 * Cookie sesi SameSite=Lax sudah mencegah peramban mengirim cookie pada POST lintas situs; ini lapisan kedua
 * (defense in depth): bila peramban mengirim Origin (atau Referer), host-nya harus sama dengan host permintaan.
 * Tanpa Origin/Referer (curl, klien non-peramban) diizinkan — klien seperti itu tidak membawa cookie diam-diam.
 * KEPUTUSAN BARU: dipasang di denganPeran (seluruh route staf) dan POST /api/auth/login.
 */
export function periksaAsal(request) {
  const metode = String(request?.method || 'GET').toUpperCase();
  if (metode === 'GET' || metode === 'HEAD' || metode === 'OPTIONS') return;
  const asal = request.headers.get('origin') || request.headers.get('referer');
  if (!asal) return;
  let hostAsal;
  try { hostAsal = new URL(asal).host; } catch { throw new GalatHttp(403, 'Asal permintaan tidak sah', 'ASAL_TIDAK_SAH'); }
  const host = String(request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim();
  if (!host || hostAsal.toLowerCase() !== host.toLowerCase()) throw new GalatHttp(403, 'Asal permintaan tidak sah', 'ASAL_TIDAK_SAH');
}

/** Balasan JSON galat seragam. */
export function balasGalat(status, pesan, kode = null, tambahan = {}) {
  return NextResponse.json({ galat: pesan, kode, ...tambahan }, { status, headers: { 'cache-control': 'no-store' } });
}

/**
 * Pembungkus route API: verifikasi sesi (DB: aktif + token_version) lalu requireRole,
 * baru handler(request, konteks, pengguna). Galat GalatHttp -> JSON berkode; galat lain -> 500
 * tanpa membocorkan detail.
 *
 *   export const GET = denganPeran(HAK.pengaduan_lihat, async (request, { params }, pengguna) => { ... });
 */
export function denganPeran(peranDiizinkan, handler) {
  return async function routeTerjaga(request, konteks) {
    try {
      periksaAsal(request);
      const pengguna = await ambilPenggunaSesi();
      requireRole(pengguna, peranDiizinkan);
      return await handler(request, konteks, pengguna);
    } catch (galat) {
      if (galat instanceof GalatHttp) return balasGalat(galat.status, galat.message, galat.kode);
      console.error('[api] galat tak terduga:', galat?.message);
      return balasGalat(500, 'Terjadi kesalahan di server', 'GALAT_SERVER');
    }
  };
}
