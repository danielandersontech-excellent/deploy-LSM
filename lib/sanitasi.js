// lib/sanitasi.js — sanitasi HTML isi artikel DI SERVER, SEBELUM disimpan (TAHAP-05 aturan wajib).
// Penyerang memanggil API langsung, bukan editor — jadi daftar putih ditegakkan di sini dan
// isi yang tersimpan di basis data sudah bersih (bukan hanya bersih saat ditampilkan).
//
// KEPUTUSAN BARU — daftar putih (tag & atribut) mengikuti toolbar editor_artikel_admin/code.html:
//   B, I, U, H1, H2, kutipan, daftar tak berurut/berurut, tautan, sisip gambar
//   + struktur dasar artikel (p, br, h3, figure/figcaption, hr, table sederhana, code/pre).
// Yang DILARANG: script, style, iframe, object/embed, form/input, svg/math (vektor XSS),
// seluruh atribut on*, href/src berskema selain http(s)/mailto/tel dan jalur relatif,
// style inline, class/id (kelas tampilan ditentukan komponen render, bukan penulis).
import DOMPurify from 'isomorphic-dompurify';

const TAG_DIIZINKAN = Object.freeze([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4',
  'blockquote', 'ul', 'ol', 'li',
  'a', 'img', 'figure', 'figcaption',
  'hr', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

const ATRIBUT_DIIZINKAN = Object.freeze(['href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height', 'colspan', 'rowspan', 'start']);

// Hanya skema aman untuk href/src; javascript:, data:, vbscript: dibuang oleh DOMPurify + regex ini.
const SKEMA_AMAN = /^(?:(?:https?|mailto|tel):|[^a-z0-9+.-]*[/#?])/i;

// Hook dipasang sekali per proses: tautan luar dipaksa rel="noopener noreferrer";
// gambar hanya boleh dari situs sendiri (jalur relatif / unggahan) atau https.
let hookTerpasang = false;
function pasangHook() {
  if (hookTerpasang) return;
  hookTerpasang = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      const href = node.getAttribute('href');
      if (/^https?:/i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      } else {
        node.removeAttribute('target');
      }
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!(src.startsWith('/') || /^https:/i.test(src))) node.removeAttribute('src');
      if (!node.getAttribute('alt')) node.setAttribute('alt', '');
    }
  });
}

/**
 * Membersihkan HTML isi artikel. Mengembalikan string HTML yang hanya memuat tag/atribut
 * daftar putih. Dipanggil route API sebelum INSERT/UPDATE — dan boleh dipanggil lagi saat
 * render sebagai lapisan kedua (murah, idempoten).
 */
export function sanitasiIsiArtikel(html) {
  pasangHook();
  return DOMPurify.sanitize(String(html ?? ''), {
    ALLOWED_TAGS: [...TAG_DIIZINKAN],
    ALLOWED_ATTR: [...ATRIBUT_DIIZINKAN],
    ALLOWED_URI_REGEXP: SKEMA_AMAN,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'svg', 'math', 'link', 'meta', 'base'],
    FORBID_ATTR: ['style', 'class', 'id', 'onerror', 'onload', 'onclick', 'srcset', 'formaction'],
    KEEP_CONTENT: true,          // teks di dalam tag terlarang tetap dipertahankan (skrip dibuang beserta isinya oleh DOMPurify)
    RETURN_TRUSTED_TYPE: false,
  });
}

/** Teks polos (tanpa tag) untuk ringkasan otomatis / meta description. */
export function teksPolos(html, maks = 300) {
  const t = sanitasiIsiArtikel(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maks ? `${t.slice(0, maks - 1).trimEnd()}…` : t;
}
