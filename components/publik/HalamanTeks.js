// components/publik/HalamanTeks.js — cetakan halaman teks statis (/kebijakan-privasi,
// /pedoman-komunitas, /faq). REFERENSI 18.3/18.4 KEPUTUSAN BARU: isi dari tabel `pengaturan`,
// tata letak = detail_artikel_investigasi/code.html (main, article max-w-[720px], remah roti,
// h1 headline-xl, paragraf pembuka italic, badan body-lg space-y-6, paragraf pertama drop-cap,
// subjudul headline-lg). Kelas disalin apa adanya; byline/gambar/bagikan tidak dipakai
// karena bukan artikel.
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import { ambilPengaturan } from '@/lib/db/pengaturan';

/** Memecah teks pengaturan menjadi blok: baris kosong = paragraf baru. */
export function pecahParagraf(teks) {
  return String(teks ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function HalamanTeks({ kunci, judul, pembuka, modeFaq = false }) {
  const setelan = await ambilPengaturan([kunci]);
  const blok = pecahParagraf(setelan[kunci]);
  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <article className="max-w-[720px] mx-auto">
        <nav className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-6 uppercase tracking-wider" aria-label="Remah roti">
          <Link className="hover:text-secondary transition-colors" href="/">Beranda</Link>
          <Ikon nama="chevron_right" className="text-[16px]" />
          <span>{judul}</span>
        </nav>
        <h1 className="font-headline-xl text-headline-xl text-primary mb-6">{judul}</h1>
        {pembuka ? <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 italic">{pembuka}</p> : null}
        <div className="font-body-lg text-body-lg text-on-surface space-y-6 leading-relaxed">
          {modeFaq
            ? blok.map((b, i) => {
                const [tanya, ...jawab] = b.split('\n');
                return (
                  <section key={i}>
                    <h2 className="font-headline-lg text-headline-lg text-primary mt-10 mb-4">{tanya}</h2>
                    <p>{jawab.join(' ')}</p>
                  </section>
                );
              })
            : blok.map((b, i) => (
                <p key={i} className={i === 0 ? 'drop-cap' : undefined}>{b.split('\n').join(' ')}</p>
              ))}
        </div>
      </article>
    </main>
  );
}
