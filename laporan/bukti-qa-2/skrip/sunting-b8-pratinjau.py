# QA-2 B8 — PRATINJAU artikel ala WordPress: markup <article> halaman detail publik dipindah ke komponen bersama
# components/publik/BadanArtikel.js (server component), dipakai oleh app/(publik)/berita/[slug]/page.js DAN halaman pratinjau
# staf app/(staf)/staf/artikel/[id]/pratinjau/page.js (hanya peran ber-sesi, pemeriksaan hak sama dengan editor; draf tidak
# bocor ke publik; sanitasi lapisan kedua tetap berlaku). Tombol "Pratinjau" ditambahkan di kepala editor.
import os, re

def baca(p): return open(p, encoding='utf-8').read()
def tulis(p, s): open(p, 'w', encoding='utf-8').write(s)

p = 'app/(publik)/berita/[slug]/page.js'; s = baca(p)
awal = s.index('      {/* Article Header Container */}'); akhir = s.index('      </article>', awal) + len('      </article>')
badan = s[awal:akhir]
# siapkanIsi + KELAS_ISI dipindah ke komponen (dipakai keduanya)
m_kelas = re.search(r"^const KELAS_ISI = .*?;\n", s, flags=re.M | re.S); kelas = m_kelas.group(0) if m_kelas else ''
m_siap = re.search(r"^function siapkanIsi\(html\) \{.*?\n\}\n", s, flags=re.M | re.S); siap = m_siap.group(0)
komponen = """// components/publik/BadanArtikel.js — BADAN ARTIKEL (server component) yang dipakai BERSAMA oleh halaman detail publik
// /berita/[slug] dan pratinjau staf /staf/artikel/[id]/pratinjau (QA-2 B8, ala WordPress: draf dirender dengan komponen &
// kelas yang SAMA dengan halaman publik). Markup verbatim dari detail_artikel_investigasi/code.html (dipindahkan apa adanya
// dari app/(publik)/berita/[slug]/page.js). Sanitasi lapisan kedua (siapkanIsi) berlaku untuk keduanya.
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import TombolBagikan from '@/components/publik/TombolBagikan';
import { sanitasiIsiArtikel } from '@/lib/sanitasi';
import { formatTanggalID } from '@/lib/utils';

""" + kelas + "\n" + siap + """
export { siapkanIsi };

/**
 * @param {{ artikel: object, tag: Array<{id:number,nama:string,slug?:string}>, pratinjau?: boolean }} props
 * pratinjau=true: tautan tag/breadcrumb tetap dirender tetapi tanggal memakai diperbarui_pada bila belum terbit.
 */
export default function BadanArtikel({ artikel, tag = [], pratinjau = false }) {
  const tanggal = formatTanggalID(artikel.terbit_pada || artikel.diperbarui_pada || artikel.dibuat_pada || new Date(), 'panjang');
  const gambarUtama = artikel.gambar_utama || '/penampung/artikel-1.jpg';
  const isiHtml = siapkanIsi(artikel.isi || '');
  return (
""" + badan.replace('\n      ', '\n    ').replace('{artikel.terbit_pada ? new Date(artikel.terbit_pada).toISOString() : undefined}', '{artikel.terbit_pada ? new Date(artikel.terbit_pada).toISOString() : undefined}') + """
  );
}
"""
tulis('components/publik/BadanArtikel.js', komponen); print('komponen BadanArtikel dibuat', len(komponen))

# halaman detail publik memakai komponen
s = s[:awal] + '      <BadanArtikel artikel={artikel} tag={tag} />' + s[akhir:]
s = s.replace(kelas, '') if kelas else s
s = s.replace(siap, '')
s = s.replace("import TombolBagikan from '@/components/publik/TombolBagikan';", "import BadanArtikel, { siapkanIsi } from '@/components/publik/BadanArtikel';")
# variabel yang kini tidak dipakai di halaman detail
s = s.replace("  const tanggal = formatTanggalID(artikel.terbit_pada, 'panjang');\n", "")
s = s.replace("  const isiHtml = siapkanIsi(artikel.isi);\n", "")
tulis(p, s); print('detail publik memakai BadanArtikel')

# halaman pratinjau staf
os.makedirs('app/(staf)/staf/artikel/[id]/pratinjau', exist_ok=True)
tulis('app/(staf)/staf/artikel/[id]/pratinjau/page.js', """// app/(staf)/staf/artikel/[id]/pratinjau/page.js — PRATINJAU artikel (QA-2 B8, ala WordPress): draf/arsip/terbit dirender
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
          <Ikon nama="visibility" className="text-secondary" />
          Mode pratinjau: tampilan persis halaman publik. Status artikel: <strong>{LABEL_STATUS[artikel.status] || artikel.status}</strong>
          {artikel.status !== 'terbit' ? ' (belum tampil untuk publik).' : '.'}
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
"""); print('halaman pratinjau dibuat')

# tombol Pratinjau di kepala editor (hanya bila artikel sudah tersimpan / mode sunting)
p = 'components/staf/EditorArtikel.js'; s = baca(p)
if 'Pratinjau' not in s:
    s = s.replace('        <div className="flex flex-wrap items-center gap-3">\n          {pesan ? (',
                  '        <div className="flex flex-wrap items-center gap-3">\n          {/* QA-2 B8: pratinjau ala WordPress (tab baru); artikel baru harus disimpan dulu agar punya id */}\n          {modeSunting && artikel?.id ? (\n            <a href={`/staf/artikel/${artikel.id}/pratinjau`} target="_blank" rel="noopener" className="px-6 py-2 rounded-lg font-label-md text-label-md border border-outline-variant text-primary hover:bg-surface-container transition-colors flex items-center gap-2">\n              <Ikon nama="visibility" className="text-[16px]" /> Pratinjau\n            </a>\n          ) : (\n            <span className="px-6 py-2 rounded-lg font-label-md text-label-md border border-outline-variant text-outline flex items-center gap-2" title="Simpan draf dulu untuk melihat pratinjau">\n              <Ikon nama="visibility" className="text-[16px]" /> Pratinjau\n            </span>\n          )}\n          {pesan ? (', 1)
    tulis(p, s); print('tombol Pratinjau di editor')
