// GET /api/staf/pengaduan/[id]/lampiran/[lampiranId] — penyaji LAMPIRAN PENGADUAN yang TERJAGA
// (TAHAP-06 §10): hanya peran pengaduan_lihat, pimpinan_wilayah hanya wilayahnya (404 bila bukan),
// lampiran harus milik pengaduan itu (404 bila tidak cocok). Berkas ada di UPLOAD_DIR/pengaduan/<acak>/…
// yang TIDAK dilayani route /unggahan publik — jadi menebak URL tidak mungkin tanpa sesi berhak.
// Disajikan `Content-Disposition: attachment` (unduh, bukan render dalam halaman) + nosniff:
// berkas pengguna tidak pernah dirender langsung ke DOM (KEPUTUSAN BARU pratinjau aman: gambar
// ditampilkan lewat <img src=…> ke route ini dengan inline khusus gambar; pdf/mp4 diunduh).
// Setiap pembukaan dicatat di audit_log ('lihat_lampiran_pengaduan').
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilPengaduan, ambilLampiranById } from '@/lib/db/pengaduan';
import { jalurDiskTerjaga, jalurDiskUnggahan, MIME_DARI_EKSTENSI } from '@/lib/unggahan';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.pengaduan_lihat, async (request, { params }, pengguna) => {
  const { id, lampiranId } = await params;
  const n = Number(id), l = Number(lampiranId);
  if (!Number.isInteger(n) || n <= 0 || !Number.isInteger(l) || l <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');

  const pengaduan = await ambilPengaduan(n, { bolehLihatIdentitas: false, wilayahId: wilayahTerbatas(pengguna) });
  if (!pengaduan) throw new GalatHttp(404, 'Tidak ditemukan', 'TIDAK_DITEMUKAN');
  const lampiran = await ambilLampiranById(l);
  if (!lampiran || Number(lampiran.pengaduan_id) !== n) throw new GalatHttp(404, 'Tidak ditemukan', 'TIDAK_DITEMUKAN');

  // path tersimpan = "/terjaga/pengaduan/<acak>/<nama>" (direktori terjaga, di LUAR public/).
  // Jalur lama "/unggahan/…" (sebelum perbaikan uji k) masih dibaca dari UPLOAD_DIR agar data lama terbuka.
  const p = String(lampiran.path);
  const berkas = p.startsWith('/terjaga/')
    ? await jalurDiskTerjaga(p.replace(/^\/terjaga\//, '').split('/'))
    : await jalurDiskUnggahan(p.replace(/^\/unggahan\//, '').split('/'));
  if (!berkas) throw new GalatHttp(404, 'Berkas lampiran tidak ada di penyimpanan', 'BERKAS_HILANG');
  const ext = path.extname(berkas.jalur).slice(1).toLowerCase();
  const mime = MIME_DARI_EKSTENSI[ext] || 'application/octet-stream';
  const gambar = mime.startsWith('image/');

  await catatAudit({ userId: pengguna.id, aksi: 'lihat_lampiran_pengaduan', tabelTerkait: 'pengaduan_lampiran', idTerkait: l,
    detail: { pengaduanId: n, tipe: mime }, ip: await alamatIpPermintaan(request) });

  return new Response(Readable.toWeb(createReadStream(berkas.jalur)), {
    status: 200,
    headers: {
      'content-type': mime,
      'content-length': String(berkas.ukuran),
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'content-disposition': `${gambar ? 'inline' : 'attachment'}; filename="${lampiran.nama_berkas}"`,
    },
  });
});
