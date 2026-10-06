'use client';
// components/staf/AsistenBerita.js — antarmuka Asisten Berita AI (RUN AI-1 butir D). Halaman tidak digambar Stitch
// (REFERENSI 18.4) -> KEPUTUSAN BARU, kelas diambil dari layar cetakan:
//   * kepala kanvas + remah roti + kartu panel: editor_artikel_admin (EditorArtikel.js);
//   * kotak masukan + tombol utama + lencana Draft: kelola_artikel_admin (page.js Kelola Artikel);
//   * pita peringatan (CATATAN VERIFIKASI): kelas pita pratinjau (bg-secondary-fixed/20 border-secondary-fixed), QA-2 B8;
//   * chip tag: KELAS_CHIP editor; tautan sumber: kelas tautan badan artikel (text-secondary underline).
// Perilaku: tombol Cari nonaktif saat memuat (cegah klik ganda), indikator "30 sampai 90 detik", galat ramah dari API,
// keadaan kosong, riwayat saran pengguna; "Gunakan draf ini" -> POST pakai -> redirect /staf/artikel/[id]?ai=1.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { KATEGORI_BERITA } from '@/lib/kategoriBerita';

const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_KARTU = 'bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm flex flex-col gap-4';
const KELAS_JUDUL_PANEL = 'font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2';
const KELAS_INPUT = 'w-full pl-10 pr-4 py-2 border border-outline-variant rounded-md bg-surface-container-lowest focus:ring-1 focus:ring-secondary-fixed-dim focus:border-secondary-fixed-dim font-body-md text-body-md text-on-surface';
const KELAS_TOMBOL_UTAMA = 'bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-md hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50';
const KELAS_TOMBOL_GARIS = 'px-6 py-2 rounded-lg border border-outline font-label-md text-label-md text-primary hover:bg-surface-container transition-colors flex items-center gap-2 disabled:opacity-50';
const KELAS_CHIP = 'inline-flex items-center gap-1 bg-secondary-fixed-dim text-on-secondary-fixed-variant px-2 py-1 rounded font-label-md text-[12px]';
const KELAS_LENCANA_KATEGORI = 'inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-primary font-label-md text-[10px] uppercase border border-outline-variant shadow-sm';
const LENCANA_STATUS = Object.freeze({
  baru: { label: 'Baru', kelas: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim' },
  dipakai: { label: 'Dipakai', kelas: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant' },
  dibersihkan: { label: 'Dibersihkan', kelas: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant' },
});

function namaKategori(slug) {
  return KATEGORI_BERITA.find((k) => k.slug === slug)?.nama ?? slug;
}
function tanggalWIB(iso) {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const w = new Date(t.getTime() + 7 * 60 * 60 * 1000);
  const d = (n) => String(n).padStart(2, '0');
  return `${d(w.getUTCDate())}/${d(w.getUTCMonth() + 1)}/${w.getUTCFullYear()} ${d(w.getUTCHours())}:${d(w.getUTCMinutes())} WIB`;
}
async function bacaBalasan(r) {
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}
function teksGalat(data, cadangan) {
  return data?.galat ? `${data.galat}${data.kode ? ` (${data.kode})` : ''}` : cadangan;
}

function KartuSaran({ saran, sedangDipakai, adaProses, onPakai }) {
  const m = saran.muatan;
  const status = LENCANA_STATUS[saran.status] ?? LENCANA_STATUS.baru;
  return (
    <article className={KELAS_KARTU} aria-labelledby={`saran-${saran.id}-judul`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={KELAS_LENCANA_KATEGORI}><Ikon nama="verified" className="text-[14px]" />{namaKategori(m.kategoriSlug)}</span>
        <span className={status.kelas}>{status.label}</span>
      </div>
      <h4 id={`saran-${saran.id}-judul`} className="font-headline-md text-[20px] text-primary leading-tight">{m.judul}</h4>
      <p className="font-body-md text-body-md text-on-surface-variant">{m.ringkasan}</p>
      {/* Kotak CATATAN VERIFIKASI (mencolok): kelas pita pratinjau + ikon warning */}
      <div className="bg-secondary-fixed/20 border border-secondary-fixed rounded-lg p-4">
        <p className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 mb-2">
          <Ikon nama="warning" className="text-secondary" />
          Catatan verifikasi (wajib dicek redaksi)
        </p>
        <ul className="list-disc pl-5 font-body-md text-[14px] text-on-surface space-y-1">
          {m.catatanVerifikasi.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
      {m.tag.length ? (
        <div className="flex flex-wrap gap-2">
          {m.tag.map((t) => <span key={t} className={KELAS_CHIP}>{t}</span>)}
        </div>
      ) : null}
      <details className="border border-outline-variant rounded-lg">
        <summary className="cursor-pointer px-4 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low rounded-lg">
          Sumber riset (internal redaksi, {m.sumberRiset.length} tautan)
        </summary>
        {m.sumberRiset.length ? (
          <ul className="px-4 pb-3 pt-1 space-y-1 font-body-md text-[14px]">
            {m.sumberRiset.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-secondary underline break-all">{s.judul || s.url}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 pb-3 pt-1 font-body-md text-[14px] text-outline">AI tidak mencantumkan sumber. Lakukan riset mandiri sebelum memakai draf ini.</p>
        )}
      </details>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant">
        <span className="font-body-md text-[12px] text-outline">Topik: {saran.topik}{saran.dibuat_pada ? ` | ${tanggalWIB(saran.dibuat_pada)}` : ''}{saran.model ? ` | ${saran.model}` : ''}</span>
        {saran.status === 'baru' ? (
          <button type="button" className={KELAS_TOMBOL_UTAMA} onClick={() => onPakai(saran.id)} disabled={adaProses} aria-busy={sedangDipakai}>
            <Ikon nama="post_add" />
            {sedangDipakai ? 'Menyiapkan foto dan draf...' : 'Gunakan draf ini'}
          </button>
        ) : saran.status === 'dipakai' && saran.artikel_id ? (
          <Link href={`/staf/artikel/${saran.artikel_id}`} className={KELAS_TOMBOL_GARIS}>
            <Ikon nama="edit" className="text-[16px]" />
            Buka artikel{saran.artikel_judul ? '' : ''}
          </Link>
        ) : (
          <span className="font-body-md text-[12px] text-outline">{saran.status === 'dipakai' ? 'Artikel sudah dihapus' : 'Kadaluarsa, lebih dari 7 hari'}</span>
        )}
      </div>
    </article>
  );
}

export default function AsistenBerita({ riwayatAwal = [], kuota = { dipakai: 0, maks: 10 }, bolehBersihkan = false, penyedia = [], modeTiruan = false }) {
  const router = useRouter();
  const [topik, setTopik] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [hasil, setHasil] = useState(null); // { topik, saran[], model, ditolak[], usage }
  const [galat, setGalat] = useState(null);
  const [info, setInfo] = useState(null);
  const [riwayat, setRiwayat] = useState(riwayatAwal);
  const [sisaKuota, setSisaKuota] = useState(Math.max(0, kuota.maks - kuota.dipakai));
  const [pakaiId, setPakaiId] = useState(null);
  const [membersihkan, setMembersihkan] = useState(false);

  const topikBersih = topik.trim();
  const bolehCari = topikBersih.length >= 3 && topikBersih.length <= 120 && !memuat && sisaKuota > 0;

  async function cari(e) {
    e.preventDefault();
    if (!bolehCari) return;
    setMemuat(true);
    setGalat(null);
    setInfo(null);
    try {
      const r = await fetch('/api/staf/ai/saran', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topik: topikBersih }), credentials: 'same-origin' });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) {
        setGalat(teksGalat(data, 'Asisten AI tidak dapat memproses permintaan'));
        return;
      }
      setHasil({ topik: topikBersih, saran: data.saran, model: data.model, ditolak: data.ditolak || [], usage: data.usage, terpotong: data.terpotong });
      setRiwayat((lama) => [...data.saran, ...lama]);
      if (data.kuota) setSisaKuota(Math.max(0, data.kuota.maks - data.kuota.dipakai));
      if (data.ditolak?.length) setInfo(`${data.ditolak.length} draf dibuang oleh penjaga badan-bersih (${data.ditolak[0]}).`);
      else if (data.terpotong) setInfo('Balasan AI terpotong; draf yang utuh tetap ditampilkan.');
    } catch {
      setGalat('Tidak dapat menghubungi server. Periksa koneksi Anda.');
    } finally {
      setMemuat(false);
    }
  }

  async function pakai(id) {
    if (pakaiId) return;
    setPakaiId(id);
    setGalat(null);
    try {
      const r = await fetch(`/api/staf/ai/saran/${id}/pakai`, { method: 'POST', credentials: 'same-origin' });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) {
        setGalat(teksGalat(data, 'Draf tidak dapat dipakai'));
        setPakaiId(null);
        return;
      }
      router.push(`/staf/artikel/${data.artikelId}?ai=1`);
    } catch {
      setGalat('Tidak dapat menghubungi server. Periksa koneksi Anda.');
      setPakaiId(null);
    }
  }

  async function bersihkan() {
    if (membersihkan) return;
    setMembersihkan(true);
    setGalat(null);
    try {
      const r = await fetch('/api/staf/ai/bersihkan', { method: 'POST', credentials: 'same-origin' });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) setGalat(teksGalat(data, 'Pembersihan gagal'));
      else {
        setInfo(`Pembersihan selesai: ${data.dibersihkan} saran ditandai dibersihkan, ${data.berkasDihapus} berkas gambar dihapus (dari ${data.diperiksa} kandidat lebih dari ${data.hari} hari).`);
        router.refresh();
      }
    } catch {
      setGalat('Tidak dapat menghubungi server. Periksa koneksi Anda.');
    } finally {
      setMembersihkan(false);
    }
  }

  const idHasil = new Set((hasil?.saran || []).map((s) => s.id));
  const riwayatLain = riwayat.filter((s) => !idHasil.has(s.id));
  const adaProses = memuat || pakaiId !== null;

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* Canvas Header (kelas verbatim kepala editor_artikel_admin) */}
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 shadow-sm px-margin-desktop py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-1">
            <Link href="/staf/artikel">Kelola Artikel</Link>
            <Ikon nama="chevron_right" className="text-[16px]" />
            <span className="text-primary font-bold">Asisten AI</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Asisten Berita AI</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant" title="Kuota pencarian per pengguna per hari">
            Sisa kuota hari ini: {sisaKuota}/{kuota.maks}
          </span>
          {bolehBersihkan ? (
            <button type="button" className={KELAS_TOMBOL_GARIS} onClick={bersihkan} disabled={membersihkan} aria-busy={membersihkan}>
              <Ikon nama="delete" className="text-[16px]" />
              {membersihkan ? 'Membersihkan...' : 'Bersihkan sekarang'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 p-margin-desktop flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Panel pencarian */}
        <section className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm" aria-labelledby="judul-cari">
          <h3 id="judul-cari" className={KELAS_JUDUL_PANEL}>
            <Ikon nama="search" />
            Cari topik berita
          </h3>
          <p className="font-body-md text-[14px] text-outline mb-3">
            Tulis topik (3 sampai 120 karakter). Asisten meriset berita terkini di Indonesia lewat pencarian web, lalu menyusun 2 sampai 3 draf berbeda sudut pandang. Setiap draf selalu berstatus Draf, membawa catatan verifikasi dan sumber riset untuk redaksi, dan badan artikelnya bebas tautan.
          </p>
          <form onSubmit={cari} className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full">
              <Ikon nama="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <label htmlFor="topik" className="sr-only">Topik berita</label>
              <input id="topik" name="topik" type="text" className={KELAS_INPUT} placeholder="Contoh: banjir Jakarta, dana desa, buruh pabrik..." value={topik} onChange={(e) => setTopik(e.target.value)} maxLength={120} disabled={memuat} autoComplete="off" />
            </div>
            <button type="submit" className={KELAS_TOMBOL_UTAMA} disabled={!bolehCari} aria-busy={memuat}>
              <Ikon nama={memuat ? 'pending' : 'search'} />
              {memuat ? 'Meriset...' : 'Cari'}
            </button>
          </form>
          {memuat ? (
            <p role="status" aria-live="polite" className="mt-4 font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
              <Ikon nama="schedule" className="text-secondary" />
              Meriset dan menulis draf. Biasanya 30 sampai 90 detik, jangan tutup halaman ini.
            </p>
          ) : null}
          {sisaKuota <= 0 && !memuat ? (
            <p role="status" className="mt-4 font-body-md text-[14px] text-outline">Kuota pencarian hari ini sudah habis ({kuota.maks} per pengguna per hari). Coba lagi besok.</p>
          ) : null}
          {galat ? <p role="alert" className={`mt-4 ${KELAS_PESAN_GALAT}`}>{galat}</p> : null}
          {info ? <p role="status" className={`mt-4 ${KELAS_PESAN_SUKSES}`}>{info}</p> : null}
          <p className="mt-4 font-body-md text-[12px] text-outline">
            Foto ilustrasi diambil otomatis dari penyedia berlisensi bebas ({penyedia.join(', ')}) saat draf dipakai; asal foto hanya tercatat untuk redaksi.{modeTiruan ? ' MODE TIRUAN AKTIF: tidak ada panggilan AI sungguhan (hanya untuk uji lokal).' : ''}
          </p>
        </section>

        {/* Hasil pencarian terbaru */}
        {hasil ? (
          <section aria-labelledby="judul-hasil" className="flex flex-col gap-4">
            <h3 id="judul-hasil" className="font-headline-md text-[20px] text-primary flex items-center gap-2">
              <Ikon nama="article" />
              Hasil untuk: {hasil.topik}
            </h3>
            {hasil.saran.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {hasil.saran.map((s) => <KartuSaran key={s.id} saran={s} sedangDipakai={pakaiId === s.id} adaProses={adaProses} onPakai={pakai} />)}
              </div>
            ) : (
              <KeadaanKosong ikon="article" judul="Tidak ada draf" keterangan="AI tidak menghasilkan draf yang lolos pemeriksaan. Coba topik yang lebih spesifik." />
            )}
          </section>
        ) : null}

        {/* Riwayat */}
        <section aria-labelledby="judul-riwayat" className="flex flex-col gap-4">
          <h3 id="judul-riwayat" className="font-headline-md text-[20px] text-primary flex items-center gap-2">
            <Ikon nama="schedule" />
            Riwayat saran Anda
          </h3>
          {riwayatLain.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {riwayatLain.map((s) => <KartuSaran key={s.id} saran={s} sedangDipakai={pakaiId === s.id} adaProses={adaProses} onPakai={pakai} />)}
            </div>
          ) : (
            <KeadaanKosong ikon="menu_book" judul="Belum ada saran" keterangan={hasil ? 'Semua saran Anda ada di hasil pencarian di atas.' : 'Masukkan topik di atas untuk mulai meriset. Saran yang tidak dipakai dalam 7 hari dibersihkan otomatis.'} />
          )}
        </section>
      </div>
    </div>
  );
}
