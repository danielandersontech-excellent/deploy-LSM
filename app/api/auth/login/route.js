// POST /api/auth/login — lapisan 1. Verifikasi bcrypt, terbitkan JWT di cookie httpOnly.
// Pesan galat kredensial SELALU sama (email tidak ada = kata sandi salah = akun nonaktif),
// agar tidak membocorkan email mana yang terdaftar. Rate limit dua sumbu (lib/auth/pembatasLaju.js).
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cariUserByEmail, catatTerakhirMasuk } from '@/lib/db/users';
import { catatAudit } from '@/lib/db/audit';
import { terbitkanToken } from '@/lib/auth/jwt';
import { NAMA_COOKIE, opsiCookieSesi, alamatIpPermintaan } from '@/lib/auth/sesi';
import { periksaBatasLogin, catatGagalLogin, catatBerhasilLogin } from '@/lib/auth/pembatasLaju';
import { balasGalat, periksaAsal, GalatHttp } from '@/lib/auth/penjaga';

export const dynamic = 'force-dynamic';

const PESAN_KREDENSIAL = 'Email atau kata sandi tidak sesuai';
// Hash penampung agar waktu balasan untuk email yang tidak terdaftar setara dengan yang terdaftar.
const HASH_PENAMPUNG = bcrypt.hashSync('penampung-waktu-konstan', 12);

export async function POST(request) {
  // Tahap 9 B5: login pun wajib same-origin bila peramban mengirim Origin/Referer (mencegah login-CSRF).
  try { periksaAsal(request); } catch (g) { if (g instanceof GalatHttp) return balasGalat(g.status, g.message, g.kode); throw g; }
  let badan;
  try { badan = await request.json(); } catch { return balasGalat(400, 'Badan permintaan harus JSON', 'BADAN_TIDAK_SAH'); }
  const email = String(badan?.email ?? '').trim().toLowerCase();
  const kataSandi = String(badan?.kataSandi ?? '');
  if (!email || !kataSandi || email.length > 190 || kataSandi.length > 200) {
    return balasGalat(400, 'Email dan kata sandi wajib diisi', 'MASUKAN_TIDAK_LENGKAP');
  }

  const ip = await alamatIpPermintaan(request);
  const batas = periksaBatasLogin(ip, email);
  if (batas.dibatasi) {
    return balasGalat(429, 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.', 'TERLALU_BANYAK_PERCOBAAN', { cobaLagiDetik: batas.sisaDetik });
  }

  const pengguna = await cariUserByEmail(email);
  // Selalu jalankan bcrypt.compare agar durasinya tidak membedakan email terdaftar/tidak.
  const cocok = await bcrypt.compare(kataSandi, pengguna?.kata_sandi_hash && pengguna.kata_sandi_hash !== '!' ? pengguna.kata_sandi_hash : HASH_PENAMPUNG);
  if (!pengguna || !cocok || !pengguna.aktif) {
    catatGagalLogin(ip, email);
    await catatAudit({ userId: pengguna?.id ?? null, aksi: 'login_gagal', tabelTerkait: 'users', idTerkait: pengguna?.id ?? null, detail: { alasan: !pengguna ? 'email' : !cocok ? 'sandi' : 'nonaktif' }, ip });
    return balasGalat(401, PESAN_KREDENSIAL, 'KREDENSIAL_TIDAK_SESUAI');
  }

  catatBerhasilLogin(email);
  const token = await terbitkanToken(pengguna);
  await catatTerakhirMasuk(pengguna.id);
  await catatAudit({ userId: pengguna.id, aksi: 'login_berhasil', tabelTerkait: 'users', idTerkait: pengguna.id, detail: null, ip });

  const balasan = NextResponse.json(
    { pengguna: { id: pengguna.id, nama: pengguna.nama, email: pengguna.email, peran: pengguna.peran, wilayah_id: pengguna.wilayah_id }, tujuan: '/staf/dashboard' },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
  balasan.cookies.set(NAMA_COOKIE, token, opsiCookieSesi(request));
  return balasan;
}
