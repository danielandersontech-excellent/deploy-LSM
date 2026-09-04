// app/(auth)/login/page.js — /login. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM & kelas disalin apa adanya dari login_staff_warkop_nusantara/code.html.
// Perubahan yang diizinkan: (a) span material-symbols -> <Ikon>, (b) img googleusercontent
// -> next/image lokal (watermark = logo besar), (c) href="#" -> rute, (f) sintaks JSX.
// Formulir dan keadaannya (memuat, galat kredensial, akun nonaktif, terlalu banyak
// percobaan) ada di FormulirLogin (client component) dengan kelas yang sama persis.
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';
import FormulirLogin from '@/components/staf/FormulirLogin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ambilPenggunaSesi, NAMA_COOKIE } from '@/lib/auth/sesi';

export const metadata = { title: 'Masuk Staf' };

export default async function HalamanLogin({ searchParams }) {
  const sp = await searchParams;
  const lanjut = typeof sp?.lanjut === 'string' && sp.lanjut.startsWith('/staf') ? sp.lanjut : '/staf/dashboard';
  // QA-2 B0a: keputusan "sudah masuk" dibuat DI SINI dengan verifikasi sesi PENUH (DB: aktif + token_version), bukan di
  // proxy (tanda tangan saja). Sesi sah -> dashboard (atau /staf/ganti-sandi bila wajib). Cookie ada tetapi tidak sah
  // (basi setelah ganti sandi/paksa keluar, kadaluarsa) -> hapus lewat /api/auth/bersihkan-sesi -> kembali ke sini tanpa cookie.
  const pengguna = await ambilPenggunaSesi();
  if (pengguna) redirect(Number(pengguna.wajib_ganti_sandi) === 1 ? '/staf/ganti-sandi' : lanjut);
  if ((await cookies()).get(NAMA_COOKIE)?.value) redirect(`/api/auth/bersihkan-sesi?lanjut=${encodeURIComponent(lanjut)}`);
  return (
    // <body> desain: bg-background text-on-background min-h-screen flex items-center justify-center p-4
    // (body akar dipakai bersama; kelas tata letaknya dipindahkan ke pembungkus ini)
    // Tahap 9 (aturan 5): min-h-screen (100vh) desain -> min-h-dvh, preseden KerangkaStaf.
    // Tahap 9 D6 (aksesibilitas): pembungkus <div> desain -> <main> (landmark untuk pembaca layar; kelas & tampilan sama). KEPUTUSAN BARU.
    <main className="bg-background text-on-background min-h-dvh flex items-center justify-center p-4 w-full">
      {/* Watermark Background */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden z-0">
        <Image
          className="watermark w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] object-contain"
          src="/logo-warkop-cap-air.png"
          alt=""
          width={1024}
          height={1024}
          priority
        />
      </div>
      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden">
        {/* Header Strip */}
        <div className="bg-primary px-6 py-4 flex flex-col items-center justify-center border-b border-outline-variant">
          <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">WARKOP NUSANTARA</h1>
          <p className="font-label-md text-label-md text-secondary-fixed mt-1">Portal Staff Khusus</p>
        </div>
        {/* Form Section */}
        <div className="p-8">
          <div className="text-center mb-8">
            <Ikon nama="admin_panel_settings" terisi className="text-4xl text-primary mb-2" />
            <h2 className="font-headline-md text-headline-md text-primary">Autentikasi</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">Silakan masukkan kredensial resmi Anda untuk mengakses sistem pengawasan.</p>
          </div>
          <FormulirLogin lanjut={lanjut} />
        </div>
        {/* Footer / Motto */}
        <div className="bg-surface-container-low px-6 py-4 text-center border-t border-outline-variant">
          <p className="font-motto text-motto text-primary">&quot;Berani Karena Benar&quot;</p>
        </div>
      </div>
    </main>
  );
}
