// app/(staf)/staf/ganti-sandi/page.js — ganti kata sandi sendiri (seluruh peran). Dipaksa saat
// wajib_ganti_sandi=1 (KerangkaStaf mengalihkan ke sini). Tidak ada di ZIP -> REFERENSI 18.4:
// cetakan kartu login_staff_warkop_nusantara (kepala bg-primary, isi p-8, kaki motto) + input FormulirLogin.
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import FormulirGantiSandi from '@/components/staf/FormulirGantiSandi';

export const metadata = { title: 'Ganti Kata Sandi' };

export default async function HalamanGantiSandi() {
  const pengguna = await ambilPenggunaSesi();
  const wajib = Number(pengguna?.wajib_ganti_sandi) === 1;
  return (
    <div className="p-margin-mobile md:p-margin-desktop">
      <header className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-primary">Ganti Kata Sandi</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {wajib ? 'Kata sandi Anda baru saja disetel ulang oleh superadmin. Ganti sekarang sebelum melanjutkan.' : 'Perbarui kata sandi akun Anda. Seluruh sesi lain akan keluar setelah penggantian.'}
        </p>
      </header>
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden">
        <div className="bg-primary px-6 py-4 flex flex-col items-center justify-center border-b border-outline-variant">
          <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">WARKOP NUSANTARA</h1>
          <p className="font-label-md text-label-md text-secondary-fixed mt-1">{wajib ? 'Wajib Ganti Kata Sandi' : 'Keamanan Akun'}</p>
        </div>
        <div className="p-8">
          <FormulirGantiSandi wajib={wajib} />
        </div>
        <div className="bg-surface-container-low px-6 py-4 text-center border-t border-outline-variant">
          <p className="font-motto text-motto text-primary">&quot;Berani Karena Benar&quot;</p>
        </div>
      </div>
    </div>
  );
}
