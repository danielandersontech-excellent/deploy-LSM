// scripts/buat-cap-air.mjs — QA-1 butir 2: turunan logo untuk CAP AIR latar (hero beranda/tentang, login).
// Desain memakai foto sangat samar pada opacity-5; logo asli berwarna pekat sehingga pada opacity-5 masih terlalu
// menonjol. Turunan ini: kontras & saturasi diturunkan, dicerahkan, alpha dikurangi -> public/logo-warkop-cap-air.png.
import sharp from 'sharp';
const sumber = 'public/logo-warkop-besar.png';
const meta = await sharp(sumber).metadata();
await sharp(sumber).ensureAlpha().modulate({ brightness: 1.35, saturation: 0.5 })
  .linear([0.5, 0.5, 0.5, 0.35], [128, 128, 128, 0]).png().toFile('public/logo-warkop-cap-air.png');
console.log(`cap air dibuat dari ${sumber} (${meta.width}x${meta.height}) -> public/logo-warkop-cap-air.png`);
