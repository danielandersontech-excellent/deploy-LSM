// next.config.mjs — WARKOP NUSANTARA
// JANGAN pernah menambahkan output: 'standalone' — custom server.js butuh
// node_modules penuh dan berkas sumber (cetak biru bagian 6 catatan 1).

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // Seluruh gambar dilayani dari berkas lokal (public/, termasuk public/unggahan).
    // Tidak ada domain jarak jauh — cacat export 5 (googleusercontent) tidak boleh kembali.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Kerangka header keamanan. Dilengkapi (CSP, HSTS, Permissions-Policy) di Tahap 9.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
