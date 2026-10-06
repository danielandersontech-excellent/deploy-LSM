// lib/ai/pembersihan.js — pembersihan saran AI kadaluarsa (RUN AI-1 butir C) + kunci proses per pengguna.
//
// Saran 'baru' > 7 hari: berkas gambar (bila ada, hasil pakai yang gagal di tengah jalan) dihapus dari disk, baris
// ditandai 'dibersihkan'. Saran 'dipakai' dan ARTIKEL jadi TIDAK PERNAH disentuh (hanya status 'baru' yang dipilih).
// Dipanggil: (a) malas (lazy) saat halaman asisten dibuka — paling sering sekali per 10 menit per proses, (b) tombol
// "Bersihkan sekarang" (superadmin) tanpa pembatas.
import { unlink } from 'node:fs/promises';
import { ambilSaranKadaluarsa, tandaiDibersihkan } from '../db/aiSaran.js';
import { jalurDiskUnggahan } from '../unggahan.js';

export const HARI_KADALUARSA = 7;
const JEDA_LAZY_MS = 10 * 60 * 1000;
const KUNCI_WAKTU = Symbol.for('warkop.aiBersihTerakhir');
const KUNCI_PROSES = Symbol.for('warkop.aiProsesAktif');

/** Menghapus berkas gambar saran: jalur URL /unggahan/<sub>/<nama> -> jalur disk aman (tanpa keluar UPLOAD_DIR). */
export async function hapusBerkasGambarSaran(gambarJalur) {
  if (!gambarJalur || !gambarJalur.startsWith('/unggahan/')) return false;
  const segmen = gambarJalur.slice('/unggahan/'.length).split('/').filter(Boolean);
  const info = await jalurDiskUnggahan(segmen);
  if (!info) return false;
  await unlink(info.jalur);
  return true;
}

export async function bersihkanSaranKadaluarsa({ hari = HARI_KADALUARSA } = {}) {
  const daftar = await ambilSaranKadaluarsa(hari);
  let dibersihkan = 0, berkasDihapus = 0;
  const galat = [];
  for (const s of daftar) {
    try {
      if (s.gambar_jalur && (await hapusBerkasGambarSaran(s.gambar_jalur))) berkasDihapus++;
    } catch (g) {
      galat.push(`saran ${s.id}: berkas tidak terhapus (${String(g?.message || g).slice(0, 60)})`);
    }
    dibersihkan += await tandaiDibersihkan(s.id);
  }
  return { diperiksa: daftar.length, dibersihkan, berkasDihapus, galat };
}

/** Pembersihan malas: dijalankan paling sering tiap 10 menit per proses; galat tidak menggagalkan halaman. */
export async function bersihkanMalas() {
  const terakhir = globalThis[KUNCI_WAKTU] || 0;
  if (Date.now() - terakhir < JEDA_LAZY_MS) return null;
  globalThis[KUNCI_WAKTU] = Date.now();
  try {
    return await bersihkanSaranKadaluarsa();
  } catch (g) {
    console.error('[ai] pembersihan malas gagal:', g?.message);
    return null;
  }
}

// ------------------------------------------------------------------ kunci 1 proses serentak per pengguna

function petaProses() {
  if (!globalThis[KUNCI_PROSES]) globalThis[KUNCI_PROSES] = new Map();
  return globalThis[KUNCI_PROSES];
}

/** Mengambil kunci proses pengguna; false bila pengguna itu sudah punya permintaan yang sedang berjalan. */
export function ambilKunciProses(userId, maksSerentakGlobal = 4) {
  const peta = petaProses();
  const kini = Date.now();
  // kunci basi (> 6 menit, mis. proses crash) dilepas otomatis
  for (const [k, t] of peta) if (kini - t > 6 * 60 * 1000) peta.delete(k);
  if (peta.has(Number(userId))) return { ok: false, alasan: 'pengguna' };
  if (peta.size >= maksSerentakGlobal) return { ok: false, alasan: 'global' };
  peta.set(Number(userId), kini);
  return { ok: true };
}

export function lepasKunciProses(userId) {
  petaProses().delete(Number(userId));
}

export function jumlahProsesAktif() {
  return petaProses().size;
}
