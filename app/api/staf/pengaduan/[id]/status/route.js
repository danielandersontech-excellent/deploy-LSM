// POST /api/staf/pengaduan/[id]/status — ubah status pengaduan (verifikator, superadmin).
// SATU-SATUNYA jalan mengubah status = ubahStatusPengaduan() (buku besar, satu transaksi).
// Catatan internal WAJIB (TAHAP-06 §7) — tanpa catatan ditolak 422. pimpinan_wilayah -> 403 (HAK).
// Body JSON: { status: 'diverifikasi'|'diproses'|'selesai'|'ditolak'|'baru', catatan: '…' }.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilPengaduan, ubahStatusPengaduan, ambilRiwayat } from '@/lib/db/pengaduan';
import { SLUG_STATUS_PENGADUAN } from '@/lib/kategoriPengaduan';
import { CATATAN_MIN } from '@/lib/validasi/pengaduan';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const POST = denganPeran(HAK.pengaduan_ubah_status, async (request, { params }, pengguna) => {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  const body = await bacaJson(request);
  const status = String(body?.status ?? '').trim();
  const catatan = String(body?.catatan ?? '').replace(/\s+/g, ' ').trim().slice(0, 2000);
  if (!SLUG_STATUS_PENGADUAN.includes(status)) throw new GalatHttp(422, 'Status tidak dikenal', 'STATUS_TIDAK_SAH');
  if (catatan.length < CATATAN_MIN) throw new GalatHttp(422, `Catatan internal wajib diisi (minimal ${CATATAN_MIN} karakter) — setiap perubahan status harus bisa ditelusuri alasannya`, 'CATATAN_WAJIB');

  // Pengaduan harus ada (tanpa identitas di sini — hanya memeriksa keberadaan & status).
  const ada = await ambilPengaduan(n, { bolehLihatIdentitas: false });
  if (!ada) throw new GalatHttp(404, 'Pengaduan tidak ditemukan', 'TIDAK_DITEMUKAN');
  if (ada.status === status) throw new GalatHttp(422, `Pengaduan sudah berstatus '${status}'`, 'STATUS_SAMA');

  let hasil;
  try {
    hasil = await ubahStatusPengaduan(n, { statusBaru: status, catatan, olehUserId: pengguna.id });
  } catch (galat) {
    if (galat?.kode === 'TIDAK_DITEMUKAN') throw new GalatHttp(404, 'Pengaduan tidak ditemukan', 'TIDAK_DITEMUKAN');
    if (galat?.kode === 'STATUS_TIDAK_SAH') throw new GalatHttp(422, galat.message, galat.kode);
    throw galat;
  }
  await catatAudit({ userId: pengguna.id, aksi: 'pengaduan_ubah_status', tabelTerkait: 'pengaduan', idTerkait: n,
    detail: { dari: hasil.statusSebelum, ke: hasil.statusSesudah, riwayatId: hasil.riwayatId }, ip: await alamatIpPermintaan(request) });
  // Balasan TANPA identitas (pembukaan identitas hanya lewat GET detail yang mencatat audit).
  const [pengaduan, riwayat] = await Promise.all([
    ambilPengaduan(n, { bolehLihatIdentitas: false }),
    ambilRiwayat(n),
  ]);
  return NextResponse.json({ pengaduan, riwayat, perubahan: hasil }, { headers: { 'cache-control': 'no-store' } });
});
