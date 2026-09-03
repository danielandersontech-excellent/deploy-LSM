// app/font.js — Domine + Fira Sans lewat next/font/local (OFL, dibundel, tanpa unduhan saat build)
import localFont from 'next/font/local';

export const domine = localFont({
  src: [{ path: '../public/fonts/Domine[wght].woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-domine',
  display: 'swap',
});

export const firaSans = localFont({
  src: [
    { path: '../public/fonts/FiraSans-Regular.woff2',  weight: '400', style: 'normal' },
    { path: '../public/fonts/FiraSans-Italic.woff2',   weight: '400', style: 'italic' },
    { path: '../public/fonts/FiraSans-Medium.woff2',   weight: '500', style: 'normal' },
    { path: '../public/fonts/FiraSans-SemiBold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-fira-sans',
  display: 'swap',
});
