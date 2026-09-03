// UJI c — ZONA WAKTU. Sisipkan baris dari aplikasi (lib/db), lalu bandingkan
// NOW(), @@session.time_zone, dibuat_pada, dan jam WIB sebenarnya (UTC+7 dari JS).
import 'dotenv/config';
import { kueri, tutupPool } from '../../../lib/db/index.js';
import { catatAudit } from '../../../lib/db/audit.js';
import { waktuSekarang } from '../../../lib/utils.js';

const jsUtc = new Date();
const wibSebenarnya = waktuSekarang(jsUtc); // UTC+7 dihitung dari JS, tanpa bergantung zona waktu mesin
console.log('Zona waktu mesin (TZ proses)      :', Intl.DateTimeFormat().resolvedOptions().timeZone, '| offset menit', jsUtc.getTimezoneOffset());
console.log('UTC sekarang (JS)                 :', jsUtc.toISOString());
console.log('WIB sebenarnya (UTC+7, dari JS)   :', wibSebenarnya);

// 1. sisipkan satu baris dari aplikasi
const id = await catatAudit({ userId: null, aksi: 'uji_zona_waktu', tabelTerkait: 'audit_log', detail: { uji: 'c' } });
console.log('\n1) INSERT lewat lib/db/audit.js catatAudit() -> id', id, '(dibuat_pada diisi aplikasi =', waktuSekarang() + ')');

// 2. NOW() dan zona sesi lewat pool aplikasi (hook SET time_zone)
const [b2] = await kueri(`SELECT NOW() AS now_db, @@session.time_zone AS zona_sesi, @@global.time_zone AS zona_global, @@system_time_zone AS zona_sistem_db`);
console.log('2) SELECT NOW(), @@session.time_zone (pool aplikasi):');
console.log('   NOW()               =', b2.now_db instanceof Date ? waktuSekarang(b2.now_db) + '  (Date dari mysql2, ditampilkan WIB)' : b2.now_db);
console.log('   @@session.time_zone =', b2.zona_sesi, '| @@global.time_zone =', b2.zona_global, '| @@system_time_zone =', b2.zona_sistem_db);

// 3. baris terakhir — mentah (CAST ke CHAR agar tidak diinterpretasi driver) dan sebagai Date
const [b3] = await kueri(`SELECT id, CAST(dibuat_pada AS CHAR) AS dibuat_pada_mentah, dibuat_pada FROM audit_log ORDER BY id DESC LIMIT 1`);
console.log('3) SELECT dibuat_pada FROM audit_log ORDER BY id DESC LIMIT 1:');
console.log('   tersimpan (CAST CHAR) =', b3.dibuat_pada_mentah, '| dibaca driver ->', waktuSekarang(b3.dibuat_pada));

// 4. perbandingan (toleransi 5 detik)
const keDetik = (s) => Date.parse(s.replace(' ', 'T') + 'Z');
const now = waktuSekarang(b2.now_db), simpan = b3.dibuat_pada_mentah;
const dNow = Math.abs(keDetik(now) - keDetik(wibSebenarnya)) / 1000;
const dSimpan = Math.abs(keDetik(simpan) - keDetik(wibSebenarnya)) / 1000;
console.log('\n4) Perbandingan dengan WIB sebenarnya', wibSebenarnya);
console.log('   NOW() DB        :', now, `selisih ${dNow.toFixed(0)} detik`);
console.log('   dibuat_pada     :', simpan, `selisih ${dSimpan.toFixed(0)} detik`);
console.log('   @@session.time_zone :', b2.zona_sesi);
const lulus = dNow < 5 && dSimpan < 5 && b2.zona_sesi === '+07:00';
console.log('\nHASIL:', lulus ? 'LULUS — ketiganya sama dengan jam WIB (tidak ada selisih 7 jam)' : 'GAGAL — ada selisih');
await tutupPool();
process.exit(lulus ? 0 : 1);
