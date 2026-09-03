// eslint.config.mjs — flat config (Next.js 16: `next lint` sudah dihapus; skrip lint memanggil eslint langsung)
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'desain/**', // sumber baca-saja
    'paket-pendukung/**', // sumber baca-saja
    'laporan/**',
    'public/**',
    '_backup*/**',
  ]),
  ...nextVitals,
  {
    // Berkas kerangka disalin apa adanya dari paket-pendukung (baca-saja) — aturan gaya ekspor dimatikan di sini, bukan berkasnya yang diubah.
    files: ['tailwind.config.js', 'postcss.config.js'],
    rules: { 'import/no-anonymous-default-export': 'off' },
  },
]);
