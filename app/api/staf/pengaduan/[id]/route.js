// /api/staf/pengaduan/[id]
//   GET   — detail pengaduan + riwayat + lampiran (verifikator, superadmin, pimpinan_wilayah).
//           Identitas pelapor HANYA superadmin/verifikator (kolom tidak di-SELECT untuk peran lain);
//           setiap pembukaan identitas dicatat di audit_log (REFERENSI 11 catatan 2).
//           pimpinan_wilayah dibatasi wilayahnya di SQL (wilayah lain -> 404, keberadaan tidak bocor).
//   PATCH — penugasan petugas { petugas_id: number|null } (verifikator, superadmin). Status TIDAK
//           bisa diubah di sini (hanya /status lewat buku besar).
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK, bolehLihatIdentitas, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilPengaduan, ambilRiwayat, ambilLampiran, tugaskanPetugas } from '@/lib/db/pengaduan';
import { ambilUser } from '@/lib/db/users';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

async function idDari(params) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  return n;
}

export const GET = denganPeran(HAK.pengaduan_lihat, async (request, { params }, pengguna) => {
  const idAngka = await idDari(params);
  const lihatIdentitas = bolehLihatIdentitas(pengguna.peran);
  const pengaduan = await ambilPengaduan(idAngka, { bolehLihatIdentitas: lihatIdentitas, wilayahId: wilayahTerbatas(pengguna) });
  if (!pengaduan) throw new GalatHttp(404, 'Pengaduan tidak ditemukan', 'TIDAK_DITEMUKAN');

  const [riwayat, lampiran] = await Promise.all([ambilRiwayat(idAngka), ambilLampiran(idAngka)]);
  if (lihatIdentitas && !pengaduan.anonim) {
    await catatAudit({ userId: pengguna.id, aksi: 'lihat_identitas_pelapor', tabelTerkait: 'pengaduan', idTerkait: idAngka, ip: await alamatIpPermintaan(request) });
  }
  // Lampiran: `path` disk tidak dibalas; klien memakai URL terjaga per lampiran.
  const lampiranAman = lampiran.map((l) => ({ id: l.id, namaBerkas: l.nama_berkas, tipeMime: l.tipe_mime, ukuran: l.ukuran, dibuatPada: l.dibuat_pada, url: `/api/staf/pengaduan/${idAngka}/lampiran/${l.id}` }));
  return NextResponse.json({ pengaduan, riwayat, lampiran: lampiranAman }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.pengaduan_ubah_status, async (request, { params }, pengguna) => {
  const idAngka = await idDari(params);
  const body = await bacaJson(request);
  if (!body || !Object.prototype.hasOwnProperty.call(body, 'petugas_id')) {
    throw new GalatHttp(422, "Hanya 'petugas_id' yang boleh diubah lewat PATCH (status lewat /status)", 'MUATAN_TIDAK_SAH');
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    throw new GalatHttp(422, 'Status hanya boleh diubah lewat /status (buku besar)', 'STATUS_LEWAT_BUKU_BESAR');
  }
  const ada = await ambilPengaduan(idAngka, { bolehLihatIdentitas: false });
  if (!ada) throw new GalatHttp(404, 'Pengaduan tidak ditemukan', 'TIDAK_DITEMUKAN');
  let petugasId = null;
  if (body.petugas_id !== null && body.petugas_id !== '') {
    petugasId = Number(body.petugas_id);
    if (!Number.isInteger(petugasId) || petugasId <= 0) throw new GalatHttp(422, 'petugas_id tidak sah', 'PETUGAS_TIDAK_SAH');
    const petugas = await ambilUser(petugasId);
    if (!petugas || !petugas.aktif || !HAK.pengaduan_ubah_status.includes(petugas.peran)) {
      throw new GalatHttp(422, 'Petugas harus akun aktif berperan verifikator atau superadmin', 'PETUGAS_TIDAK_SAH');
    }
  }
  await tugaskanPetugas(idAngka, petugasId);
  await catatAudit({ userId: pengguna.id, aksi: 'pengaduan_tugaskan', tabelTerkait: 'pengaduan', idTerkait: idAngka,
    detail: { dari: ada.petugas_id ?? null, ke: petugasId }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengaduan: await ambilPengaduan(idAngka, { bolehLihatIdentitas: false }) }, { headers: { 'cache-control': 'no-store' } });
});
