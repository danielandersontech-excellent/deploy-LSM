// app/uji-proxy/page.js — SEMENTARA (dihapus di Tahap 2).
// Menampilkan header x-uji-proxy yang diset proxy.js, untuk membuktikan proxy
// benar-benar berjalan di bawah custom server (UJI h Tahap 0).
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function HalamanUjiProxy() {
  const h = await headers();
  const nilai = h.get('x-uji-proxy') ?? '(header tidak ada: proxy TIDAK berjalan)';
  return (
    <main className="p-8 font-body-md text-body-md">
      <h1 className="font-headline-md text-headline-md mb-4">Uji proxy</h1>
      <p>{`x-uji-proxy: ${nilai}`}</p>
    </main>
  );
}
