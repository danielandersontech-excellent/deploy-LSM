// Uji fungsional tanpa peramban: susunMuatan(state) dari lib/pengaduanFormulir.js
import { susunMuatan, memuatIdentitas, FIELD_IDENTITAS, validasiKlien, gabungLampiran } from 'file:///D:/Deploy/LSM/lib/pengaduanFormulir.js';
import { validasiKirimanPengaduan } from 'file:///D:/Deploy/LSM/lib/validasi/pengaduan.js';

const dasar = {
  tokenFormulir: '1700000000000.' + 'a'.repeat(64),
  situsWeb: '',
  nama: 'Budi Contoh', nik: '3171234567890001', telepon: '081234567890', email: 'budi@contoh.id',
  kategori: 'korupsi', wilayahId: '13',
  deskripsi: 'Dugaan penyelewengan dana desa untuk proyek jalan yang tidak pernah dibangun sejak 2025.',
};

let gagal = 0;
function cek(kondisi, pesan) { console.log((kondisi ? 'LULUS ' : 'GAGAL ') + pesan); if (!kondisi) gagal++; }

console.log('=== 1. anonim=true, state identitas TERISI ===');
const muatanAnonim = susunMuatan({ ...dasar, anonim: true });
console.log(JSON.stringify(muatanAnonim, null, 2));
const namaField = muatanAnonim.map(([n]) => n);
cek(!memuatIdentitas(muatanAnonim), 'tidak ada field identitas di muatan');
for (const f of FIELD_IDENTITAS) cek(!namaField.includes(f), `field ${f} TIDAK ADA`);
cek(namaField.includes('anonim') && muatanAnonim.find(([n]) => n === 'anonim')[1] === '1', 'anonim=1 disertakan');
const nilaiGabung = muatanAnonim.map(([, v]) => v).join('|');
cek(!nilaiGabung.includes('Budi') && !nilaiGabung.includes('3171234567890001') && !nilaiGabung.includes('0812') && !nilaiGabung.includes('budi@contoh.id'), 'tidak ada NILAI identitas yang bocor lewat field lain');
cek(namaField.includes('token_formulir') && namaField.includes('situs_web'), 'token_formulir & honeypot situs_web ikut');

console.log('\n=== 2. anonim=false, state sama ===');
const muatanBernama = susunMuatan({ ...dasar, anonim: false });
console.log(JSON.stringify(muatanBernama, null, 2));
cek(memuatIdentitas(muatanBernama), 'identitas ikut dikirim bila TIDAK anonim');
cek(!muatanBernama.map(([n]) => n).includes('anonim'), 'field anonim tidak dikirim bila tidak dicentang');

console.log('\n=== 3. Muatan anonim diteruskan ke validasi server (lib/validasi/pengaduan.js) ===');
const objAnonim = Object.fromEntries(muatanAnonim);
const hasilServer = validasiKirimanPengaduan(objAnonim);
console.log(JSON.stringify(hasilServer, null, 2));
cek(hasilServer.anonim === true && hasilServer.namaPelapor === null && hasilServer.nikPelapor === null && hasilServer.teleponPelapor === null && hasilServer.emailPelapor === null, 'server menyimpan NULL untuk keempat identitas');

console.log('\n=== 4. Validasi klien ===');
cek(validasiKlien({ ...dasar, anonim: true, nama: '', telepon: '', email: '' }) === null, 'anonim tanpa identitas: lolos');
cek(validasiKlien({ ...dasar, anonim: false, telepon: '', email: '' })?.bidang === 'telepon_pelapor', 'bernama tanpa kontak: ditolak (bidang telepon_pelapor)');
cek(validasiKlien({ ...dasar, anonim: true, deskripsi: 'pendek' })?.bidang === 'deskripsi', 'deskripsi < 30: ditolak');
cek(validasiKlien({ ...dasar, anonim: true, kategori: '' })?.bidang === 'kategori_masalah', 'kategori kosong: ditolak');

console.log('\n=== 5. Batas lampiran klien ===');
const MB = 1024 * 1024;
const b = (name, size) => ({ name, size });
cek(gabungLampiran([], [b('a.jpg', 21 * MB)]).galat?.includes('20 MB'), '21 MB/berkas ditolak');
cek(gabungLampiran([], [b('a.exe', 1 * MB)]).galat?.includes('format'), 'ekstensi .exe ditolak');
const enam = gabungLampiran([], [1,2,3,4,5,6].map((i) => b(`f${i}.png`, 1 * MB)));
cek(enam.berkas.length === 5 && enam.galat?.includes('Maksimal 5'), 'berkas ke-6 ditolak (maks 5)');
const total = gabungLampiran([], [b('a.mp4', 19 * MB), b('b.mp4', 19 * MB), b('c.pdf', 5 * MB)]);
cek(total.berkas.length === 2 && total.galat?.includes('40 MB'), 'total > 40 MB ditolak');

console.log(`\nRINGKASAN: ${gagal === 0 ? 'SEMUA LULUS' : gagal + ' GAGAL'}`);
process.exit(gagal ? 1 : 0);
