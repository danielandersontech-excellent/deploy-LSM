'use client';
// components/staf/AksiArtikel.js — tombol hapus artikel di tabel Kelola Artikel (client, karena
// butuh dialog konfirmasi + fetch). Tombol memakai kelas VERBATIM desain kelola_artikel_admin
// (title="Delete"). Dirender HANYA untuk peran HAK.artikel_hapus (halaman); API DELETE tetap
// memeriksa peran sendiri (requireRole). Alur: konfirmasi Dialog -> DELETE /api/staf/artikel/<id>
// -> router.refresh() agar daftar server component dimuat ulang.
// KEPUTUSAN BARU: isi dialog tidak digambar Stitch — tombol memakai KELAS_TOMBOL.kirim (Hapus) dan
// KELAS_TOMBOL.ringkas + px-4 (Batal), preseden filter program; pesan galat text-error.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import Dialog from '@/components/ui/Dialog';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';

export default function AksiArtikel({ id, judul }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState(null);

  function tutup() {
    if (sibuk) return;
    setBuka(false);
    setGalat(null);
  }

  async function hapus() {
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch(`/api/staf/artikel/${id}`, { method: 'DELETE', credentials: 'same-origin', headers: { accept: 'application/json' } });
      if (!res.ok) {
        const muatan = await res.json().catch(() => null);
        setGalat(muatan?.galat ?? `Gagal menghapus artikel (HTTP ${res.status}).`);
        return;
      }
      setBuka(false);
      router.refresh();
    } catch {
      setGalat('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  return (
    <>
      <button type="button" className="text-outline hover:text-error transition-colors" title="Delete" aria-label={`Hapus artikel ${judul}`} onClick={() => setBuka(true)}>
        <Ikon nama="delete" className="text-xl" />
      </button>
      <Dialog terbuka={buka} onTutup={tutup} judul="Hapus Artikel">
        <p className="font-body-md text-body-md text-on-surface">
          Artikel <strong>{judul}</strong> akan dihapus permanen beserta tag dan riwayat bacanya. Tindakan ini tidak dapat dibatalkan.
        </p>
        {galat ? <p className="font-body-md text-body-md text-error mt-4" role="alert">{galat}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={`${KELAS_TOMBOL.ringkas} px-4`} onClick={tutup} disabled={sibuk}>Batal</button>
          <button type="button" className={KELAS_TOMBOL.kirim} onClick={hapus} disabled={sibuk}>
            <Ikon nama="delete" />
            {sibuk ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </Dialog>
    </>
  );
}
