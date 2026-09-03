/** tailwind.config.js — WARKOP NUSANTARA
 *  Dibangkitkan PERSIS dari blok tailwind.config di
 *  Warkop_Nusantara.zip/stitch_portal_berita_inklusif/beranda_warkop_nusantara/code.html
 *  (47 token warna, 4 radius, 5 spacing, 8 tingkat tipografi).
 *  Satu-satunya perubahan: fontFamily menunjuk ke variabel CSS dari next/font/local,
 *  plus alias 'serif'/'sans' agar kelas bawaan pun memakai font yang benar.
 *  JANGAN mengubah nilai token — REFERENSI bagian 7.
 */
import formsPlugin from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      "colors": {
        "background": "#faf9f5",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#f2f1ed",
        "inverse-primary": "#e3beb8",
        "inverse-surface": "#2f312e",
        "on-background": "#1b1c1a",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "on-primary-container": "#ae8d87",
        "on-primary-fixed": "#2b1613",
        "on-primary-fixed-variant": "#5b403c",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#745c00",
        "on-secondary-fixed": "#241a00",
        "on-secondary-fixed-variant": "#574500",
        "on-surface": "#1b1c1a",
        "on-surface-variant": "#504442",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#a88f86",
        "on-tertiary-fixed": "#271812",
        "on-tertiary-fixed-variant": "#56423b",
        "outline": "#827472",
        "outline-variant": "#d3c3c0",
        "primary": "#271310",
        "primary-container": "#3e2723",
        "primary-fixed": "#ffdad4",
        "primary-fixed-dim": "#e3beb8",
        "secondary": "#735c00",
        "secondary-container": "#fed65b",
        "secondary-fixed": "#ffe088",
        "secondary-fixed-dim": "#e9c349",
        "surface": "#faf9f5",
        "surface-bright": "#faf9f5",
        "surface-container": "#efeeea",
        "surface-container-high": "#e9e8e4",
        "surface-container-highest": "#e3e2df",
        "surface-container-low": "#f4f4f0",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#dbdad6",
        "surface-tint": "#745853",
        "surface-variant": "#e3e2df",
        "tertiary": "#24150f",
        "tertiary-container": "#3a2922",
        "tertiary-fixed": "#fadcd2",
        "tertiary-fixed-dim": "#ddc1b7"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "container-max": "1280px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        "unit": "8px",
        "gutter": "24px"
      },
      "fontFamily": {
        "headline-xl": [
          "var(--font-domine)",
          "serif"
        ],
        "headline-lg": [
          "var(--font-domine)",
          "serif"
        ],
        "body-lg": [
          "var(--font-fira-sans)",
          "sans-serif"
        ],
        "body-md": [
          "var(--font-fira-sans)",
          "sans-serif"
        ],
        "label-md": [
          "var(--font-fira-sans)",
          "sans-serif"
        ],
        "motto": [
          "var(--font-domine)",
          "serif"
        ],
        "headline-md": [
          "var(--font-domine)",
          "serif"
        ],
        "headline-lg-mobile": [
          "var(--font-domine)",
          "serif"
        ],
        "serif": [
          "var(--font-domine)",
          "serif"
        ],
        "sans": [
          "var(--font-fira-sans)",
          "sans-serif"
        ]
      },
      "fontSize": {
        "headline-xl": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "fontWeight": "700"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "28px",
            "fontWeight": "400"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "label-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0.05em",
            "fontWeight": "600"
          }
        ],
        "motto": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "500"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "fontWeight": "600"
          }
        ],
        "headline-lg-mobile": [
          "28px",
          {
            "lineHeight": "36px",
            "fontWeight": "700"
          }
        ]
      }
    },
  },
  plugins: [formsPlugin],
};
