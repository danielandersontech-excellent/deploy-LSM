// app/(staf)/staf/layout.js — LAPISAN 3: requireUser untuk seluruh /staf/*.
// Sidebar kanonik (dashboard_staff_warkop) dibangun di Tahap 7; tahap ini hanya penjaga.
import { requireUser } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';

export const dynamic = 'force-dynamic';

export default async function LayoutStaf({ children }) {
  // Sesi diverifikasi terhadap DB (aktif + token_version). Tanpa sesi -> /login; peran asing -> /tanpa-akses.
  await requireUser(HAK.ruang_staf);
  return <>{children}</>;
}
