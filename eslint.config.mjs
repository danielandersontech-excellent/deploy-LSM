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
    // QA-2 C4: aturan bawaan Next tidak menyalakan `no-undef`, sehingga salah ketik nama variabel di JSX
    // (mis. `disabled={memuat}` di KelolaPengurus, padahal namanya `sibuk`) lolos build dan baru meledak di
    // peramban saat tombol diklik — formulir Kelola Pengurus tidak bisa dipakai sama sekali. Aturan ini
    // menangkapnya saat `npm run lint`. Daftar global ditulis tangan (bukan paket `globals`) agar tidak
    // menambah dependensi di luar cetak biru bagian 4.
    files: ['app/**/*.js', 'components/**/*.js', 'lib/**/*.js', 'scripts/**/*.{js,mjs}', 'server.js', 'proxy.js'],
    languageOptions: {
      globals: Object.fromEntries([
        // Node.js
        'process', 'Buffer', '__dirname', '__filename', 'global', 'require', 'module', 'exports',
        // lintas lingkungan (Web API yang juga ada di Node 22)
        'console', 'fetch', 'Headers', 'Request', 'Response', 'FormData', 'Blob', 'File', 'URL', 'URLSearchParams',
        'AbortController', 'AbortSignal', 'TextEncoder', 'TextDecoder', 'WebSocket', 'crypto', 'structuredClone',
        'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'atob', 'btoa', 'performance',
        'Intl', 'ReadableStream', 'WritableStream', 'TransformStream', 'BroadcastChannel', 'EventTarget', 'Event',
        // peramban
        'window', 'document', 'navigator', 'location', 'history', 'screen', 'localStorage', 'sessionStorage',
        'getComputedStyle', 'getSelection', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia',
        'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'CustomEvent', 'FileReader', 'Image',
        'DOMParser', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement',
        'HTMLFormElement', 'CSS', 'alert', 'confirm', 'prompt', 'scrollTo', 'innerWidth', 'innerHeight',
      ].map((n) => [n, 'readonly'])),
    },
    rules: { 'no-undef': 'error' },
  },
  {
    // Berkas kerangka disalin apa adanya dari paket-pendukung (baca-saja) — aturan gaya ekspor dimatikan di sini, bukan berkasnya yang diubah.
    files: ['tailwind.config.js', 'postcss.config.js'],
    rules: { 'import/no-anonymous-default-export': 'off' },
  },
]);
