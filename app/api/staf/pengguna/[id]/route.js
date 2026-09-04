// /api/staf/pengguna/[id] — superadmin SAJA. GET, PATCH (nama, email, peran, wilayah_id, aktif), DELETE.
// Perlindungan (TAHAP-07 §6.3): tidak boleh menonaktifkan/menghapus DIRI SENDIRI; tidak boleh
// menonaktifkan/menurunkan peran/menghapus SUPERADMIN TERAKHIR yang aktif — agar sistem tidak terkunci.
// DELETE fisik gagal bila pengguna punya artikel/riwayat (FK RESTRICT) -> 409, sarankan nonaktifkan.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilUser, perbaruiUser, hapusUser, hitungJejakUser, cariUserByEmail, hitungSuperadminAktif, naikkanTokenVersion, ubahEmailUser } from '@/lib/db/users';
import { validasiPengguna, GalatValidasiPengguna } from '@/lib/validasi/pengguna';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

async function idDari(params) {
  const { id } = await params; const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  return n;
}

export const GET = denganPeran(HAK.pengguna_kelola, async (_r, { params }) => {
  const id = await idDari(params);
  const u = await ambilUser(id);
  if (!u) throw new GalatHttp(404, 'Pengguna tidak ditemukan', 'TIDAK_DITEMUKAN');
  return NextResponse.json({ pengguna: u }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.pengguna_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilUser(id);
  if (!lama) throw new GalatHttp(404, 'Pengguna tidak ditemukan', 'TIDAK_DITEMUKAN');
  const body = await bacaJson(request);
  let m;
  try { m = validasiPengguna({ ...lama, wilayah_id: lama.wilayah_id, ...body }); } catch (g) { if (g instanceof GalatValidasiPengguna) throw new GalatHttp(g.status, g.message, g.kode); throw g; }

  const diriSendiri = Number(id) === Number(pengguna.id);
  if (diriSendiri && (!m.aktif || m.peran !== 'superadmin')) {
    throw new GalatHttp(422, 'Anda tidak dapat menonaktifkan atau menurunkan peran akun Anda sendiri', 'DIRI_SENDIRI');
  }
  if (lama.peran === 'superadmin' && lama.aktif && (!m.aktif || m.peran !== 'superadmin')) {
    if ((await hitungSuperadminAktif()) <= 1) throw new GalatHttp(422, 'Tidak dapat menonaktifkan/menurunkan superadmin terakhir yang aktif', 'SUPERADMIN_TERAKHIR');
  }
  if (m.email !== lama.email) {
    const ada = await cariUserByEmail(m.email);
    if (ada && Number(ada.id) !== id) throw new GalatHttp(409, 'Email sudah dipakai pengguna lain', 'EMAIL_DUPLIKAT');
  }
  await perbaruiUser(id, { nama: m.nama, peran: m.peran, wilayahId: m.wilayahId, aktif: m.aktif });
  if (m.email !== lama.email) await ubahEmailUser(id, m.email);
  // Perubahan peran/nonaktif membatalkan sesi lama pengguna itu (token_version naik)
  if (m.peran !== lama.peran || (!m.aktif && lama.aktif)) await naikkanTokenVersion(id);
  await catatAudit({ userId: pengguna.id, aksi: 'pengguna_ubah', tabelTerkait: 'users', idTerkait: id,
    detail: { peran: m.peran, aktif: m.aktif, emailBerubah: m.email !== lama.email }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengguna: await ambilUser(id) }, { headers: { 'cache-control': 'no-store' } });
});

export const DELETE = denganPeran(HAK.pengguna_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilUser(id);
  if (!lama) throw new GalatHttp(404, 'Pengguna tidak ditemukan', 'TIDAK_DITEMUKAN');
  if (Number(id) === Number(pengguna.id)) throw new GalatHttp(422, 'Anda tidak dapat menghapus akun Anda sendiri', 'DIRI_SENDIRI');
  if (lama.peran === 'superadmin' && lama.aktif && (await hitungSuperadminAktif()) <= 1) {
    throw new GalatHttp(422, 'Tidak dapat menghapus superadmin terakhir yang aktif', 'SUPERADMIN_TERAKHIR');
  }
  // Tahap 9: pengguna yang sudah meninggalkan jejak (audit, riwayat pengaduan, penugasan, artikel) TIDAK dihapus —
  // FK SET NULL akan menghilangkan pelaku dari jejak. Nonaktifkan saja (PATCH {aktif:false}).
  const jejak = await hitungJejakUser(id);
  if (jejak.audit + jejak.riwayat + jejak.petugas + jejak.artikel > 0) {
    throw new GalatHttp(409, `Pengguna memiliki jejak (audit ${jejak.audit}, riwayat pengaduan ${jejak.riwayat}, penugasan ${jejak.petugas}, artikel ${jejak.artikel}) sehingga tidak dapat dihapus, nonaktifkan akunnya saja`, 'PUNYA_DATA');
  }
  try {
    await hapusUser(id);
  } catch (g) {
    if (g?.code === 'ER_ROW_IS_REFERENCED_2' || g?.errno === 1451) {
      throw new GalatHttp(409, 'Pengguna memiliki data terkait sehingga tidak dapat dihapus, nonaktifkan akunnya saja', 'PUNYA_DATA');
    }
    throw g;
  }
  await catatAudit({ userId: pengguna.id, aksi: 'pengguna_hapus', tabelTerkait: 'users', idTerkait: id, detail: { peran: lama.peran }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ dihapus: true, id }, { headers: { 'cache-control': 'no-store' } });
});
