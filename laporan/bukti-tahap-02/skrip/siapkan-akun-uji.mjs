// Menyiapkan akun uji tambahan untuk UJI g (dua pimpinan_wilayah di wilayah berbeda) lewat lib/db.
// Kata sandi dari SEED_STAF_PASSWORD (.env lokal). Idempoten.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { tutupPool } from '../../../lib/db/index.js';
import { cariUserByEmail, buatUser } from '../../../lib/db/users.js';
import { ambilWilayahByKode } from '../../../lib/db/wilayah.js';

const sandi = process.env.SEED_STAF_PASSWORD;
if (!sandi) { console.error('SEED_STAF_PASSWORD kosong'); process.exit(1); }
const jabar = await ambilWilayahByKode('32');
const email = 'pimpinan.jabar@warkopnusantara.id';
const ada = await cariUserByEmail(email);
if (ada) console.log(`akun ${email} sudah ada (id ${ada.id}, wilayah ${ada.wilayah_id})`);
else {
  const id = await buatUser({ nama: 'Pimpinan Jawa Barat (uji)', email, kataSandiHash: await bcrypt.hash(sandi, 12), peran: 'pimpinan_wilayah', wilayahId: jabar.id, aktif: 1 });
  console.log(`akun ${email} dibuat (id ${id}, wilayah_id ${jabar.id} = Jawa Barat)`);
}
await tutupPool();
