// app/(auth)/tanpa-akses/page.js — halaman 403 (KEPUTUSAN BARU, tidak digambar di ZIP).
// Cetakan: kartu login_staff_warkop_nusantara (REFERENSI 18.4) — kelas diambil dari layar itu.
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { halamanAwalPeran } from '@/lib/auth/hakAkses';

export const metadata = { title: 'Tidak berhak' };
export const dynamic = 'force-dynamic';

export default async function HalamanTanpaAkses() {
  const pengguna = await ambilPenggunaSesi();
  const tujuan = pengguna ? halamanAwalPeran(pengguna.peran) : '/login';
  return (
    // Tahap 9 (aturan 5): min-h-screen (100vh) desain -> min-h-dvh, preseden KerangkaStaf.
    // Tahap 9 D6 (aksesibilitas): pembungkus <div> desain -> <main> (landmark untuk pembaca layar; kelas & tampilan sama). KEPUTUSAN BARU.
    <main className="bg-background text-on-background min-h-dvh flex items-center justify-center p-4 w-full">
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden">
        <div className="bg-primary px-6 py-4 flex flex-col items-center justify-center border-b border-outline-variant">
          <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">WARKOP NUSANTARA</h1>
          <p className="font-label-md text-label-md text-secondary-fixed mt-1">Portal Staff Khusus</p>
        </div>
        <div className="p-8">
          <div className="text-center mb-8">
            <Ikon nama="security" className="text-4xl text-primary mb-2" />
            <h2 className="font-headline-md text-headline-md text-primary">403: Tidak Berhak</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {pengguna
                ? `Peran ${pengguna.peran} tidak memiliki hak untuk membuka halaman ini.`
                : 'Anda perlu masuk dengan akun staf yang berhak untuk membuka halaman ini.'}
            </p>
          </div>
          <Link
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors paper-shadow mt-4"
            href={tujuan}
          >
            <span>{pengguna ? 'Kembali ke Dashboard' : 'Ke Halaman Masuk'}</span>
            <Ikon nama="arrow_forward" className="text-sm" />
          </Link>
        </div>
        <div className="bg-surface-container-low px-6 py-4 text-center border-t border-outline-variant">
          <p className="font-motto text-motto text-primary">&quot;Berani Karena Benar&quot;</p>
        </div>
      </div>
    </main>
  );
}
