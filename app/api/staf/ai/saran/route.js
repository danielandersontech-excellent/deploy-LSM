// POST /api/staf/ai/saran — Asisten Berita AI (RUN AI-1 butir A). Peran HAK.artikel_buat (superadmin, redaktur, penulis).
//   body { topik } (3-120 karakter, disanitasi) -> riset Claude + web_search -> 2-3 saran JSON tervalidasi + tersanitasi
//   -> disimpan ai_saran (status 'baru') -> balasan { saran[], model, usage, ditolak[] }.
// Pembatas: 10 panggilan/pengguna/hari (DISTINCT kelompok, hari WIB, dibaca dari DB) + 1 proses serentak/pengguna
// (kunci memori proses) — keduanya diperiksa SEBELUM memanggil API agar tidak ada kredit terbuang.
// Audit 'ai_saran_buat' (topik + jumlah saran + model + token; tidak ada isi draf di audit).
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { simpanKelompokSaran, hitungPanggilanHariIni } from '@/lib/db/aiSaran';
import { validasiTopik, buatSaranBerita, KUOTA_HARIAN } from '@/lib/ai/saranBerita';
import { GalatAI } from '@/lib/ai/anthropic';
import { ambilKunciProses, lepasKunciProses } from '@/lib/ai/pembersihan';
import { GalatValidasi } from '@/lib/validasi/artikel';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export const POST = denganPeran(HAK.artikel_buat, async (request, _konteks, pengguna) => {
  const body = await bacaJson(request);
  let topik;
  try {
    topik = validasiTopik(body?.topik);
  } catch (galat) {
    if (galat instanceof GalatValidasi) throw new GalatHttp(galat.status, galat.message, galat.kode);
    throw galat;
  }

  const dipakai = await hitungPanggilanHariIni(pengguna.id);
  if (dipakai >= KUOTA_HARIAN) {
    throw new GalatHttp(429, `Kuota asisten AI hari ini sudah habis (${KUOTA_HARIAN} pencarian per pengguna per hari). Coba lagi besok.`, 'AI_KUOTA_HABIS');
  }
  const kunci = ambilKunciProses(pengguna.id);
  if (!kunci.ok) {
    throw new GalatHttp(429, kunci.alasan === 'pengguna'
      ? 'Permintaan Anda sebelumnya masih diproses; tunggu sampai selesai sebelum mencari topik lain.'
      : 'Asisten AI sedang melayani beberapa permintaan lain; coba lagi sebentar.', 'AI_SEDANG_DIPROSES');
  }

  try {
    let hasil;
    try {
      hasil = await buatSaranBerita(topik);
    } catch (galat) {
      if (galat instanceof GalatAI) {
        console.error('[ai] saran gagal:', galat.kode, galat.detail ? JSON.stringify(galat.detail) : '');
        throw new GalatHttp(galat.status, galat.message, galat.kode);
      }
      throw galat;
    }
    if (!hasil.saran.length) {
      await catatAudit({ userId: pengguna.id, aksi: 'ai_saran_buat', tabelTerkait: 'ai_saran', idTerkait: null,
        detail: { topik, jumlah: 0, ditolak: hasil.ditolak.length, model: hasil.model, tokenMasuk: hasil.usage.token_masuk, tokenKeluar: hasil.usage.token_keluar, pencarian: hasil.usage.pencarian, terpotong: hasil.terpotong }, ip: await alamatIpPermintaan(request) });
      throw new GalatHttp(502, hasil.ditolak.length
        ? `AI menghasilkan draf tetapi semuanya ditolak penjaga badan-bersih (${hasil.ditolak[0]}). Coba lagi dengan topik yang lebih spesifik.`
        : 'AI tidak menghasilkan draf yang dapat dibaca. Coba lagi dengan topik yang lebih spesifik.', 'AI_TANPA_SARAN');
    }
    const id = await simpanKelompokSaran({
      kelompok: hasil.kelompok, topik, daftar: hasil.saran, pemakaiId: pengguna.id, model: hasil.model,
      tokenMasuk: hasil.usage.token_masuk, tokenKeluar: hasil.usage.token_keluar, jumlahPencarian: hasil.usage.pencarian,
    });
    await catatAudit({ userId: pengguna.id, aksi: 'ai_saran_buat', tabelTerkait: 'ai_saran', idTerkait: id[0],
      detail: { topik, jumlah: id.length, ditolak: hasil.ditolak.length, model: hasil.model, tokenMasuk: hasil.usage.token_masuk, tokenKeluar: hasil.usage.token_keluar, pencarian: hasil.usage.pencarian, durasiMs: hasil.durasiMs, terpotong: hasil.terpotong, kelompok: hasil.kelompok }, ip: await alamatIpPermintaan(request) });
    return NextResponse.json({
      saran: hasil.saran.map((m, i) => ({ id: id[i], status: 'baru', topik, dibuat_pada: new Date().toISOString(), muatan: m })),
      model: hasil.model,
      usage: hasil.usage,
      ditolak: hasil.ditolak,
      terpotong: hasil.terpotong,
      durasiMs: hasil.durasiMs,
      kuota: { dipakai: dipakai + 1, maks: KUOTA_HARIAN },
    }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } finally {
    lepasKunciProses(pengguna.id);
  }
});
