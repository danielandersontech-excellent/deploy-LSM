// app/(publik)/tentang/page.js — TENTANG KAMI. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari tentang_kami_warkop_nusantara/code.html
// (screen.png rusak — code.html satu-satunya sumber; folder `tentang_kami/` salah merek, diabaikan).
// Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) gambar googleusercontent -> logo lokal,
// (d) Visi & Misi DINAMIS dari `pengaturan`, (e) unsur filosofi -> .map() kelas item pertama, (f) JSX.
// Navbar/footer dari layout (18.3). Hero adalah <header> di luar <main> pada desain — dipertahankan
// sebagai saudara <main> (fragment), bukan disalin navbar-nya.
// KEPUTUSAN BARU (dicatat di laporan): desain hanya memuat 4 dari 9 unsur filosofi lambang dan tidak
// memuat Visi & Misi maupun bagian motto — bagian tambahan disusun HANYA dari kelas yang sudah ada di
// layar ini (kartu bento akronim + daftar filosofi + hero).
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilPengaturan } from '@/lib/db/pengaturan';

export const metadata = {
  title: 'Tentang Kami',
  description:
    'Mengenal WARKOP NUSANTARA - Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara: makna akronim, filosofi lambang, visi, misi, dan motto Berani Karena Benar.',
};

// Sembilan unsur filosofi lambang (REFERENSI bagian 1). Empat pertama: judul + makna verbatim dari
// code.html; lima berikutnya melengkapi unsur yang belum digambar Stitch (ikon terdekat dari 77 ikon).
const FILOSOFI_LAMBANG = [
  { ikon: 'trip_origin', judul: 'Lingkaran (Persatuan)', makna: 'Menggambarkan keutuhan bangsa yang tidak terputus, tempat segala elemen masyarakat berlindung dan bersatu.' },
  { ikon: 'visibility', judul: 'Burung Hantu (Kewaspadaan)', makna: 'Simbol ketajaman visi di tengah kegelapan, melambangkan pengawasan konstan dan kebijaksanaan dalam bertindak.' },
  { ikon: 'map', judul: 'Peta (Jangkauan Nasional)', makna: 'Menegaskan komitmen kami yang meliputi seluruh penjuru wilayah kesatuan, dari Sabang hingga Merauke.' },
  { ikon: 'balance', judul: 'Timbangan (Keadilan)', makna: 'Prinsip objektivitas dan perlakuan setara di mata hukum tanpa memandang latar belakang.' },
  { ikon: 'gavel', judul: 'Palu Hukum (Penegakan Hukum)', makna: 'Penegakan hukum, kepastian hukum, dan penyelesaian setiap temuan lewat jalur resmi.' },
  { ikon: 'badge', judul: 'Tulisan Nama (Identitas)', makna: 'Tulisan WARKOP NUSANTARA adalah identitas sekaligus akronim organisasi.' },
  { ikon: 'article', judul: 'Tulisan Kepanjangan (Empat Fungsi)', makna: 'Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara, penegasan empat fungsi utama lembaga.' },
  { ikon: 'campaign', judul: 'Motto (Keberanian)', makna: 'Berani Karena Benar: keberanian yang lahir dari keyakinan pada kebenaran dan hukum.' },
  { ikon: 'verified', judul: 'Cokelat & Emas (Warna)', makna: 'Cokelat melambangkan kesederhanaan, kedewasaan, dan kedekatan dengan rakyat. Emas melambangkan integritas, kehormatan, kepercayaan, dan profesionalisme.' },
];

// Butir misi dipisah baris baru ("1. …\n2. …"); nomor/penanda di awal baris dibuang karena daftar
// diberi nomor sendiri.
function pecahMisi(teks) {
  return String(teks || '')
    .split(/\r?\n/)
    .map((baris) => baris.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);
}

export default async function HalamanTentang() {
  const s = await ambilPengaturan(['visi', 'misi']);
  const visi = String(s.visi || '').trim();
  const misi = pecahMisi(s.misi);

  return (
    <>
      {/* Hero Section */}
      <header className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-outline-variant">
        <div className="absolute inset-0 z-0">
          {/* Latar hias: desain memakai ilustrasi googleusercontent tanpa berkas lokal -> segel logo (KEPUTUSAN BARU) */}
          <div
            className="bg-cover bg-center w-full h-full opacity-20 mix-blend-multiply"
            style={{ backgroundImage: "url('/logo-warkop-cap-air.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center">
          <span className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-4 block">Identitas Organisasi</span>
          <h1 className="font-headline-xl text-headline-xl text-primary mb-6">Tentang Kami</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Mengenal lebih dekat WARKOP NUSANTARA: dedikasi kami untuk menjadi pengawas yang adil, transparan, dan berani bersuara demi kebenaran.
          </p>
        </div>
      </header>
      {/* Content Sections */}
      <main id="konten-utama" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-24">
        {/* Acronym Breakdown (Bento Grid) — lima kartu tetap (W, AR, K, O, P) disalin verbatim: varian kelasnya (lg:col-span-2, kartu cokelat) adalah tata letak bento yang disengaja, bukan data */}
        <section>
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-primary">Makna WARKOP</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">Pilar utama pergerakan kami</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ikon nama="forum" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-secondary-fixed-dim mb-2 relative z-10">Wadah</h3>
              <p className="font-body-md text-body-md text-on-surface relative z-10">
                Ruang aman dan inklusif bagi setiap elemen masyarakat untuk berkumpul, berdiskusi, dan merumuskan solusi atas berbagai isu kebangsaan.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group lg:col-span-2">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ikon nama="record_voice_over" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2 relative z-10">Aspirasi Rakyat</h3>
              <p className="font-body-md text-body-md text-on-surface relative z-10 max-w-prose">
                Menyalurkan suara akar rumput ke tingkat pembuat kebijakan. Kami memastikan bahwa setiap keluhan, harapan, dan ide dari masyarakat didengar dan ditindaklanjuti dengan serius, tanpa ada yang terpinggirkan.
              </p>
            </div>
            <div className="bg-primary text-on-primary rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Ikon nama="policy" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-secondary-fixed mb-2 relative z-10">Kontrol</h3>
              <p className="font-body-md text-body-md text-on-primary/90 relative z-10">
                Fungsi penyeimbang (checks and balances) independen. Kami memantau kinerja institusi publik untuk mencegah penyalahgunaan wewenang.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ikon nama="visibility" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-secondary-fixed-dim mb-2 relative z-10">Observasi</h3>
              <p className="font-body-md text-body-md text-on-surface relative z-10">
                Pengumpulan data faktual di lapangan. Kami melakukan pengamatan sistematis untuk mendapatkan gambaran nyata tentang implementasi kebijakan.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ikon nama="gavel" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2 relative z-10">Pengawasan</h3>
              <p className="font-body-md text-body-md text-on-surface relative z-10">
                Memastikan akuntabilitas. Kami mengawal proses dari temuan awal hingga penyelesaian, menuntut tanggung jawab penuh dari pihak terkait.
              </p>
            </div>
          </div>
        </section>
        {/* Logo Philosophy */}
        <section className="bg-surface-container-low rounded-xl p-8 md:p-12 border border-outline-variant">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Filosofi Lambang</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                Setiap elemen visual dalam identitas kami bukan sekadar ornamen, melainkan manifestasi dari prinsip-prinsip yang kami tegakkan.
              </p>
              {/* Sembilan unsur -> .map() memakai kelas item PERTAMA desain (18.2e) */}
              <ul className="space-y-6">
                {FILOSOFI_LAMBANG.map((unsur) => (
                  <li key={unsur.judul} className="flex items-start gap-4">
                    <div className="bg-secondary-container text-on-secondary-container p-3 rounded-full flex-shrink-0">
                      <Ikon nama={unsur.ikon} terisi />
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-primary uppercase tracking-wide">{unsur.judul}</h4>
                      <p className="font-body-md text-body-md text-on-surface mt-1">{unsur.makna}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* QA-2 B4: object-cover memotong segel di lebar tertentu -> object-contain + padding, latar surface-container-low */}
            <div className="relative h-[500px] rounded-lg overflow-hidden border border-outline shadow-sm bg-surface-container-low p-6">
              <Image
                className="object-contain w-full h-full p-6"
                src="/logo-warkop-besar.png"
                alt="Lambang WARKOP NUSANTARA: burung hantu, timbangan, palu hukum, dan peta Nusantara di dalam lingkaran cokelat dan emas"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </section>
        {/* Visi & Misi — KEPUTUSAN BARU: tidak digambar Stitch; isi dari `pengaturan` (visi, misi), kelas dari kartu bento akronim di layar ini */}
        <section>
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-primary">Visi &amp; Misi</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">Arah dan langkah kami</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-primary text-on-primary rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Ikon nama="explore" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-secondary-fixed mb-2 relative z-10">Visi</h3>
              <p className="font-body-md text-body-md text-on-primary/90 relative z-10">
                {visi || 'Visi belum diisi oleh pengelola.'}
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ikon nama="check_circle" className="text-9xl" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2 relative z-10">Misi</h3>
              {misi.length > 0 ? (
                <ol className="space-y-6 relative z-10">
                  {misi.map((butir, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="font-label-md text-label-md text-secondary tracking-widest uppercase flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <p className="font-body-md text-body-md text-on-surface">{butir}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <KeadaanKosong ikon="edit_document" judul="Misi belum diisi" keterangan="Butir misi akan tampil setelah diisi pengelola di pengaturan." className="relative z-10" />
              )}
            </div>
          </div>
        </section>
        {/* Motto — KEPUTUSAN BARU: tidak digambar Stitch; kelas dari kartu cokelat bento + hero di layar ini; makna dari REFERENSI bagian 1 */}
        <section className="bg-primary text-on-primary rounded-xl p-8 md:p-12 shadow-sm relative overflow-hidden group text-center">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Ikon nama="shield" className="text-9xl" />
          </div>
          <span className="font-label-md text-label-md text-secondary-fixed tracking-widest uppercase mb-4 block relative z-10">Motto</span>
          <h2 className="font-headline-lg text-headline-lg text-secondary-fixed mb-6 relative z-10">Berani Karena Benar</h2>
          <p className="font-body-lg text-body-lg text-on-primary/90 max-w-2xl mx-auto relative z-10">
            Keberanian yang lahir dari keyakinan pada kebenaran dan hukum. Kami bersuara bukan karena kuat, melainkan karena benar, dan kebenaran itu kami tegakkan lewat jalur hukum yang resmi.
          </p>
        </section>
      </main>
    </>
  );
}
