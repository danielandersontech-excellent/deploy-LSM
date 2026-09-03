// GET /unggahan/<sub>/<nama> — penyaji berkas unggahan dari UPLOAD_DIR (temuan Tahap 3: Next.js
// produksi tidak melayani berkas yang ditambah ke public/ setelah server mulai).
// Jalur diselesaikan aman (tanpa ../), hanya ekstensi yang dikenal, disajikan sebagai berkas
// statis TANPA eksekusi (Content-Type dari ekstensi yang sudah divalidasi saat unggah,
// X-Content-Type-Options: nosniff, Content-Disposition inline untuk gambar/pdf/mp4).
// Publik (lampiran pengaduan Tahap 6 memakai subfolder acak + nama acak 128-bit; tautan hanya
// diketahui staf berhak — dicatat sebagai KEPUTUSAN di Tahap 6).
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { jalurDiskUnggahan, MIME_DARI_EKSTENSI } from '@/lib/unggahan';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { jalur } = await params;
  const berkas = await jalurDiskUnggahan(jalur);
  if (!berkas) return new Response('Tidak ditemukan', { status: 404, headers: { 'cache-control': 'no-store' } });
  const ext = path.extname(berkas.jalur).slice(1).toLowerCase();
  const mime = MIME_DARI_EKSTENSI[ext];
  if (!mime) return new Response('Tidak ditemukan', { status: 404 });

  const etag = `"${berkas.ukuran}-${Math.floor(berkas.diubah.getTime() / 1000)}"`;
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { etag } });

  const aliran = Readable.toWeb(createReadStream(berkas.jalur));
  return new Response(aliran, {
    status: 200,
    headers: {
      'content-type': mime,
      'content-length': String(berkas.ukuran),
      'cache-control': 'public, max-age=31536000, immutable', // nama acak: aman di-cache lama
      'x-content-type-options': 'nosniff',
      'content-disposition': `inline; filename="${path.basename(berkas.jalur)}"`,
      etag,
    },
  });
}
