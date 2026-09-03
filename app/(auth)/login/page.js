// app/(auth)/login/page.js — /login. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM & kelas disalin apa adanya dari login_staff_warkop_nusantara/code.html.
// Perubahan yang diizinkan: (a) span material-symbols -> <Ikon>, (b) img googleusercontent
// -> next/image lokal (watermark = logo besar), (c) href="#" -> rute, (f) sintaks JSX.
// Formulir dan keadaannya (memuat, galat kredensial, akun nonaktif, terlalu banyak
// percobaan) ada di FormulirLogin (client component) dengan kelas yang sama persis.
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';
import FormulirLogin from '@/components/staf/FormulirLogin';

export const metadata = { title: 'Masuk Staf' };

export default async function HalamanLogin({ searchParams }) {
  const sp = await searchParams;
  const lanjut = typeof sp?.lanjut === 'string' && sp.lanjut.startsWith('/staf') ? sp.lanjut : '/staf/dashboard';
  return (
    // <body> desain: bg-background text-on-background min-h-screen flex items-center justify-center p-4
    // (body akar dipakai bersama; kelas tata letaknya dipindahkan ke pembungkus ini)
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-4 w-full">
      {/* Watermark Background */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden z-0">
        <Image
          className="watermark w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] object-contain"
          src="/logo-warkop-besar.png"
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
    </div>
  );
}
