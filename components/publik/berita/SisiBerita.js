// components/publik/berita/SisiBerita.js — modul sisi kanan portal berita (kelas VERBATIM portal_berita_beranda/code.html
// "Most Read" dan "Citizen Report Widget"), dipindahkan dari app/(publik)/berita/page.js pada RUN QA-4 C.
// Ditambah dua kartu yang DIPINDAHKAN dari beranda lama (RUN QA-4 C, KEPUTUSAN PEMILIK: beranda = berita):
//   * StatusAdvokasi  — dari kartu "Status Advokasi" beranda_warkop_nusantara (aturan 13: tanpa identitas pelapor);
//   * RekamJejak      — tiga angka statistik beranda lama (pengaturan statistik_*), dipadatkan menjadi satu kartu sisi.
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import Lencana from '@/components/ui/Lencana';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import TautanKartu from '@/components/publik/TautanKartu';
import { labelKategoriPengaduan } from '@/lib/kategoriPengaduan';
import { formatAngkaID } from '@/lib/utils';

export function PalingDibaca({ palingDibaca }) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-tertiary/10 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-tertiary/10 pb-4">
        <Ikon nama="trending_up" className="text-secondary-container text-2xl" />
        <h2 className="font-headline-md text-[20px] text-primary uppercase tracking-wide">Paling Banyak Dibaca</h2>
      </div>
      {palingDibaca.length === 0 ? (
        <KeadaanKosong ikon="trending_up" judul="Belum ada data" keterangan="Artikel yang paling banyak dibaca akan tampil di sini." />
      ) : (
        <ul className="flex flex-col gap-4">
          {palingDibaca.map((a, i) => (
            <li key={a.id} className={i === 0 ? 'group cursor-pointer flex gap-4 items-start relative' : 'group cursor-pointer flex gap-4 items-start pt-4 border-t border-tertiary/5 relative'}>
              <TautanKartu href={`/berita/${a.slug}`} />
              <span className="font-headline-lg text-secondary-container/50 group-hover:text-secondary-container transition-colors font-bold text-4xl leading-none">{i + 1}</span>
              <div>
                <h4 className="font-headline-md text-[16px] leading-snug text-primary group-hover:text-secondary-container transition-colors mb-1">
                  <Link href={`/berita/${a.slug}`} className="focus:outline-none focus:underline">{a.judul}</Link>
                </h4>
                <span className="font-label-md text-[12px] text-on-surface-variant">{a.kategori_nama} • {formatAngkaID(a.jumlah_dibaca)} Tayangan</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WidgetLaporan() {
  return (
    <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden shadow-sm">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
      <div className="relative z-10">
        <Ikon nama="campaign" className="text-4xl text-secondary-fixed mb-4" />
        <h3 className="font-headline-md text-[22px] font-bold mb-2">Punya Info Penting?</h3>
        <p className="font-body-md text-[14px] text-on-primary/80 mb-6">Jadilah mata dan telinga masyarakat. Laporkan indikasi penyimpangan yang Anda temui dengan bukti pendukung.</p>
        <Link href="/kontak" className="w-full bg-secondary-fixed text-primary font-label-md py-3 rounded-lg hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wide">
          Buat Laporan <Ikon nama="shield" />
        </Link>
        <p className="text-center mt-3 text-[11px] text-on-primary/60 font-body-md">Identitas pelapor dilindungi kerahasiaannya.</p>
      </div>
    </div>
  );
}

/** Kartu "Status Advokasi" beranda lama (kelas verbatim), kini di sisi beranda berita. Aturan 13: tanpa identitas. */
export function StatusAdvokasi({ kasus }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 flex flex-col h-full bg-surface-container-low border-b-4 border-secondary-fixed">
        <div className="flex items-center gap-2 mb-4">
          <Ikon nama="gavel" className="text-secondary text-3xl" />
          <h4 className="font-headline-md text-lg text-primary">Status Advokasi</h4>
        </div>
        <div className="space-y-4 flex-grow">
          {kasus.length === 0 ? (
            <p className="font-body-md text-sm text-on-surface-variant">Belum ada kasus yang sedang berjalan.</p>
          ) : (
            kasus.map((k) => (
              <div key={k.nomor_kasus} className="border-l-2 border-outline pl-4 py-1">
                <p className="font-label-md text-xs text-on-surface-variant mb-1">Kasus {k.nomor_kasus} - {labelKategoriPengaduan(k.kategori_masalah)}</p>
                <p className="font-body-md text-sm font-medium text-primary">{k.wilayah_nama || 'Lingkup nasional'}</p>
                <Lencana status={k.status} className="mt-2" />
              </div>
            ))
          )}
        </div>
        <Link href="/lacak" className="w-full py-2 mt-4 border border-outline rounded text-primary font-label-md text-sm hover:bg-surface-container transition-colors text-center block">
          Pantau Semua Kasus
        </Link>
      </div>
    </div>
  );
}

/** Tiga angka statistik beranda lama (pengaturan statistik_*), kelas angka/label verbatim, dipadatkan ke kartu sisi. */
export function RekamJejak({ statistik }) {
  return (
    <div className="bg-primary text-on-primary rounded-xl p-6 shadow-sm" aria-label="Statistik lembaga">
      <h3 className="font-label-md text-label-md text-secondary-fixed uppercase tracking-wider mb-4">Rekam Jejak</h3>
      <dl className="flex flex-col divide-y divide-outline-variant/30">
        {statistik.map((s, i) => (
          <div key={s.label} className={i === 0 ? 'pb-4' : 'py-4 last:pb-0'}>
            <dd className="font-headline-xl text-headline-xl text-secondary-fixed mb-1">{s.angka}</dd>
            <dt className="font-label-md text-label-md text-on-primary-container uppercase tracking-wider">{s.label}</dt>
            <p className="font-body-md text-body-md mt-1 text-on-primary/80 text-sm">{s.keterangan}</p>
          </div>
        ))}
      </dl>
    </div>
  );
}
