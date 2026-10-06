// POST /api/staf/ai/saran/[id]/pakai — "Gunakan draf ini" (RUN AI-1 butir B). Peran HAK.artikel_buat.
//   1. saran harus ada, berstatus 'baru', dan milik pengguna (redaktur/superadmin boleh memakai saran siapa pun);
//   2. mesin gambar berlisensi multi-sumber (lib/gambarBerlisensi) dijalankan untuk kueriGambar[] -> unduh -> simpanGambar
//      (subfolder 'ai') -> gambar_sumber INTERNAL disimpan di ai_saran; bila sudah pernah diunduh (pakai sebelumnya gagal
//      di tengah jalan) berkas yang ada dipakai ulang;
//   3. ARTIKEL DRAF dibuat lewat jalur validasi+sanitasi yang ada (validasiMuatanArtikel -> buatArtikel): judul,
//      ringkasan, isiHtml APA ADANYA (tanpa baris kredit), kategori slug->id, tag, gambar_utama, penulis = pengguna,
//      status DRAF, ai_saran_id = penanda; tanpa kandidat gambar -> gambar_utama NULL (render memakai penampung);
//   4. saran ditandai 'dipakai'; audit 'ai_saran_pakai' + 'artikel_buat'; balasan { artikelId, gambar }.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { ambilSaranById, simpanGambarSaran, tandaiDipakai } from '@/lib/db/aiSaran';
import { ambilKategoriArtikel, buatArtikel } from '@/lib/db/artikel';
import { validasiMuatanArtikel, GalatValidasi } from '@/lib/validasi/artikel';
import { pastikanKategoriArtikelAktif } from '@/lib/validasi/kategoriArtikel';
import { cariDanUnduhGambar, penyediaAktif } from '@/lib/gambarBerlisensi';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export const POST = denganPeran(HAK.artikel_buat, async (request, { params }, pengguna) => {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  const saran = await ambilSaranById(n);
  if (!saran) throw new GalatHttp(404, 'Saran tidak ditemukan', 'TIDAK_DITEMUKAN');
  if (pengguna.peran === 'penulis' && Number(saran.pemakai_id) !== Number(pengguna.id)) {
    throw new GalatHttp(403, 'Penulis hanya boleh memakai saran miliknya sendiri', 'BUKAN_MILIK');
  }
  if (saran.status === 'dipakai') throw new GalatHttp(409, 'Saran ini sudah dipakai menjadi artikel', 'SUDAH_DIPAKAI', );
  if (saran.status !== 'baru') throw new GalatHttp(409, 'Saran ini sudah dibersihkan (lebih dari 7 hari); buat pencarian baru', 'SUDAH_DIBERSIHKAN');
  const m = saran.muatan || {};

  // kategori slug -> id (harus ada & aktif)
  const kategori = (await ambilKategoriArtikel()).find((k) => k.slug === m.kategoriSlug);
  if (!kategori) throw new GalatHttp(422, `Kategori "${m.kategoriSlug}" tidak ditemukan di basis data`, 'KATEGORI_TIDAK_SAH');
  await pastikanKategoriArtikelAktif(kategori.id);

  // mesin gambar (dilewati bila berkas sudah ada dari percobaan sebelumnya)
  let gambar = { ada: false, jalur: null, penyedia: null, catatan: null, statistik: null };
  if (saran.gambar_jalur) {
    gambar = { ada: true, jalur: saran.gambar_jalur, penyedia: saran.gambar_sumber?.penyedia || null, catatan: 'memakai gambar yang sudah diunduh sebelumnya', statistik: null };
  } else {
    const kueri = Array.isArray(m.kueriGambar) && m.kueriGambar.length ? m.kueriGambar : [m.judul];
    let mesin;
    try {
      mesin = await cariDanUnduhGambar(kueri, { subfolder: 'ai' });
    } catch (g) {
      console.error('[ai] mesin gambar gagal:', g?.message);
      mesin = { hasil: null, statistik: null, kandidat: 0, dicoba: [], kueri };
    }
    const ringkasStat = mesin.statistik ? Object.fromEntries(Object.entries(mesin.statistik).map(([k, v]) => [k, { mentah: v.mentah, lolos: v.lolos, galat: v.galat.length }])) : null;
    if (mesin.hasil) {
      await simpanGambarSaran(n, mesin.hasil.jalur, { ...mesin.hasil.sumber, statistik: ringkasStat, dicoba: mesin.dicoba });
      gambar = { ada: true, jalur: mesin.hasil.jalur, penyedia: mesin.hasil.sumber.penyedia, lebar: mesin.hasil.lebar, tinggi: mesin.hasil.tinggi, catatan: null, statistik: ringkasStat };
    } else {
      // tidak ada kandidat berlisensi -> artikel tetap dibuat; penampung dipakai saat render (gambar_utama NULL)
      await simpanGambarSaran(n, null, { penyedia: null, catatan: 'tidak ada kandidat berlisensi yang memenuhi syarat', penyediaAktif: penyediaAktif(), statistik: ringkasStat, dicoba: mesin.dicoba, kueri: mesin.kueri });
      gambar = { ada: false, jalur: null, penyedia: null, catatan: 'Tidak ada foto berlisensi yang cocok; artikel dibuat dengan gambar penampung, unggah foto sendiri di editor.', statistik: ringkasStat };
    }
  }

  // artikel DRAF lewat jalur validasi + sanitasi yang sudah ada
  let muatan;
  try {
    muatan = validasiMuatanArtikel({ judul: m.judul, ringkasan: m.ringkasan, isi: m.isiHtml, gambar_utama: gambar.jalur, kategori_id: kategori.id, tag: m.tag || [] });
  } catch (galat) {
    if (galat instanceof GalatValidasi) throw new GalatHttp(galat.status, galat.message, galat.kode);
    throw galat;
  }
  const artikelId = await buatArtikel({ ...muatan, penulisId: pengguna.id, aiSaranId: n });
  const ditandai = await tandaiDipakai(n, artikelId);
  const ip = await alamatIpPermintaan(request);
  await catatAudit({ userId: pengguna.id, aksi: 'artikel_buat', tabelTerkait: 'artikel', idTerkait: artikelId, detail: { judul: muatan.judul, kategoriId: kategori.id, asalAi: n }, ip });
  await catatAudit({ userId: pengguna.id, aksi: 'ai_saran_pakai', tabelTerkait: 'ai_saran', idTerkait: n, detail: { artikelId, gambar: gambar.ada ? gambar.penyedia : 'penampung', statistik: gambar.statistik, ditandai }, ip });
  return NextResponse.json({ artikelId, gambar: { ada: gambar.ada, penyedia: gambar.penyedia, lebar: gambar.lebar ?? null, tinggi: gambar.tinggi ?? null, catatan: gambar.catatan } }, { status: 201, headers: { 'cache-control': 'no-store' } });
});
