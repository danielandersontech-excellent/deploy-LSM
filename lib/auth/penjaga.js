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
import { ambilPenggunaSesi } from './sesi.js';
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
  if (!pengguna) redirect(`/login?lanjut=${encodeURIComponent(jalur)}`);
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
