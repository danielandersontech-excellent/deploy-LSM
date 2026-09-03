// app/(staf)/staf/dashboard/page.js — PENAMPUNG Tahap 2 (tujuan pengalihan setelah login).
// Tampilan dashboard sesungguhnya (dashboard_staff_warkop/code.html) dibangun di Tahap 7.
import { ambilPenggunaSesi } from '@/lib/auth/sesi';

export const metadata = { title: 'Dashboard' };

export default async function HalamanDashboardPenampung() {
  const pengguna = await ambilPenggunaSesi();
  return (
    <main className="p-8 font-body-md text-body-md">
      <h1 className="font-headline-md text-headline-md text-primary mb-2">Tinjauan Pengawasan</h1>
      <p className="text-on-surface-variant">
        {`Masuk sebagai ${pengguna?.nama ?? '-'} (${pengguna?.peran ?? '-'}). Dashboard lengkap dibangun di Tahap 7.`}
      </p>
    </main>
  );
}
