// POST /api/staf/ganti-sandi — pengguna mengganti kata sandinya SENDIRI (seluruh peran staf).
// Body: { kata_sandi_lama, kata_sandi_baru }. Setelah reset oleh superadmin (wajib_ganti_sandi=1) pengguna
// diarahkan ke /staf/ganti-sandi sampai mengganti. Berhasil -> wajib_ganti_sandi=0, token_version naik
// (sesi lain keluar) dan cookie sesi baru diterbitkan untuk peramban ini.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { cariUserByEmail, gantiSandiSendiri, naikkanTokenVersion, ambilUserUntukSesi } from '@/lib/db/users';
import { validasiKataSandi, GalatValidasiPengguna } from '@/lib/validasi/pengguna';
import { terbitkanToken } from '@/lib/auth/jwt';
import { NAMA_COOKIE, opsiCookieSesi, alamatIpPermintaan } from '@/lib/auth/sesi';
import { catatAudit } from '@/lib/db/audit';

export const dynamic = 'force-dynamic';

export const POST = denganPeran(HAK.ruang_staf, async (request, _k, pengguna) => {
  const body = await bacaJson(request);
  const lama = String(body?.kata_sandi_lama ?? body?.kataSandiLama ?? '');
  let baru;
  try { baru = validasiKataSandi(body?.kata_sandi_baru ?? body?.kataSandiBaru, 'kata_sandi_baru'); } catch (g) { if (g instanceof GalatValidasiPengguna) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  if (lama === baru) throw new GalatHttp(422, 'Kata sandi baru harus berbeda dari yang lama', 'SANDI_SAMA');
  const akun = await cariUserByEmail(pengguna.email);
  if (!akun || !(await bcrypt.compare(lama, akun.kata_sandi_hash))) throw new GalatHttp(401, 'Kata sandi lama tidak sesuai', 'SANDI_LAMA_SALAH');
  await gantiSandiSendiri(pengguna.id, await bcrypt.hash(baru, 12));
  await naikkanTokenVersion(pengguna.id);
  await catatAudit({ userId: pengguna.id, aksi: 'ganti_sandi_sendiri', tabelTerkait: 'users', idTerkait: pengguna.id, ip: await alamatIpPermintaan(request) });
  const segar = await ambilUserUntukSesi(pengguna.id);
  const token = await terbitkanToken(segar);
  const balasan = NextResponse.json({ diganti: true }, { headers: { 'cache-control': 'no-store' } });
  balasan.cookies.set(NAMA_COOKIE, token, opsiCookieSesi(request));
  return balasan;
});
