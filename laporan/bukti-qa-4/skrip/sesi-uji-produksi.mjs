#!/usr/bin/env node
// QA-4 — sesi akun staf uji PRODUKSI (pola uji-g-produksi QA-3, dipisah agar bisa dipakai banyak skrip).
//   node sesi-uji-produksi.mjs buka   -> mengaktifkan akun qa2.verifikasi.* (redaktur), menyetel sandi ACAK
//                                       lewat bcrypt DI DALAM container app, masuk, dan mencetak HANYA token
//                                       cookie warkop_token ke stdout (sandi tidak pernah dicetak/disimpan).
//   node sesi-uji-produksi.mjs tutup  -> menonaktifkan akun + menaikkan token_version (semua sesi batal).
// Akun ini tidak bisa dihapus (route hapus menolak akun berjejak audit, disengaja) sehingga dipakai ulang.
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const US = 'https://staf.warkopnusantara.id';
const ssh = (perintah, input) => execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106', perintah], { input, encoding: 'utf8' });
const sql = (teks) => ssh(`cat > /tmp/qa4s.sql && docker exec -i kwoz3jwjb037hw3oh669g9c4 sh -c 'exec mariadb -u$MARIADB_USER -p$MARIADB_PASSWORD $MARIADB_DATABASE' < /tmp/qa4s.sql; rm -f /tmp/qa4s.sql`, teks);
const aksi = process.argv[2];
const baris = sql("SELECT id, email FROM users WHERE email LIKE 'qa2.verifikasi.%' ORDER BY id LIMIT 1;").trim().split('\n');
if (baris.length < 2) { console.error('akun uji tidak ditemukan'); process.exit(1); }
const [idUji, emailUji] = baris[1].split('\t');

if (aksi === 'buka') {
  const sandi = `Qa4-${randomBytes(12).toString('base64url')}!`;
  const hash = ssh(`docker exec -i $(docker ps -q --filter name=re8snqu | head -1) node -e "const b=require('bcryptjs');process.stdout.write(b.hashSync(process.argv[1],12))" "${sandi}"`).trim();
  if (!/^\$2[aby]\$/.test(hash)) { console.error('hash gagal'); process.exit(1); }
  sql(`UPDATE users SET kata_sandi_hash='${hash}', aktif=1, wajib_ganti_sandi=0, token_version=token_version+1, diperbarui_pada=UTC_TIMESTAMP() WHERE id=${Number(idUji)};`);
  const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: emailUji, kataSandi: sandi }) });
  if (r.status !== 200) { console.error(`login akun uji HTTP ${r.status}`); process.exit(1); }
  const tk = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
  process.stdout.write(tk);
} else if (aksi === 'tutup') {
  sql(`UPDATE users SET aktif=0, token_version=token_version+1, diperbarui_pada=UTC_TIMESTAMP() WHERE id=${Number(idUji)};`);
  const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: emailUji, kataSandi: 'bukan-sandi' }) });
  console.log(`akun uji id ${idUji} dinonaktifkan; login sesudahnya HTTP ${r.status}`);
} else {
  console.error('Pemakaian: node sesi-uji-produksi.mjs buka|tutup'); process.exit(1);
}
