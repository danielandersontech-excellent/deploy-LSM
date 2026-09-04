# QA-2 B0a — suntingan kode (dijalankan sekali; disimpan sebagai jejak perubahan)
import os

def baca(p): return open(p, encoding='utf-8').read()
def tulis(p, s): open(p, 'w', encoding='utf-8').write(s)

# --- skrip uji: dua akun (A: sah/basi/kadaluarsa, B: wajib)
p = 'laporan/bukti-qa-2/skrip/uji-b0a-sesi.mjs'; s = baca(p)
lama = s[s.index("// wajib ganti sandi: reset oleh superadmin lalu login dengan sandi sementara"):s.index("const KEADAAN = ")]
baru = """// sesi SAH normal akun A (login terakhir; token_version terbaru)
const tkSahNormal = (await login(emailUji, sandi)).tk; cek('sesi SAH akun A', !!tkSahNormal);
// akun B untuk keadaan wajib_ganti_sandi=1 (reset oleh superadmin lalu login dengan sandi sementara)
const emailB = `uji.b0a.b.${Date.now()}@warkopnusantara.id`; const rbB = await api('POST', '/api/staf/pengguna', admin.tk, { nama: 'Pengguna Uji B0a B', email: emailB, peran: 'penulis', kata_sandi: sandi, aktif: true }); const idB = (await rbB.json()).pengguna?.id;
const sementara = 'Sementara-B0a-2026!'; await api('POST', `/api/staf/pengguna/${idB}/reset-sandi`, admin.tk, { kata_sandi_baru: sementara });
const wajib2 = await login(emailB, sementara); cek('login akun B dengan sandi sementara (wajib_ganti_sandi=1)', wajib2.s === 200 && !!wajib2.tk);

"""
s = s.replace(lama, baru)
s = s.replace("else { const d = await api('PATCH', `/api/staf/pengguna/${idUji}`, admin.tk, { nama: 'Pengguna Uji B0a', email: emailUji, peran: 'penulis', aktif: false }); console.log(`  pengguna uji dinonaktifkan (${d.status}); PRODUKSI: hapus lewat SQL (SELECT dulu)`); }",
              "else { for (const [i, e] of [[idUji, emailUji], [idB, emailB]]) { const d = await api('PATCH', `/api/staf/pengguna/${i}`, admin.tk, { nama: 'Pengguna Uji B0a', email: e, peran: 'penulis', aktif: false }); console.log(`  pengguna uji ${e} dinonaktifkan (${d.status}); PRODUKSI: hapus lewat SQL (SELECT dulu)`); } }")
tulis(p, s); print('skrip B0a: dua akun')

# --- 1. proxy: /login tidak lagi dialihkan hanya karena cookie ada
p = 'proxy.js'; s = baca(p)
s = s.replace("""  if (jalurLogin && muatan) {
    return NextResponse.redirect(urlDariHeader(request, '/staf/dashboard'));
  }
""", """  // QA-2 B0a: /login TIDAK dialihkan di sini. Tanda tangan JWT sah bukan berarti sesi sah (token_version naik setelah
  // ganti sandi/paksa keluar). Halaman /login memverifikasi sesi PENUH ke DB: sah -> dashboard; cookie ada tapi tak sah ->
  // /api/auth/bersihkan-sesi (hapus cookie) -> formulir. Pengalihan di sini menyebabkan loop ERR_TOO_MANY_REDIRECTS.
""")
assert "jalurLogin && muatan" not in s; tulis(p, s); print('proxy ok')

# --- 2. route pembersih sesi
os.makedirs('app/api/auth/bersihkan-sesi', exist_ok=True)
tulis('app/api/auth/bersihkan-sesi/route.js', """// GET /api/auth/bersihkan-sesi?lanjut=/staf/... — QA-2 B0a: menghapus cookie sesi yang TIDAK SAH (basi/kadaluarsa/akun
// nonaktif) lalu mengalihkan ke /login?lanjut=... sehingga formulir login tampil tanpa loop. Tidak butuh sesi.
// Hanya cookie yang dihapus (tidak ada perubahan data); `lanjut` dibatasi jalur /staf/* agar tidak menjadi open redirect.
import { NextResponse } from 'next/server';
import { NAMA_COOKIE, opsiHapusCookieSesi } from '@/lib/auth/sesi';
import { urlDariHeader } from '@/proxy';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const lanjutMentah = request.nextUrl.searchParams.get('lanjut') || '/staf/dashboard';
  const lanjut = /^\\/staf(\\/[A-Za-z0-9\\-_/?=&%.]*)?$/.test(lanjutMentah) ? lanjutMentah : '/staf/dashboard';
  const balasan = NextResponse.redirect(urlDariHeader(request, `/login?lanjut=${encodeURIComponent(lanjut)}`), 307);
  balasan.cookies.set(NAMA_COOKIE, '', opsiHapusCookieSesi(request));
  balasan.headers.set('cache-control', 'no-store');
  return balasan;
}
"""); print('route bersihkan-sesi ok')

# --- 3. penjaga.requireUser
p = 'lib/auth/penjaga.js'; s = baca(p)
s = s.replace("import { ambilPenggunaSesi } from './sesi.js';", "import { cookies } from 'next/headers';\nimport { ambilPenggunaSesi, NAMA_COOKIE } from './sesi.js';")
s = s.replace("""  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect(`/login?lanjut=${encodeURIComponent(jalur)}`);
  if (!peranDiizinkan.includes(pengguna.peran)) redirect('/tanpa-akses');
  return pengguna;""", """  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) {
    // QA-2 B0a: cookie ADA tetapi sesi tidak sah (token_version naik / kadaluarsa / nonaktif) -> hapus cookie dulu lewat
    // /api/auth/bersihkan-sesi agar /login menampilkan formulir, bukan loop /login <-> /staf.
    const adaCookie = !!(await cookies()).get(NAMA_COOKIE)?.value;
    redirect(`${adaCookie ? '/api/auth/bersihkan-sesi' : '/login'}?lanjut=${encodeURIComponent(jalur)}`);
  }
  if (!peranDiizinkan.includes(pengguna.peran)) redirect('/tanpa-akses');
  return pengguna;""")
tulis(p, s); print('penjaga ok')

# --- 4. halaman /login: verifikasi sesi penuh
p = 'app/(auth)/login/page.js'; s = baca(p)
s = s.replace("import FormulirLogin from '@/components/staf/FormulirLogin';", "import FormulirLogin from '@/components/staf/FormulirLogin';\nimport { cookies } from 'next/headers';\nimport { redirect } from 'next/navigation';\nimport { ambilPenggunaSesi, NAMA_COOKIE } from '@/lib/auth/sesi';")
s = s.replace("""  const lanjut = typeof sp?.lanjut === 'string' && sp.lanjut.startsWith('/staf') ? sp.lanjut : '/staf/dashboard';
  return (""", """  const lanjut = typeof sp?.lanjut === 'string' && sp.lanjut.startsWith('/staf') ? sp.lanjut : '/staf/dashboard';
  // QA-2 B0a: keputusan "sudah masuk" dibuat DI SINI dengan verifikasi sesi PENUH (DB: aktif + token_version), bukan di
  // proxy (tanda tangan saja). Sesi sah -> dashboard (atau /staf/ganti-sandi bila wajib). Cookie ada tetapi tidak sah
  // (basi setelah ganti sandi/paksa keluar, kadaluarsa) -> hapus lewat /api/auth/bersihkan-sesi -> kembali ke sini tanpa cookie.
  const pengguna = await ambilPenggunaSesi();
  if (pengguna) redirect(Number(pengguna.wajib_ganti_sandi) === 1 ? '/staf/ganti-sandi' : lanjut);
  if ((await cookies()).get(NAMA_COOKIE)?.value) redirect(`/api/auth/bersihkan-sesi?lanjut=${encodeURIComponent(lanjut)}`);
  return (""")
tulis(p, s); print('login page ok')
