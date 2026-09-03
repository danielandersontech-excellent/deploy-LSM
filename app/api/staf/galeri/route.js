// /api/staf/galeri — GET daftar (konten_lihat), POST buat (konten_kelola).
// POST menerima multipart/form-data: field teks (judul, deskripsi, jenis, kategori, wilayah_id, lokasi,
// tanggal_kegiatan) + `berkas` (jpg/png/webp foto; mp4 video) + `thumbnail` opsional (gambar).
// Aturan unggahan (lib/galeriUnggah.js): magic bytes, nama acak, sharp, mode 0644.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilGaleri, buatGaleri, ambilGaleriById } from '@/lib/db/galeri';
import { validasiGaleri, GalatValidasiKonten } from '@/lib/validasi/konten';
import { bacaMuatanGaleri, simpanBerkasGaleri } from '@/lib/galeriUnggah';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.konten_lihat, async (request) => {
  const sp = request.nextUrl.searchParams;
  const hasil = await ambilGaleri({ kategori: sp.get('kategori') || null, halaman: sp.get('halaman'), perHalaman: sp.get('perHalaman') || 60 });
  return NextResponse.json(hasil, { headers: { 'cache-control': 'no-store' } });
});

export const POST = denganPeran(HAK.konten_kelola, async (request, _k, pengguna) => {
  const { data, berkas, thumbnail } = await bacaMuatanGaleri(request);
  const jenis = data.jenis === 'video' ? 'video' : 'foto';
  const jalurBerkas = await simpanBerkasGaleri(berkas, jenis);
  const jalurThumb = await simpanBerkasGaleri(thumbnail, 'foto');
  let m;
  try { m = validasiGaleri({ ...data, jenis, berkas: jalurBerkas ?? data.berkas, thumbnail: jalurThumb ?? data.thumbnail }); } catch (g) { if (g instanceof GalatValidasiKonten) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  const id = await buatGaleri(m);
  await catatAudit({ userId: pengguna.id, aksi: 'galeri_buat', tabelTerkait: 'galeri', idTerkait: id, detail: { judul: m.judul, jenis }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ galeri: await ambilGaleriById(id) }, { status: 201, headers: { 'cache-control': 'no-store' } });
});
