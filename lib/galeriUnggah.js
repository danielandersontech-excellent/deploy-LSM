// lib/galeriUnggah.js — pembantu unggahan galeri (Tahap 7), dipakai route /api/staf/galeri dan [id].
// Aturan unggahan sama ketatnya dengan Tahap 5/6: magic bytes, nama acak, sharp untuk gambar, mode 0644.
// KEPUTUSAN BARU: thumbnail video TIDAK dibangkitkan otomatis (tidak ada ffmpeg dan tidak ada paket video di
// daftar yang diizinkan) — redaktur mengunggah thumbnail sendiri; tanpa thumbnail, kartu memakai penampung.
import { GalatHttp } from './auth/penjaga.js';
import { simpanGambar, simpanLampiran, GalatUnggahan, batasByte, kenaliTipe, JENIS_LAMPIRAN } from './unggahan.js';

/** Membaca multipart: {data, berkas, thumbnail}. JSON juga diterima (tanpa berkas — PATCH metadata). */
export async function bacaMuatanGaleri(request) {
  const tipe = request.headers.get('content-type') || '';
  // Pra-cek Content-Length: multipart di atas batas tidak diurai (formData() gagal di ~10 MB) -> 413 yang jelas.
  const panjang = Number(request.headers.get('content-length') || 0);
  if (tipe.includes('multipart/form-data') && panjang > batasByte() + 2 * 1024 * 1024) {
    throw new GalatHttp(413, `Kiriman terlalu besar: berkas maksimal ${Math.round(batasByte() / 1024 / 1024)} MB`, 'TERLALU_BESAR');
  }
  const data = {}; let berkas = null, thumbnail = null;
  try {
    if (tipe.includes('multipart/form-data')) {
      const form = await request.formData();
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') data[k] = v;
        else if (k === 'berkas') berkas = v;
        else if (k === 'thumbnail') thumbnail = v;
      }
    } else {
      Object.assign(data, await request.json());
    }
  } catch {
    if (panjang > 9 * 1024 * 1024) throw new GalatHttp(413, 'Kiriman terlalu besar untuk diurai (batas praktis ±9 MB per permintaan multipart)', 'TERLALU_BESAR');
    throw new GalatHttp(400, 'Muatan tidak sah (multipart/form-data atau JSON)', 'MUATAN_TIDAK_SAH');
  }
  return { data, berkas, thumbnail };
}

/** Simpan berkas galeri sesuai jenis ('foto' | 'video'); mengembalikan jalur URL publik atau null bila tidak ada berkas. */
export async function simpanBerkasGaleri(file, jenis) {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  if (file.size > batasByte()) throw new GalatHttp(413, `Berkas melebihi batas ${Math.round(batasByte() / 1024 / 1024)} MB`, 'TERLALU_BESAR');
  const buffer = Buffer.from(await file.arrayBuffer());
  const t = kenaliTipe(buffer, JENIS_LAMPIRAN);
  if (!t) throw new GalatHttp(415, 'Berkas harus JPG, PNG, WebP (foto) atau MP4 (video) — isi berkas tidak cocok', 'TIPE_TIDAK_SAH');
  try {
    if (jenis === 'video') {
      if (t.mime !== 'video/mp4') throw new GalatHttp(415, 'Galeri video hanya menerima MP4', 'TIPE_TIDAK_SAH');
      return (await simpanLampiran(buffer, { subfolder: 'galeri' })).jalur;
    }
    if (!t.mime.startsWith('image/')) throw new GalatHttp(415, 'Galeri foto hanya menerima JPG, PNG, WebP', 'TIPE_TIDAK_SAH');
    return (await simpanGambar(buffer, { subfolder: 'galeri' })).jalur;
  } catch (g) {
    if (g instanceof GalatUnggahan) throw new GalatHttp(g.status, g.message, g.kode);
    throw g;
  }
}
