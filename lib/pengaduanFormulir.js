// lib/pengaduanFormulir.js — logika MURNI formulir pengaduan publik (tanpa React, tanpa DOM)
// agar bisa diuji lewat `node` (laporan/bukti-tahap-06/a-muatan-anonim-klien.txt).
//
// PRINSIP INTI TAHAP-06 §2 — "anonim berarti TIDAK DIKIRIM": susunMuatan() membangun daftar
// field dari state formulir, dan bila `anonim` benar, keempat field identitas TIDAK ADA di daftar
// (bukan dikirim kosong, bukan dihapus belakangan). Komponen client memakai daftar ini untuk
// mengisi FormData secara manual — bukan `new FormData(form)`.

export const FIELD_IDENTITAS = Object.freeze(['nama_pelapor', 'nik_pelapor', 'telepon_pelapor', 'email_pelapor']);

export const BATAS_LAMPIRAN = Object.freeze({
  maksBerkas: 5,
  maksPerBerkasByte: 20 * 1024 * 1024,
  maksTotalByte: 40 * 1024 * 1024,
  ekstensi: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4'],
});

export const DESKRIPSI_MIN = 30;

/** Kunci sessionStorage untuk "Simpan Draft" — HANYA isian non-identitas. */
export const KUNCI_DRAF = 'warkop_draf_pengaduan';

/**
 * Menyusun daftar field [nama, nilai] yang akan dikirim ke POST /api/pengaduan.
 * @param {{anonim:boolean, tokenFormulir:string, situsWeb?:string, nama?:string, nik?:string,
 *   telepon?:string, email?:string, kategori:string, wilayahId?:string, deskripsi:string}} state
 * @returns {Array<[string, string]>}
 */
export function susunMuatan(state) {
  const muatan = [
    ['token_formulir', String(state.tokenFormulir ?? '')],
    // Honeypot selalu ikut (harus kosong) agar server bisa memeriksanya.
    ['situs_web', String(state.situsWeb ?? '')],
    ['kategori_masalah', String(state.kategori ?? '')],
    ['deskripsi', String(state.deskripsi ?? '')],
  ];
  if (state.wilayahId !== undefined && state.wilayahId !== null && String(state.wilayahId) !== '') {
    muatan.push(['wilayah_id', String(state.wilayahId)]);
  }
  if (state.anonim) {
    // Anonim: hanya penanda; TIDAK ADA field identitas apa pun, apa pun isi state-nya.
    muatan.push(['anonim', '1']);
    return muatan;
  }
  muatan.push(['nama_pelapor', String(state.nama ?? '').trim()]);
  muatan.push(['nik_pelapor', String(state.nik ?? '').trim()]);
  muatan.push(['telepon_pelapor', String(state.telepon ?? '').trim()]);
  muatan.push(['email_pelapor', String(state.email ?? '').trim()]);
  return muatan;
}

/** Benar bila daftar muatan memuat salah satu field identitas. */
export function memuatIdentitas(muatan) {
  return muatan.some(([nama]) => FIELD_IDENTITAS.includes(nama));
}

/**
 * Validasi klien sebelum kirim — mencerminkan aturan server (lib/validasi/pengaduan.js)
 * agar pelapor mendapat umpan balik tanpa bolak-balik. Server tetap pagar utama.
 * @returns {{bidang:string, pesan:string}|null}
 */
export function validasiKlien(state) {
  if (!state.kategori) return { bidang: 'kategori_masalah', pesan: 'Kategori masalah wajib dipilih dari daftar' };
  const deskripsi = String(state.deskripsi ?? '').trim();
  if (deskripsi.length < DESKRIPSI_MIN) {
    return { bidang: 'deskripsi', pesan: `Deskripsi kejadian wajib diisi (minimal ${DESKRIPSI_MIN} karakter)` };
  }
  if (state.anonim) return null;
  const nama = String(state.nama ?? '').trim();
  if (nama.length < 3) return { bidang: 'nama_pelapor', pesan: 'Nama lengkap wajib diisi untuk laporan bernama (atau pilih laporan anonim)' };
  const nik = String(state.nik ?? '').replace(/\D/g, '');
  if (nik && nik.length !== 16) return { bidang: 'nik_pelapor', pesan: 'NIK harus 16 digit' };
  const telepon = String(state.telepon ?? '').trim();
  const email = String(state.email ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { bidang: 'email_pelapor', pesan: 'Alamat email tidak sah' };
  if (telepon && telepon.replace(/\D/g, '').length < 8) return { bidang: 'telepon_pelapor', pesan: 'Nomor telepon tidak sah' };
  if (!telepon && !email) {
    return { bidang: 'telepon_pelapor', pesan: 'Isi nomor telepon atau email agar kami bisa meminta klarifikasi (atau pilih laporan anonim)' };
  }
  return null;
}

function ekstensiBerkas(nama) {
  const m = /\.([a-z0-9]+)$/i.exec(String(nama ?? ''));
  return m ? m[1].toLowerCase() : '';
}

/**
 * Menggabungkan lampiran lama + baru dengan batas klien: maks 5 berkas, 20 MB/berkas, total 40 MB,
 * ekstensi jpg/jpeg/png/webp/pdf/mp4. Berkas hanya butuh {name, size} (File atau objek biasa).
 * @returns {{berkas:Array, galat:string|null}}
 */
export function gabungLampiran(lama, baru) {
  const hasil = [...lama];
  let galat = null;
  for (const b of baru) {
    if (hasil.length >= BATAS_LAMPIRAN.maksBerkas) { galat = `Maksimal ${BATAS_LAMPIRAN.maksBerkas} berkas lampiran`; break; }
    if (!BATAS_LAMPIRAN.ekstensi.includes(ekstensiBerkas(b.name))) {
      galat = `Berkas "${b.name}" ditolak: format harus JPG, PNG, WebP, PDF, atau MP4`; continue;
    }
    if (b.size > BATAS_LAMPIRAN.maksPerBerkasByte) {
      galat = `Berkas "${b.name}" melebihi 20 MB`; continue;
    }
    const total = hasil.reduce((j, x) => j + x.size, 0) + b.size;
    if (total > BATAS_LAMPIRAN.maksTotalByte) { galat = 'Total lampiran maksimal 40 MB'; continue; }
    if (hasil.some((x) => x.name === b.name && x.size === b.size)) continue; // sudah ada
    hasil.push(b);
  }
  return { berkas: hasil, galat };
}

/** Ukuran berkas dalam format ringkas Indonesia (KB/MB, koma desimal). */
export function formatUkuran(byte) {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(0)} KB`;
  return `${(byte / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** Ikon daftar berkas menurut ekstensi (Ikon.js hanya punya 77 nama). */
export function ikonBerkas(nama) {
  const e = ekstensiBerkas(nama);
  if (e === 'pdf') return 'article';
  if (e === 'mp4') return 'play_arrow';
  return 'image';
}
