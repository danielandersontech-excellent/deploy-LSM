// next.config.mjs — WARKOP NUSANTARA
// JANGAN pernah menambahkan output: 'standalone' — custom server.js butuh
// node_modules penuh dan berkas sumber (cetak biru bagian 6 catatan 1).

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // QA-2 C3 (BUG DIPERBAIKI): Next.js 16 memotong badan permintaan yang melewati proxy.js pada 10 MB (bawaan),
  // sehingga lampiran pengaduan 10-20 MB — masih di dalam batas 20 MB/berkas yang dijanjikan antarmuka dan
  // TAHAP-06 §4 — gagal diurai dan dibalas 400 "Muatan tidak sah". Batas dinaikkan sedikit DI ATAS batas
  // aplikasi sendiri (40 MB total + 2 MB kelonggaran yang sudah diperiksa route lewat Content-Length), agar
  // penolakan berkas terlalu besar tetap datang dari route dengan 413 dan pesan jelas, bukan pemotongan diam-diam.
  experimental: {
    proxyClientMaxBodySize: '44mb',
  },

  images: {
    // Seluruh gambar dilayani dari berkas lokal (public/, termasuk public/unggahan).
    // Tidak ada domain jarak jauh — cacat export 5 (googleusercontent) tidak boleh kembali.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Header keamanan (Tahap 9 B3, cetak biru bagian 11). Disusun dari kebutuhan nyata aplikasi ini:
  //  - script-src 'self' 'unsafe-inline': Next.js App Router menyisipkan skrip inline (muatan RSC self.__next_f.push,
  //    hidrasi). KEPUTUSAN BARU: tanpa nonce (nonce butuh CSP per-permintaan di proxy.js + pembacaan nonce di setiap
  //    <Script>; risiko regresi tinggi di custom server). Pertahanan XSS utama tetap sanitasi server (DOMPurify) +
  //    escaping React. 'unsafe-eval' HANYA di dev (HMR/React Refresh).
  //  - style-src 'unsafe-inline': next/font dan atribut style yang dihasilkan React.
  //  - connect-src 'self': mencakup wss://<host yang sama> (Socket.io same-origin); dev menambah ws:/wss: untuk HMR.
  //  - img/media 'self' data: blob: — gambar lokal (public/, /unggahan), pratinjau unggahan (blob:).
  //  - frame-ancestors 'none' (menggantikan X-Frame-Options untuk peramban modern; X-Frame-Options tetap dipasang).
  //  - HSTS hanya di produksi (dev = http://localhost).
  headers() {
    const dev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self'",
      `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(dev ? [] : ['upgrade-insecure-requests']),
    ].join('; ');
    const umum = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ...(dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
    ];
    return [{ source: '/(.*)', headers: umum }];
  },
};

export default nextConfig;
