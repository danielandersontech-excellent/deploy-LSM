// app/(staf)/staf/artikel/asisten/page.js — ASISTEN BERITA AI (RUN AI-1 butir D). Halaman ini TIDAK digambar Stitch
// (REFERENSI 18.4) -> KEPUTUSAN BARU: layar cetakan = editor_artikel_admin (kepala kanvas + panel kartu
// "bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm") dan kelola_artikel_admin (kotak masukan,
// tombol utama, lencana status); pita peringatan memakai kelas pita pratinjau (QA-2 B8). Sidebar kanonik dari layout.
// Server component: pagar peran HAK.artikel_buat, pembersihan malas (butir C), riwayat saran + kuota dari basis data;
// interaksi (cari, gunakan draf) di client component AsistenBerita.
import { redirect } from 'next/navigation';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilSaranPengguna, hitungPanggilanHariIni } from '@/lib/db/aiSaran';
import { bersihkanMalas } from '@/lib/ai/pembersihan';
import { KUOTA_HARIAN, modeTiruanAktif } from '@/lib/ai/saranBerita';
import { penyediaAktif } from '@/lib/gambarBerlisensi';
import AsistenBerita from '@/components/staf/AsistenBerita';

export const metadata = { title: 'Asisten Berita AI' };
export const dynamic = 'force-dynamic';

function keIso(nilai) {
  if (!nilai) return null;
  const t = nilai instanceof Date ? nilai : new Date(nilai);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

export default async function HalamanAsistenBerita() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login?lanjut=%2Fstaf%2Fartikel%2Fasisten');
  if (!HAK.artikel_buat.includes(pengguna.peran)) redirect('/tanpa-akses');

  await bersihkanMalas(); // butir C: otomatis (lazy) tiap halaman asisten dibuka, paling sering tiap 10 menit
  const [riwayat, dipakai] = await Promise.all([ambilSaranPengguna(pengguna.id, 30), hitungPanggilanHariIni(pengguna.id)]);

  // Hanya kolom yang dibutuhkan kartu; semuanya INTERNAL staf (halaman ini di bawah /staf, pagar lapisan 2-3).
  const riwayatKlien = riwayat.map((s) => ({
    id: s.id,
    topik: s.topik,
    status: s.status,
    model: s.model,
    dibuat_pada: keIso(s.dibuat_pada),
    artikel_id: s.artikel_id,
    artikel_judul: s.artikel_judul ?? null,
    muatan: {
      judul: s.muatan?.judul ?? '',
      ringkasan: s.muatan?.ringkasan ?? '',
      kategoriSlug: s.muatan?.kategoriSlug ?? 'nasional',
      tag: Array.isArray(s.muatan?.tag) ? s.muatan.tag : [],
      catatanVerifikasi: Array.isArray(s.muatan?.catatanVerifikasi) ? s.muatan.catatanVerifikasi : [],
      sumberRiset: Array.isArray(s.muatan?.sumberRiset) ? s.muatan.sumberRiset : [],
    },
  }));

  return (
    <AsistenBerita
      riwayatAwal={riwayatKlien}
      kuota={{ dipakai, maks: KUOTA_HARIAN }}
      bolehBersihkan={HAK.pengaturan_kelola.includes(pengguna.peran)}
      penyedia={penyediaAktif()}
      modeTiruan={modeTiruanAktif()}
    />
  );
}
