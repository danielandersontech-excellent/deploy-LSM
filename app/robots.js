// app/robots.js — robots.txt. Ruang staf dan API tidak diindeks.
// Domain dari NEXT_PUBLIC_APP_URL (produksi: https://warkopnusantara.id).
export default function robots() {
  const dasar = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/staf/', '/api/', '/login', '/tanpa-akses'] },
    ],
    sitemap: `${dasar}/sitemap.xml`,
    host: dasar,
  };
}
