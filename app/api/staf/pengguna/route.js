// /api/staf/pengguna — superadmin SAJA. GET daftar (tanpa hash), POST buat (nama, email, peran, wilayah_id, aktif, kata_sandi).
// Setiap tindakan menulis audit_log.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilSemuaUser, buatUser, ambilUser, cariUserByEmail } from '@/lib/db/users';
import { validasiPengguna, GalatValidasiPengguna } from '@/lib/validasi/pengguna';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';
const BCRYPT_PUTARAN = 12;

export const GET = denganPeran(HAK.pengguna_kelola, async () => {
  const baris = await ambilSemuaUser();
  return NextResponse.json({ baris, total: baris.length }, { headers: { 'cache-control': 'no-store' } });
});

export const POST = denganPeran(HAK.pengguna_kelola, async (request, _k, pengguna) => {
  const body = await bacaJson(request);
  let m;
  try { m = validasiPengguna(body, { baru: true }); } catch (g) { if (g instanceof GalatValidasiPengguna) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  if (await cariUserByEmail(m.email)) throw new GalatHttp(409, 'Email sudah terdaftar', 'EMAIL_DUPLIKAT');
  const hash = await bcrypt.hash(m.kataSandi, BCRYPT_PUTARAN);
  const id = await buatUser({ nama: m.nama, email: m.email, kataSandiHash: hash, peran: m.peran, wilayahId: m.wilayahId, aktif: m.aktif });
  await catatAudit({ userId: pengguna.id, aksi: 'pengguna_buat', tabelTerkait: 'users', idTerkait: id, detail: { peran: m.peran }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengguna: await ambilUser(id) }, { status: 201, headers: { 'cache-control': 'no-store' } });
});
