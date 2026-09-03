// lib/unggahan.js — penerimaan berkas unggahan (TAHAP-05 aturan wajib):
//   * tipe hanya jpg/png/webp (Tahap 6 menambah pdf/mp4 lewat parameter `jenis`),
//   * ukuran dari UPLOAD_MAX_MB,
//   * MAGIC BYTES diperiksa — bukan ekstensi, bukan Content-Type (keduanya mudah dipalsukan),
//   * nama berkas DIGANTI ACAK (crypto) — nama dari pengguna tidak pernah dipakai (path traversal),
//   * gambar dikompres ulang dengan sharp (menghapus metadata & muatan tersembunyi, menyeragamkan ukuran),
//   * disimpan di UPLOAD_DIR/<subfolder>/<acak>.<ext>; disajikan oleh app/unggahan/[...jalur]/route.js
//     (bukan public/ — Next.js produksi tidak melayani berkas yang ditambah setelah server mulai,
//     temuan Tahap 3) tanpa hak eksekusi (mode 0o644).
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

const JENIS_GAMBAR = Object.freeze({
  'image/jpeg': { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  'image/webp': { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]] },
});
// Tahap 6 (lampiran pengaduan): PDF dan MP4 — magic bytes ikut disiapkan di sini agar satu sumber.
export const JENIS_LAMPIRAN = Object.freeze({
  ...JENIS_GAMBAR,
  'application/pdf': { ext: 'pdf', magic: [[0x25, 0x50, 0x44, 0x46, 0x2d]] },
  'video/mp4': { ext: 'mp4', magic: [[null, null, null, null, 0x66, 0x74, 0x79, 0x70]] }, // ....ftyp
});

export class GalatUnggahan extends Error {
  constructor(pesan, kode, status = 400) { super(pesan); this.kode = kode; this.status = status; }
}

function direktoriUnggahan() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'unggahan'));
}

/**
 * Direktori TERJAGA untuk lampiran pengaduan — WAJIB di luar public/ (TEMUAN uji k Tahap 6: berkas apa pun
 * di bawah public/ dilayani statis oleh Next.js saat server mulai, melewati pagar peran route API).
 * Produksi: UPLOAD_PRIVATE_DIR=/app/unggahan-terjaga (volume terpisah, lihat PENERAPAN.md).
 */
function direktoriTerjaga() {
  return path.resolve(process.env.UPLOAD_PRIVATE_DIR || path.join(process.cwd(), 'unggahan-terjaga'));
}

export function batasByte() {
  const mb = Number(process.env.UPLOAD_MAX_MB) || 20;
  return mb * 1024 * 1024;
}

/** Mengenali tipe dari MAGIC BYTES buffer; null bila tidak cocok satu pun. */
export function kenaliTipe(buffer, daftar = JENIS_GAMBAR) {
  for (const [mime, def] of Object.entries(daftar)) {
    for (const tanda of def.magic) {
      if (buffer.length < tanda.length) continue;
      let cocok = true;
      for (let i = 0; i < tanda.length; i++) {
        if (tanda[i] !== null && buffer[i] !== tanda[i]) { cocok = false; break; }
      }
      if (cocok) return { mime, ext: def.ext };
    }
  }
  return null;
}

/** Subfolder boleh bersarang (mis. pengaduan/<acak>); tiap segmen dibersihkan, tanpa ../ */
function bersihkanSub(subfolder, bawaan) {
  return String(subfolder ?? '').split('/').map((s) => s.replace(/[^a-z0-9_-]/gi, '')).filter(Boolean).join('/') || bawaan;
}

function namaAcak(ext) {
  return `${randomBytes(16).toString('hex')}.${ext}`;
}

/**
 * Menyimpan GAMBAR unggahan: validasi ukuran + magic bytes, kompres ulang dengan sharp
 * (JPEG/WebP kualitas 82, lebar maks 1920, metadata dibuang), nama acak, mode 0644.
 * @param {Buffer} buffer isi berkas
 * @param {{subfolder?: string, maksByte?: number, lebarMaks?: number}} opsi
 * @returns {{jalur: string, namaBerkas: string, tipeMime: string, ukuran: number, lebar: number, tinggi: number}}
 *   `jalur` = jalur URL publik (/unggahan/<subfolder>/<acak>.<ext>)
 */
export async function simpanGambar(buffer, { subfolder = 'gambar', maksByte = batasByte(), lebarMaks = 1920 } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new GalatUnggahan('Berkas kosong', 'BERKAS_KOSONG');
  if (buffer.length > maksByte) {
    throw new GalatUnggahan(`Ukuran berkas melebihi batas ${Math.round(maksByte / 1024 / 1024)} MB`, 'TERLALU_BESAR', 413);
  }
  const tipe = kenaliTipe(buffer, JENIS_GAMBAR);
  if (!tipe) throw new GalatUnggahan('Berkas bukan gambar JPG, PNG, atau WebP (isi berkas tidak cocok)', 'TIPE_TIDAK_SAH', 415);

  // Kompres ulang lewat sharp: apa pun isinya, keluaran adalah gambar baru tanpa metadata/muatan tersembunyi.
  let pipa = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate().resize({ width: lebarMaks, withoutEnlargement: true });
  if (tipe.ext === 'png') pipa = pipa.png({ compressionLevel: 9, palette: false });
  else if (tipe.ext === 'webp') pipa = pipa.webp({ quality: 82 });
  else pipa = pipa.jpeg({ quality: 82, mozjpeg: true });
  let keluaran, meta;
  try {
    const { data, info } = await pipa.toBuffer({ resolveWithObject: true });
    keluaran = data; meta = info;
  } catch {
    throw new GalatUnggahan('Gambar rusak atau tidak dapat diproses', 'GAMBAR_RUSAK', 415);
  }

  const sub = bersihkanSub(subfolder, 'gambar');
  const folder = path.join(direktoriUnggahan(), sub);
  await mkdir(folder, { recursive: true });
  const nama = namaAcak(tipe.ext);
  const jalurDisk = path.join(folder, nama);
  await writeFile(jalurDisk, keluaran, { mode: 0o644, flag: 'wx' });
  return { jalur: `/unggahan/${sub}/${nama}`, namaBerkas: nama, tipeMime: tipe.mime, ukuran: keluaran.length, lebar: meta.width, tinggi: meta.height };
}

/**
 * Menyimpan LAMPIRAN (Tahap 6): jpg/png/webp/pdf/mp4 — gambar lewat simpanGambar; pdf/mp4 disimpan
 * apa adanya setelah magic bytes cocok. Nama acak, mode 0644.
 */
export async function simpanLampiran(buffer, { subfolder = 'lampiran', maksByte = batasByte(), terjaga = false } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new GalatUnggahan('Berkas kosong', 'BERKAS_KOSONG');
  if (buffer.length > maksByte) throw new GalatUnggahan(`Ukuran berkas melebihi batas ${Math.round(maksByte / 1024 / 1024)} MB`, 'TERLALU_BESAR', 413);
  const tipe = kenaliTipe(buffer, JENIS_LAMPIRAN);
  if (!tipe) throw new GalatUnggahan('Format tidak didukung (JPG, PNG, WebP, PDF, MP4)', 'TIPE_TIDAK_SAH', 415);
  if (tipe.mime.startsWith('image/') && !terjaga) return simpanGambar(buffer, { subfolder, maksByte });
  const sub = bersihkanSub(subfolder, 'lampiran');
  const akar = terjaga ? direktoriTerjaga() : direktoriUnggahan();
  const folder = path.join(akar, sub);
  await mkdir(folder, { recursive: true });
  const nama = namaAcak(tipe.ext);
  // Gambar di jalur terjaga tetap dikompres ulang sharp (metadata/muatan tersembunyi dibuang)
  let isi = buffer;
  if (tipe.mime.startsWith('image/')) {
    try {
      let pipa = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate().resize({ width: 1920, withoutEnlargement: true });
      pipa = tipe.ext === 'png' ? pipa.png({ compressionLevel: 9 }) : tipe.ext === 'webp' ? pipa.webp({ quality: 82 }) : pipa.jpeg({ quality: 82, mozjpeg: true });
      isi = await pipa.toBuffer();
    } catch {
      throw new GalatUnggahan('Gambar rusak atau tidak dapat diproses', 'GAMBAR_RUSAK', 415);
    }
  }
  await writeFile(path.join(folder, nama), isi, { mode: 0o644, flag: 'wx' });
  // Jalur terjaga diberi awalan /terjaga/ (bukan /unggahan/) — hanya bisa dibaca lewat jalurDiskTerjaga().
  return { jalur: `${terjaga ? '/terjaga' : '/unggahan'}/${sub}/${nama}`, namaBerkas: nama, tipeMime: tipe.mime, ukuran: isi.length };
}

/**
 * Menyelesaikan jalur URL /unggahan/<sub>/<nama> menjadi jalur disk yang AMAN
 * (tanpa keluar dari UPLOAD_DIR). Mengembalikan null bila tidak sah / tidak ada.
 */
export async function jalurDiskUnggahan(segmen) {
  const bagian = (Array.isArray(segmen) ? segmen : [segmen]).map(String);
  if (bagian.length < 1 || bagian.some((s) => !/^[a-z0-9_.-]+$/i.test(s) || s.startsWith('.'))) return null;
  const akar = direktoriUnggahan();
  const jalur = path.resolve(akar, ...bagian);
  if (!jalur.startsWith(akar + path.sep)) return null;
  try {
    const s = await stat(jalur);
    if (!s.isFile()) return null;
    return { jalur, ukuran: s.size, diubah: s.mtime };
  } catch {
    return null;
  }
}

/** Sama seperti jalurDiskUnggahan, tetapi di direktori TERJAGA (lampiran pengaduan). */
export async function jalurDiskTerjaga(segmen) {
  const bagian = (Array.isArray(segmen) ? segmen : [segmen]).map(String);
  if (bagian.length < 1 || bagian.some((s) => !/^[a-z0-9_.-]+$/i.test(s) || s.startsWith('.'))) return null;
  const akar = direktoriTerjaga();
  const jalur = path.resolve(akar, ...bagian);
  if (!jalur.startsWith(akar + path.sep)) return null;
  try {
    const s = await stat(jalur);
    if (!s.isFile()) return null;
    return { jalur, ukuran: s.size, diubah: s.mtime };
  } catch {
    return null;
  }
}

export const MIME_DARI_EKSTENSI = Object.freeze({
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', mp4: 'video/mp4',
});
