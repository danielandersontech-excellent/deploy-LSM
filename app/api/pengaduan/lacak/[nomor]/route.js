// GET /api/pengaduan/lacak/[nomor] — pelacakan PUBLIK (tanpa login). TAHAP-06 §4.
// Yang dibalas: nomor kasus, kategori, wilayah, status, linimasa status + tanggal.
// TIDAK PERNAH: identitas pelapor, catatan internal, nama petugas (kolomnya tidak di-SELECT —
// lib/db ambilPengaduanByNomor memakai KOLOM_PUBLIK). Rate limit per IP (60 / 15 menit).
// Nomor tidak ada = pesan NETRAL 404 yang sama untuk semua kasus (tidak membedakan "tidak ada" /
// "tidak berhak"), agar keberadaan kasus tidak bocor lewat perbedaan pesan.
import { NextResponse } from 'next/server';
import { ambilPengaduanByNomor, nomorKasusValid } from '@/lib/db/pengaduan';
import { periksaLaju, pesanDibatasi } from '@/lib/pembatasLajuUmum';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { labelKategoriPengaduan, labelStatusPengaduan } from '@/lib/kategoriPengaduan';
import { PESAN_TIDAK_DITEMUKAN } from '@/lib/validasi/pengaduan';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const ip = await alamatIpPermintaan(request);
  const laju = periksaLaju('lacak', ip);
  if (laju.dibatasi) {
    return NextResponse.json({ galat: pesanDibatasi(laju.sisaDetik), kode: 'TERLALU_BANYAK', sisaDetik: laju.sisaDetik }, { status: 429, headers: { 'cache-control': 'no-store' } });
  }
  const { nomor } = await params;
  const bersih = String(nomor ?? '').trim().toUpperCase();
  // Format salah dan nomor tidak ada dibalas SAMA (netral) — tidak ada informasi tambahan.
  if (!nomorKasusValid(bersih)) {
    return NextResponse.json({ galat: PESAN_TIDAK_DITEMUKAN, kode: 'TIDAK_DITEMUKAN' }, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  try {
    const p = await ambilPengaduanByNomor(bersih);
    if (!p) return NextResponse.json({ galat: PESAN_TIDAK_DITEMUKAN, kode: 'TIDAK_DITEMUKAN' }, { status: 404, headers: { 'cache-control': 'no-store' } });
    return NextResponse.json({
      pengaduan: {
        nomorKasus: p.nomor_kasus,
        kategori: p.kategori_masalah,
        kategoriLabel: labelKategoriPengaduan(p.kategori_masalah),
        wilayah: p.wilayah_nama ?? null,
        status: p.status,
        statusLabel: labelStatusPengaduan(p.status),
        dibuatPada: p.dibuat_pada,
        diperbaruiPada: p.diperbarui_pada,
      },
      riwayat: p.riwayat.map((r) => ({ statusSebelum: r.status_sebelum, statusSesudah: r.status_sesudah, statusLabel: labelStatusPengaduan(r.status_sesudah), pada: r.dibuat_pada })),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (galat) {
    console.error('[api/pengaduan/lacak] galat:', galat?.message);
    return NextResponse.json({ galat: 'Terjadi kesalahan di server', kode: 'GALAT_SERVER' }, { status: 500 });
  }
}
