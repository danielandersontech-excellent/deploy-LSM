// app/(staf)/staf/artikel/[id]/pratinjau/page.js — PRATINJAU artikel (QA-2 B8, ala WordPress): draf/arsip/terbit dirender
// dengan komponen & kelas yang SAMA dengan halaman publik (components/publik/BadanArtikel) di dalam kerangka staf.
// Hanya peran ber-sesi (layout staf: requireUser) dengan hak yang sama seperti editor: artikel_lihat; penulis hanya miliknya;
// pimpinan wilayah hanya wilayahnya. Draf TIDAK pernah bocor ke publik (rute ini di bawah /staf, dipagari lapisan 2 & 3).
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import BadanArtikel from '@/components/publik/BadanArtikel';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilArtikelById, ambilTagArtikel } from '@/lib/db/artikel';

export const metadata = { title: 'Pratinjau Artikel' };
export const dynamic = 'force-dynamic';

const LABEL_STATUS = { draf: 'Draf', terbit: 'Terbit', arsip: 'Arsip' };

export default async function HalamanPratinjauArtikel({ params }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect(`/login?lanjut=${encodeURIComponent(`/staf/artikel/${n}/pratinjau`)}`);
  if (!HAK.artikel_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');
  const artikel = await ambilArtikelById(n);
  if (!artikel) notFound();
  if (pengguna.peran === 'penulis' && Number(artikel.penulis_id) !== Number(pengguna.id)) redirect('/tanpa-akses');
  const wilayah = wilayahTerbatas(pengguna);
  if (wilayah !== null && Number(artikel.wilayah_id) !== wilayah) notFound();
  const tag = await ambilTagArtikel(n);
  return (
    <div className="p-margin-mobile md:p-margin-desktop">
      {/* Pita pratinjau: kelas lencana status kelola_artikel_admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8 bg-secondary-fixed/20 border border-secondary-fixed rounded-lg p-4" role="status">
        <p className="font-body-md text-body-md text-on-surface flex items-center gap-2">
          <Ikon nama="visibility" className="text-secondary shrink-0" />
          <span>Mode pratinjau: tampilan persis halaman publik. Status artikel: <strong>{LABEL_STATUS[artikel.status] || artikel.status}</strong>{artikel.status !== 'terbit' ? ' (belum tampil untuk publik).' : '.'}</span>
        </p>
        <div className="flex items-center gap-2">
          <Link href={`/staf/artikel/${n}`} className="px-4 py-2 rounded-lg font-label-md text-label-md border border-outline-variant text-primary hover:bg-surface-container transition-colors flex items-center gap-2">
            <Ikon nama="edit" className="text-[16px]" /> Kembali ke editor
          </Link>
          {artikel.status === 'terbit' ? (
            <Link href={`/berita/${artikel.slug}`} className="px-4 py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-2">
              <Ikon nama="open_in_new" className="text-[16px]" /> Buka halaman publik
            </Link>
          ) : null}
        </div>
      </div>
      {/* Kanvas publik: latar & lebar sama dengan <main> detail publik */}
      <div className="bg-background rounded-lg border border-outline-variant max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <BadanArtikel artikel={artikel} tag={tag} pratinjau />
      </div>
    </div>
  );
}
