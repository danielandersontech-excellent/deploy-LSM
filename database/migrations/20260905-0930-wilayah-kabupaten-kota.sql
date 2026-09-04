-- =====================================================================
--  database/migrations/20260905-0930-wilayah-kabupaten-kota.sql — RUN QA-3 butir A3
--  DIBANGKITKAN oleh laporan/bukti-qa-3/skrip/buat-migrasi-wilayah.mjs (jangan disunting tangan;
--  ubah daftarnya di skrip itu lalu bangkitkan ulang).
--
--  Tabel wilayah SUDAH bertingkat sejak Tahap 01: kolom jenis enum('pusat','provinsi','kabupaten_kota')
--  dan induk_id. Migrasi ini HANYA MENAMBAH baris kabupaten/kota; 39 baris lama (id 1-39, dipakai
--  pengaduan.wilayah_id, program.wilayah_id, users.wilayah_id) TIDAK DISENTUH sama sekali.
--
--  induk_id tidak ditulis tangan melainkan diambil lewat JOIN ke baris provinsi berdasarkan kode,
--  sehingga tidak mungkin salah pasang meski id provinsi berbeda antar lingkungan.
--  Idempoten: kunci unik `kode` + ON DUPLICATE KEY UPDATE.
--
--  KODE bersifat INTERNAL: "K" + kode provinsi + nomor urut (mis. K1401). Sengaja TIDAK memakai
--  format kode resmi BPS/Kemendagri agar tidak ada yang mengira daftar ini sudah tervalidasi.
--
--  KEJUJURAN DATA: daftar 514 kabupaten/kota ini disusun dari pengetahuan umum, BUKAN dari
--  salinan basis data resmi. Pemekaran/perubahan nama daerah terjadi berkala, jadi daftar ini bisa
--  tidak mutakhir. Pemilik perlu meninjau dan mengoreksi lewat basis data (lihat MENUNGGU PEMILIK
--  di laporan/LAPORAN-QA-3.md). Tidak ada satu pun nama daerah yang dipakai sebagai konten publik
--  selain sebagai pilihan wilayah.
-- =====================================================================

-- provinsi 11: 23 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1101' AS kode, 'Kabupaten Simeulue' AS nama
    UNION ALL
    SELECT 'K1102' AS kode, 'Kabupaten Aceh Singkil' AS nama
    UNION ALL
    SELECT 'K1103' AS kode, 'Kabupaten Aceh Selatan' AS nama
    UNION ALL
    SELECT 'K1104' AS kode, 'Kabupaten Aceh Tenggara' AS nama
    UNION ALL
    SELECT 'K1105' AS kode, 'Kabupaten Aceh Timur' AS nama
    UNION ALL
    SELECT 'K1106' AS kode, 'Kabupaten Aceh Tengah' AS nama
    UNION ALL
    SELECT 'K1107' AS kode, 'Kabupaten Aceh Barat' AS nama
    UNION ALL
    SELECT 'K1108' AS kode, 'Kabupaten Aceh Besar' AS nama
    UNION ALL
    SELECT 'K1109' AS kode, 'Kabupaten Pidie' AS nama
    UNION ALL
    SELECT 'K1110' AS kode, 'Kabupaten Bireuen' AS nama
    UNION ALL
    SELECT 'K1111' AS kode, 'Kabupaten Aceh Utara' AS nama
    UNION ALL
    SELECT 'K1112' AS kode, 'Kabupaten Aceh Barat Daya' AS nama
    UNION ALL
    SELECT 'K1113' AS kode, 'Kabupaten Gayo Lues' AS nama
    UNION ALL
    SELECT 'K1114' AS kode, 'Kabupaten Aceh Tamiang' AS nama
    UNION ALL
    SELECT 'K1115' AS kode, 'Kabupaten Nagan Raya' AS nama
    UNION ALL
    SELECT 'K1116' AS kode, 'Kabupaten Aceh Jaya' AS nama
    UNION ALL
    SELECT 'K1117' AS kode, 'Kabupaten Bener Meriah' AS nama
    UNION ALL
    SELECT 'K1118' AS kode, 'Kabupaten Pidie Jaya' AS nama
    UNION ALL
    SELECT 'K1119' AS kode, 'Kota Banda Aceh' AS nama
    UNION ALL
    SELECT 'K1120' AS kode, 'Kota Sabang' AS nama
    UNION ALL
    SELECT 'K1121' AS kode, 'Kota Langsa' AS nama
    UNION ALL
    SELECT 'K1122' AS kode, 'Kota Lhokseumawe' AS nama
    UNION ALL
    SELECT 'K1123' AS kode, 'Kota Subulussalam' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '11'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 12: 33 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1201' AS kode, 'Kabupaten Nias' AS nama
    UNION ALL
    SELECT 'K1202' AS kode, 'Kabupaten Mandailing Natal' AS nama
    UNION ALL
    SELECT 'K1203' AS kode, 'Kabupaten Tapanuli Selatan' AS nama
    UNION ALL
    SELECT 'K1204' AS kode, 'Kabupaten Tapanuli Tengah' AS nama
    UNION ALL
    SELECT 'K1205' AS kode, 'Kabupaten Tapanuli Utara' AS nama
    UNION ALL
    SELECT 'K1206' AS kode, 'Kabupaten Toba' AS nama
    UNION ALL
    SELECT 'K1207' AS kode, 'Kabupaten Labuhanbatu' AS nama
    UNION ALL
    SELECT 'K1208' AS kode, 'Kabupaten Asahan' AS nama
    UNION ALL
    SELECT 'K1209' AS kode, 'Kabupaten Simalungun' AS nama
    UNION ALL
    SELECT 'K1210' AS kode, 'Kabupaten Dairi' AS nama
    UNION ALL
    SELECT 'K1211' AS kode, 'Kabupaten Karo' AS nama
    UNION ALL
    SELECT 'K1212' AS kode, 'Kabupaten Deli Serdang' AS nama
    UNION ALL
    SELECT 'K1213' AS kode, 'Kabupaten Langkat' AS nama
    UNION ALL
    SELECT 'K1214' AS kode, 'Kabupaten Nias Selatan' AS nama
    UNION ALL
    SELECT 'K1215' AS kode, 'Kabupaten Humbang Hasundutan' AS nama
    UNION ALL
    SELECT 'K1216' AS kode, 'Kabupaten Pakpak Bharat' AS nama
    UNION ALL
    SELECT 'K1217' AS kode, 'Kabupaten Samosir' AS nama
    UNION ALL
    SELECT 'K1218' AS kode, 'Kabupaten Serdang Bedagai' AS nama
    UNION ALL
    SELECT 'K1219' AS kode, 'Kabupaten Batu Bara' AS nama
    UNION ALL
    SELECT 'K1220' AS kode, 'Kabupaten Padang Lawas Utara' AS nama
    UNION ALL
    SELECT 'K1221' AS kode, 'Kabupaten Padang Lawas' AS nama
    UNION ALL
    SELECT 'K1222' AS kode, 'Kabupaten Labuhanbatu Selatan' AS nama
    UNION ALL
    SELECT 'K1223' AS kode, 'Kabupaten Labuhanbatu Utara' AS nama
    UNION ALL
    SELECT 'K1224' AS kode, 'Kabupaten Nias Utara' AS nama
    UNION ALL
    SELECT 'K1225' AS kode, 'Kabupaten Nias Barat' AS nama
    UNION ALL
    SELECT 'K1226' AS kode, 'Kota Sibolga' AS nama
    UNION ALL
    SELECT 'K1227' AS kode, 'Kota Tanjungbalai' AS nama
    UNION ALL
    SELECT 'K1228' AS kode, 'Kota Pematangsiantar' AS nama
    UNION ALL
    SELECT 'K1229' AS kode, 'Kota Tebing Tinggi' AS nama
    UNION ALL
    SELECT 'K1230' AS kode, 'Kota Medan' AS nama
    UNION ALL
    SELECT 'K1231' AS kode, 'Kota Binjai' AS nama
    UNION ALL
    SELECT 'K1232' AS kode, 'Kota Padangsidimpuan' AS nama
    UNION ALL
    SELECT 'K1233' AS kode, 'Kota Gunungsitoli' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '12'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 13: 19 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1301' AS kode, 'Kabupaten Kepulauan Mentawai' AS nama
    UNION ALL
    SELECT 'K1302' AS kode, 'Kabupaten Pesisir Selatan' AS nama
    UNION ALL
    SELECT 'K1303' AS kode, 'Kabupaten Solok' AS nama
    UNION ALL
    SELECT 'K1304' AS kode, 'Kabupaten Sijunjung' AS nama
    UNION ALL
    SELECT 'K1305' AS kode, 'Kabupaten Tanah Datar' AS nama
    UNION ALL
    SELECT 'K1306' AS kode, 'Kabupaten Padang Pariaman' AS nama
    UNION ALL
    SELECT 'K1307' AS kode, 'Kabupaten Agam' AS nama
    UNION ALL
    SELECT 'K1308' AS kode, 'Kabupaten Lima Puluh Kota' AS nama
    UNION ALL
    SELECT 'K1309' AS kode, 'Kabupaten Pasaman' AS nama
    UNION ALL
    SELECT 'K1310' AS kode, 'Kabupaten Solok Selatan' AS nama
    UNION ALL
    SELECT 'K1311' AS kode, 'Kabupaten Dharmasraya' AS nama
    UNION ALL
    SELECT 'K1312' AS kode, 'Kabupaten Pasaman Barat' AS nama
    UNION ALL
    SELECT 'K1313' AS kode, 'Kota Padang' AS nama
    UNION ALL
    SELECT 'K1314' AS kode, 'Kota Solok' AS nama
    UNION ALL
    SELECT 'K1315' AS kode, 'Kota Sawahlunto' AS nama
    UNION ALL
    SELECT 'K1316' AS kode, 'Kota Padang Panjang' AS nama
    UNION ALL
    SELECT 'K1317' AS kode, 'Kota Bukittinggi' AS nama
    UNION ALL
    SELECT 'K1318' AS kode, 'Kota Payakumbuh' AS nama
    UNION ALL
    SELECT 'K1319' AS kode, 'Kota Pariaman' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '13'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 14: 12 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1401' AS kode, 'Kabupaten Kuantan Singingi' AS nama
    UNION ALL
    SELECT 'K1402' AS kode, 'Kabupaten Indragiri Hulu' AS nama
    UNION ALL
    SELECT 'K1403' AS kode, 'Kabupaten Indragiri Hilir' AS nama
    UNION ALL
    SELECT 'K1404' AS kode, 'Kabupaten Pelalawan' AS nama
    UNION ALL
    SELECT 'K1405' AS kode, 'Kabupaten Siak' AS nama
    UNION ALL
    SELECT 'K1406' AS kode, 'Kabupaten Kampar' AS nama
    UNION ALL
    SELECT 'K1407' AS kode, 'Kabupaten Rokan Hulu' AS nama
    UNION ALL
    SELECT 'K1408' AS kode, 'Kabupaten Bengkalis' AS nama
    UNION ALL
    SELECT 'K1409' AS kode, 'Kabupaten Rokan Hilir' AS nama
    UNION ALL
    SELECT 'K1410' AS kode, 'Kabupaten Kepulauan Meranti' AS nama
    UNION ALL
    SELECT 'K1411' AS kode, 'Kota Pekanbaru' AS nama
    UNION ALL
    SELECT 'K1412' AS kode, 'Kota Dumai' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '14'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 15: 11 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1501' AS kode, 'Kabupaten Kerinci' AS nama
    UNION ALL
    SELECT 'K1502' AS kode, 'Kabupaten Merangin' AS nama
    UNION ALL
    SELECT 'K1503' AS kode, 'Kabupaten Sarolangun' AS nama
    UNION ALL
    SELECT 'K1504' AS kode, 'Kabupaten Batanghari' AS nama
    UNION ALL
    SELECT 'K1505' AS kode, 'Kabupaten Muaro Jambi' AS nama
    UNION ALL
    SELECT 'K1506' AS kode, 'Kabupaten Tanjung Jabung Timur' AS nama
    UNION ALL
    SELECT 'K1507' AS kode, 'Kabupaten Tanjung Jabung Barat' AS nama
    UNION ALL
    SELECT 'K1508' AS kode, 'Kabupaten Tebo' AS nama
    UNION ALL
    SELECT 'K1509' AS kode, 'Kabupaten Bungo' AS nama
    UNION ALL
    SELECT 'K1510' AS kode, 'Kota Jambi' AS nama
    UNION ALL
    SELECT 'K1511' AS kode, 'Kota Sungai Penuh' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '15'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 16: 17 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1601' AS kode, 'Kabupaten Ogan Komering Ulu' AS nama
    UNION ALL
    SELECT 'K1602' AS kode, 'Kabupaten Ogan Komering Ilir' AS nama
    UNION ALL
    SELECT 'K1603' AS kode, 'Kabupaten Muara Enim' AS nama
    UNION ALL
    SELECT 'K1604' AS kode, 'Kabupaten Lahat' AS nama
    UNION ALL
    SELECT 'K1605' AS kode, 'Kabupaten Musi Rawas' AS nama
    UNION ALL
    SELECT 'K1606' AS kode, 'Kabupaten Musi Banyuasin' AS nama
    UNION ALL
    SELECT 'K1607' AS kode, 'Kabupaten Banyuasin' AS nama
    UNION ALL
    SELECT 'K1608' AS kode, 'Kabupaten Ogan Komering Ulu Selatan' AS nama
    UNION ALL
    SELECT 'K1609' AS kode, 'Kabupaten Ogan Komering Ulu Timur' AS nama
    UNION ALL
    SELECT 'K1610' AS kode, 'Kabupaten Ogan Ilir' AS nama
    UNION ALL
    SELECT 'K1611' AS kode, 'Kabupaten Empat Lawang' AS nama
    UNION ALL
    SELECT 'K1612' AS kode, 'Kabupaten Penukal Abab Lematang Ilir' AS nama
    UNION ALL
    SELECT 'K1613' AS kode, 'Kabupaten Musi Rawas Utara' AS nama
    UNION ALL
    SELECT 'K1614' AS kode, 'Kota Palembang' AS nama
    UNION ALL
    SELECT 'K1615' AS kode, 'Kota Prabumulih' AS nama
    UNION ALL
    SELECT 'K1616' AS kode, 'Kota Pagar Alam' AS nama
    UNION ALL
    SELECT 'K1617' AS kode, 'Kota Lubuklinggau' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '16'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 17: 10 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1701' AS kode, 'Kabupaten Bengkulu Selatan' AS nama
    UNION ALL
    SELECT 'K1702' AS kode, 'Kabupaten Rejang Lebong' AS nama
    UNION ALL
    SELECT 'K1703' AS kode, 'Kabupaten Bengkulu Utara' AS nama
    UNION ALL
    SELECT 'K1704' AS kode, 'Kabupaten Kaur' AS nama
    UNION ALL
    SELECT 'K1705' AS kode, 'Kabupaten Seluma' AS nama
    UNION ALL
    SELECT 'K1706' AS kode, 'Kabupaten Mukomuko' AS nama
    UNION ALL
    SELECT 'K1707' AS kode, 'Kabupaten Lebong' AS nama
    UNION ALL
    SELECT 'K1708' AS kode, 'Kabupaten Kepahiang' AS nama
    UNION ALL
    SELECT 'K1709' AS kode, 'Kabupaten Bengkulu Tengah' AS nama
    UNION ALL
    SELECT 'K1710' AS kode, 'Kota Bengkulu' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '17'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 18: 15 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1801' AS kode, 'Kabupaten Lampung Barat' AS nama
    UNION ALL
    SELECT 'K1802' AS kode, 'Kabupaten Tanggamus' AS nama
    UNION ALL
    SELECT 'K1803' AS kode, 'Kabupaten Lampung Selatan' AS nama
    UNION ALL
    SELECT 'K1804' AS kode, 'Kabupaten Lampung Timur' AS nama
    UNION ALL
    SELECT 'K1805' AS kode, 'Kabupaten Lampung Tengah' AS nama
    UNION ALL
    SELECT 'K1806' AS kode, 'Kabupaten Lampung Utara' AS nama
    UNION ALL
    SELECT 'K1807' AS kode, 'Kabupaten Way Kanan' AS nama
    UNION ALL
    SELECT 'K1808' AS kode, 'Kabupaten Tulang Bawang' AS nama
    UNION ALL
    SELECT 'K1809' AS kode, 'Kabupaten Pesawaran' AS nama
    UNION ALL
    SELECT 'K1810' AS kode, 'Kabupaten Pringsewu' AS nama
    UNION ALL
    SELECT 'K1811' AS kode, 'Kabupaten Mesuji' AS nama
    UNION ALL
    SELECT 'K1812' AS kode, 'Kabupaten Tulang Bawang Barat' AS nama
    UNION ALL
    SELECT 'K1813' AS kode, 'Kabupaten Pesisir Barat' AS nama
    UNION ALL
    SELECT 'K1814' AS kode, 'Kota Bandar Lampung' AS nama
    UNION ALL
    SELECT 'K1815' AS kode, 'Kota Metro' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '18'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 19: 7 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K1901' AS kode, 'Kabupaten Bangka' AS nama
    UNION ALL
    SELECT 'K1902' AS kode, 'Kabupaten Belitung' AS nama
    UNION ALL
    SELECT 'K1903' AS kode, 'Kabupaten Bangka Barat' AS nama
    UNION ALL
    SELECT 'K1904' AS kode, 'Kabupaten Bangka Tengah' AS nama
    UNION ALL
    SELECT 'K1905' AS kode, 'Kabupaten Bangka Selatan' AS nama
    UNION ALL
    SELECT 'K1906' AS kode, 'Kabupaten Belitung Timur' AS nama
    UNION ALL
    SELECT 'K1907' AS kode, 'Kota Pangkalpinang' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '19'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 21: 7 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K2101' AS kode, 'Kabupaten Karimun' AS nama
    UNION ALL
    SELECT 'K2102' AS kode, 'Kabupaten Bintan' AS nama
    UNION ALL
    SELECT 'K2103' AS kode, 'Kabupaten Natuna' AS nama
    UNION ALL
    SELECT 'K2104' AS kode, 'Kabupaten Lingga' AS nama
    UNION ALL
    SELECT 'K2105' AS kode, 'Kabupaten Kepulauan Anambas' AS nama
    UNION ALL
    SELECT 'K2106' AS kode, 'Kota Batam' AS nama
    UNION ALL
    SELECT 'K2107' AS kode, 'Kota Tanjungpinang' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '21'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 31: 6 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K3101' AS kode, 'Kabupaten Administrasi Kepulauan Seribu' AS nama
    UNION ALL
    SELECT 'K3102' AS kode, 'Kota Administrasi Jakarta Selatan' AS nama
    UNION ALL
    SELECT 'K3103' AS kode, 'Kota Administrasi Jakarta Timur' AS nama
    UNION ALL
    SELECT 'K3104' AS kode, 'Kota Administrasi Jakarta Pusat' AS nama
    UNION ALL
    SELECT 'K3105' AS kode, 'Kota Administrasi Jakarta Barat' AS nama
    UNION ALL
    SELECT 'K3106' AS kode, 'Kota Administrasi Jakarta Utara' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '31'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 32: 27 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K3201' AS kode, 'Kabupaten Bogor' AS nama
    UNION ALL
    SELECT 'K3202' AS kode, 'Kabupaten Sukabumi' AS nama
    UNION ALL
    SELECT 'K3203' AS kode, 'Kabupaten Cianjur' AS nama
    UNION ALL
    SELECT 'K3204' AS kode, 'Kabupaten Bandung' AS nama
    UNION ALL
    SELECT 'K3205' AS kode, 'Kabupaten Garut' AS nama
    UNION ALL
    SELECT 'K3206' AS kode, 'Kabupaten Tasikmalaya' AS nama
    UNION ALL
    SELECT 'K3207' AS kode, 'Kabupaten Ciamis' AS nama
    UNION ALL
    SELECT 'K3208' AS kode, 'Kabupaten Kuningan' AS nama
    UNION ALL
    SELECT 'K3209' AS kode, 'Kabupaten Cirebon' AS nama
    UNION ALL
    SELECT 'K3210' AS kode, 'Kabupaten Majalengka' AS nama
    UNION ALL
    SELECT 'K3211' AS kode, 'Kabupaten Sumedang' AS nama
    UNION ALL
    SELECT 'K3212' AS kode, 'Kabupaten Indramayu' AS nama
    UNION ALL
    SELECT 'K3213' AS kode, 'Kabupaten Subang' AS nama
    UNION ALL
    SELECT 'K3214' AS kode, 'Kabupaten Purwakarta' AS nama
    UNION ALL
    SELECT 'K3215' AS kode, 'Kabupaten Karawang' AS nama
    UNION ALL
    SELECT 'K3216' AS kode, 'Kabupaten Bekasi' AS nama
    UNION ALL
    SELECT 'K3217' AS kode, 'Kabupaten Bandung Barat' AS nama
    UNION ALL
    SELECT 'K3218' AS kode, 'Kabupaten Pangandaran' AS nama
    UNION ALL
    SELECT 'K3219' AS kode, 'Kota Bogor' AS nama
    UNION ALL
    SELECT 'K3220' AS kode, 'Kota Sukabumi' AS nama
    UNION ALL
    SELECT 'K3221' AS kode, 'Kota Bandung' AS nama
    UNION ALL
    SELECT 'K3222' AS kode, 'Kota Cirebon' AS nama
    UNION ALL
    SELECT 'K3223' AS kode, 'Kota Bekasi' AS nama
    UNION ALL
    SELECT 'K3224' AS kode, 'Kota Depok' AS nama
    UNION ALL
    SELECT 'K3225' AS kode, 'Kota Cimahi' AS nama
    UNION ALL
    SELECT 'K3226' AS kode, 'Kota Tasikmalaya' AS nama
    UNION ALL
    SELECT 'K3227' AS kode, 'Kota Banjar' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '32'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 33: 35 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K3301' AS kode, 'Kabupaten Cilacap' AS nama
    UNION ALL
    SELECT 'K3302' AS kode, 'Kabupaten Banyumas' AS nama
    UNION ALL
    SELECT 'K3303' AS kode, 'Kabupaten Purbalingga' AS nama
    UNION ALL
    SELECT 'K3304' AS kode, 'Kabupaten Banjarnegara' AS nama
    UNION ALL
    SELECT 'K3305' AS kode, 'Kabupaten Kebumen' AS nama
    UNION ALL
    SELECT 'K3306' AS kode, 'Kabupaten Purworejo' AS nama
    UNION ALL
    SELECT 'K3307' AS kode, 'Kabupaten Wonosobo' AS nama
    UNION ALL
    SELECT 'K3308' AS kode, 'Kabupaten Magelang' AS nama
    UNION ALL
    SELECT 'K3309' AS kode, 'Kabupaten Boyolali' AS nama
    UNION ALL
    SELECT 'K3310' AS kode, 'Kabupaten Klaten' AS nama
    UNION ALL
    SELECT 'K3311' AS kode, 'Kabupaten Sukoharjo' AS nama
    UNION ALL
    SELECT 'K3312' AS kode, 'Kabupaten Wonogiri' AS nama
    UNION ALL
    SELECT 'K3313' AS kode, 'Kabupaten Karanganyar' AS nama
    UNION ALL
    SELECT 'K3314' AS kode, 'Kabupaten Sragen' AS nama
    UNION ALL
    SELECT 'K3315' AS kode, 'Kabupaten Grobogan' AS nama
    UNION ALL
    SELECT 'K3316' AS kode, 'Kabupaten Blora' AS nama
    UNION ALL
    SELECT 'K3317' AS kode, 'Kabupaten Rembang' AS nama
    UNION ALL
    SELECT 'K3318' AS kode, 'Kabupaten Pati' AS nama
    UNION ALL
    SELECT 'K3319' AS kode, 'Kabupaten Kudus' AS nama
    UNION ALL
    SELECT 'K3320' AS kode, 'Kabupaten Jepara' AS nama
    UNION ALL
    SELECT 'K3321' AS kode, 'Kabupaten Demak' AS nama
    UNION ALL
    SELECT 'K3322' AS kode, 'Kabupaten Semarang' AS nama
    UNION ALL
    SELECT 'K3323' AS kode, 'Kabupaten Temanggung' AS nama
    UNION ALL
    SELECT 'K3324' AS kode, 'Kabupaten Kendal' AS nama
    UNION ALL
    SELECT 'K3325' AS kode, 'Kabupaten Batang' AS nama
    UNION ALL
    SELECT 'K3326' AS kode, 'Kabupaten Pekalongan' AS nama
    UNION ALL
    SELECT 'K3327' AS kode, 'Kabupaten Pemalang' AS nama
    UNION ALL
    SELECT 'K3328' AS kode, 'Kabupaten Tegal' AS nama
    UNION ALL
    SELECT 'K3329' AS kode, 'Kabupaten Brebes' AS nama
    UNION ALL
    SELECT 'K3330' AS kode, 'Kota Magelang' AS nama
    UNION ALL
    SELECT 'K3331' AS kode, 'Kota Surakarta' AS nama
    UNION ALL
    SELECT 'K3332' AS kode, 'Kota Salatiga' AS nama
    UNION ALL
    SELECT 'K3333' AS kode, 'Kota Semarang' AS nama
    UNION ALL
    SELECT 'K3334' AS kode, 'Kota Pekalongan' AS nama
    UNION ALL
    SELECT 'K3335' AS kode, 'Kota Tegal' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '33'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 34: 5 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K3401' AS kode, 'Kabupaten Kulon Progo' AS nama
    UNION ALL
    SELECT 'K3402' AS kode, 'Kabupaten Bantul' AS nama
    UNION ALL
    SELECT 'K3403' AS kode, 'Kabupaten Gunungkidul' AS nama
    UNION ALL
    SELECT 'K3404' AS kode, 'Kabupaten Sleman' AS nama
    UNION ALL
    SELECT 'K3405' AS kode, 'Kota Yogyakarta' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '34'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 35: 38 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K3501' AS kode, 'Kabupaten Pacitan' AS nama
    UNION ALL
    SELECT 'K3502' AS kode, 'Kabupaten Ponorogo' AS nama
    UNION ALL
    SELECT 'K3503' AS kode, 'Kabupaten Trenggalek' AS nama
    UNION ALL
    SELECT 'K3504' AS kode, 'Kabupaten Tulungagung' AS nama
    UNION ALL
    SELECT 'K3505' AS kode, 'Kabupaten Blitar' AS nama
    UNION ALL
    SELECT 'K3506' AS kode, 'Kabupaten Kediri' AS nama
    UNION ALL
    SELECT 'K3507' AS kode, 'Kabupaten Malang' AS nama
    UNION ALL
    SELECT 'K3508' AS kode, 'Kabupaten Lumajang' AS nama
    UNION ALL
    SELECT 'K3509' AS kode, 'Kabupaten Jember' AS nama
    UNION ALL
    SELECT 'K3510' AS kode, 'Kabupaten Banyuwangi' AS nama
    UNION ALL
    SELECT 'K3511' AS kode, 'Kabupaten Bondowoso' AS nama
    UNION ALL
    SELECT 'K3512' AS kode, 'Kabupaten Situbondo' AS nama
    UNION ALL
    SELECT 'K3513' AS kode, 'Kabupaten Probolinggo' AS nama
    UNION ALL
    SELECT 'K3514' AS kode, 'Kabupaten Pasuruan' AS nama
    UNION ALL
    SELECT 'K3515' AS kode, 'Kabupaten Sidoarjo' AS nama
    UNION ALL
    SELECT 'K3516' AS kode, 'Kabupaten Mojokerto' AS nama
    UNION ALL
    SELECT 'K3517' AS kode, 'Kabupaten Jombang' AS nama
    UNION ALL
    SELECT 'K3518' AS kode, 'Kabupaten Nganjuk' AS nama
    UNION ALL
    SELECT 'K3519' AS kode, 'Kabupaten Madiun' AS nama
    UNION ALL
    SELECT 'K3520' AS kode, 'Kabupaten Magetan' AS nama
    UNION ALL
    SELECT 'K3521' AS kode, 'Kabupaten Ngawi' AS nama
    UNION ALL
    SELECT 'K3522' AS kode, 'Kabupaten Bojonegoro' AS nama
    UNION ALL
    SELECT 'K3523' AS kode, 'Kabupaten Tuban' AS nama
    UNION ALL
    SELECT 'K3524' AS kode, 'Kabupaten Lamongan' AS nama
    UNION ALL
    SELECT 'K3525' AS kode, 'Kabupaten Gresik' AS nama
    UNION ALL
    SELECT 'K3526' AS kode, 'Kabupaten Bangkalan' AS nama
    UNION ALL
    SELECT 'K3527' AS kode, 'Kabupaten Sampang' AS nama
    UNION ALL
    SELECT 'K3528' AS kode, 'Kabupaten Pamekasan' AS nama
    UNION ALL
    SELECT 'K3529' AS kode, 'Kabupaten Sumenep' AS nama
    UNION ALL
    SELECT 'K3530' AS kode, 'Kota Kediri' AS nama
    UNION ALL
    SELECT 'K3531' AS kode, 'Kota Blitar' AS nama
    UNION ALL
    SELECT 'K3532' AS kode, 'Kota Malang' AS nama
    UNION ALL
    SELECT 'K3533' AS kode, 'Kota Probolinggo' AS nama
    UNION ALL
    SELECT 'K3534' AS kode, 'Kota Pasuruan' AS nama
    UNION ALL
    SELECT 'K3535' AS kode, 'Kota Mojokerto' AS nama
    UNION ALL
    SELECT 'K3536' AS kode, 'Kota Madiun' AS nama
    UNION ALL
    SELECT 'K3537' AS kode, 'Kota Surabaya' AS nama
    UNION ALL
    SELECT 'K3538' AS kode, 'Kota Batu' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '35'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 36: 8 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K3601' AS kode, 'Kabupaten Pandeglang' AS nama
    UNION ALL
    SELECT 'K3602' AS kode, 'Kabupaten Lebak' AS nama
    UNION ALL
    SELECT 'K3603' AS kode, 'Kabupaten Tangerang' AS nama
    UNION ALL
    SELECT 'K3604' AS kode, 'Kabupaten Serang' AS nama
    UNION ALL
    SELECT 'K3605' AS kode, 'Kota Tangerang' AS nama
    UNION ALL
    SELECT 'K3606' AS kode, 'Kota Cilegon' AS nama
    UNION ALL
    SELECT 'K3607' AS kode, 'Kota Serang' AS nama
    UNION ALL
    SELECT 'K3608' AS kode, 'Kota Tangerang Selatan' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '36'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 51: 9 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K5101' AS kode, 'Kabupaten Jembrana' AS nama
    UNION ALL
    SELECT 'K5102' AS kode, 'Kabupaten Tabanan' AS nama
    UNION ALL
    SELECT 'K5103' AS kode, 'Kabupaten Badung' AS nama
    UNION ALL
    SELECT 'K5104' AS kode, 'Kabupaten Gianyar' AS nama
    UNION ALL
    SELECT 'K5105' AS kode, 'Kabupaten Klungkung' AS nama
    UNION ALL
    SELECT 'K5106' AS kode, 'Kabupaten Bangli' AS nama
    UNION ALL
    SELECT 'K5107' AS kode, 'Kabupaten Karangasem' AS nama
    UNION ALL
    SELECT 'K5108' AS kode, 'Kabupaten Buleleng' AS nama
    UNION ALL
    SELECT 'K5109' AS kode, 'Kota Denpasar' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '51'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 52: 10 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K5201' AS kode, 'Kabupaten Lombok Barat' AS nama
    UNION ALL
    SELECT 'K5202' AS kode, 'Kabupaten Lombok Tengah' AS nama
    UNION ALL
    SELECT 'K5203' AS kode, 'Kabupaten Lombok Timur' AS nama
    UNION ALL
    SELECT 'K5204' AS kode, 'Kabupaten Sumbawa' AS nama
    UNION ALL
    SELECT 'K5205' AS kode, 'Kabupaten Dompu' AS nama
    UNION ALL
    SELECT 'K5206' AS kode, 'Kabupaten Bima' AS nama
    UNION ALL
    SELECT 'K5207' AS kode, 'Kabupaten Sumbawa Barat' AS nama
    UNION ALL
    SELECT 'K5208' AS kode, 'Kabupaten Lombok Utara' AS nama
    UNION ALL
    SELECT 'K5209' AS kode, 'Kota Mataram' AS nama
    UNION ALL
    SELECT 'K5210' AS kode, 'Kota Bima' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '52'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 53: 22 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K5301' AS kode, 'Kabupaten Sumba Barat' AS nama
    UNION ALL
    SELECT 'K5302' AS kode, 'Kabupaten Sumba Timur' AS nama
    UNION ALL
    SELECT 'K5303' AS kode, 'Kabupaten Kupang' AS nama
    UNION ALL
    SELECT 'K5304' AS kode, 'Kabupaten Timor Tengah Selatan' AS nama
    UNION ALL
    SELECT 'K5305' AS kode, 'Kabupaten Timor Tengah Utara' AS nama
    UNION ALL
    SELECT 'K5306' AS kode, 'Kabupaten Belu' AS nama
    UNION ALL
    SELECT 'K5307' AS kode, 'Kabupaten Alor' AS nama
    UNION ALL
    SELECT 'K5308' AS kode, 'Kabupaten Lembata' AS nama
    UNION ALL
    SELECT 'K5309' AS kode, 'Kabupaten Flores Timur' AS nama
    UNION ALL
    SELECT 'K5310' AS kode, 'Kabupaten Sikka' AS nama
    UNION ALL
    SELECT 'K5311' AS kode, 'Kabupaten Ende' AS nama
    UNION ALL
    SELECT 'K5312' AS kode, 'Kabupaten Ngada' AS nama
    UNION ALL
    SELECT 'K5313' AS kode, 'Kabupaten Manggarai' AS nama
    UNION ALL
    SELECT 'K5314' AS kode, 'Kabupaten Rote Ndao' AS nama
    UNION ALL
    SELECT 'K5315' AS kode, 'Kabupaten Manggarai Barat' AS nama
    UNION ALL
    SELECT 'K5316' AS kode, 'Kabupaten Sumba Tengah' AS nama
    UNION ALL
    SELECT 'K5317' AS kode, 'Kabupaten Sumba Barat Daya' AS nama
    UNION ALL
    SELECT 'K5318' AS kode, 'Kabupaten Nagekeo' AS nama
    UNION ALL
    SELECT 'K5319' AS kode, 'Kabupaten Manggarai Timur' AS nama
    UNION ALL
    SELECT 'K5320' AS kode, 'Kabupaten Sabu Raijua' AS nama
    UNION ALL
    SELECT 'K5321' AS kode, 'Kabupaten Malaka' AS nama
    UNION ALL
    SELECT 'K5322' AS kode, 'Kota Kupang' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '53'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 61: 14 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K6101' AS kode, 'Kabupaten Sambas' AS nama
    UNION ALL
    SELECT 'K6102' AS kode, 'Kabupaten Bengkayang' AS nama
    UNION ALL
    SELECT 'K6103' AS kode, 'Kabupaten Landak' AS nama
    UNION ALL
    SELECT 'K6104' AS kode, 'Kabupaten Mempawah' AS nama
    UNION ALL
    SELECT 'K6105' AS kode, 'Kabupaten Sanggau' AS nama
    UNION ALL
    SELECT 'K6106' AS kode, 'Kabupaten Ketapang' AS nama
    UNION ALL
    SELECT 'K6107' AS kode, 'Kabupaten Sintang' AS nama
    UNION ALL
    SELECT 'K6108' AS kode, 'Kabupaten Kapuas Hulu' AS nama
    UNION ALL
    SELECT 'K6109' AS kode, 'Kabupaten Sekadau' AS nama
    UNION ALL
    SELECT 'K6110' AS kode, 'Kabupaten Melawi' AS nama
    UNION ALL
    SELECT 'K6111' AS kode, 'Kabupaten Kayong Utara' AS nama
    UNION ALL
    SELECT 'K6112' AS kode, 'Kabupaten Kubu Raya' AS nama
    UNION ALL
    SELECT 'K6113' AS kode, 'Kota Pontianak' AS nama
    UNION ALL
    SELECT 'K6114' AS kode, 'Kota Singkawang' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '61'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 62: 14 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K6201' AS kode, 'Kabupaten Kotawaringin Barat' AS nama
    UNION ALL
    SELECT 'K6202' AS kode, 'Kabupaten Kotawaringin Timur' AS nama
    UNION ALL
    SELECT 'K6203' AS kode, 'Kabupaten Kapuas' AS nama
    UNION ALL
    SELECT 'K6204' AS kode, 'Kabupaten Barito Selatan' AS nama
    UNION ALL
    SELECT 'K6205' AS kode, 'Kabupaten Barito Utara' AS nama
    UNION ALL
    SELECT 'K6206' AS kode, 'Kabupaten Sukamara' AS nama
    UNION ALL
    SELECT 'K6207' AS kode, 'Kabupaten Lamandau' AS nama
    UNION ALL
    SELECT 'K6208' AS kode, 'Kabupaten Seruyan' AS nama
    UNION ALL
    SELECT 'K6209' AS kode, 'Kabupaten Katingan' AS nama
    UNION ALL
    SELECT 'K6210' AS kode, 'Kabupaten Pulang Pisau' AS nama
    UNION ALL
    SELECT 'K6211' AS kode, 'Kabupaten Gunung Mas' AS nama
    UNION ALL
    SELECT 'K6212' AS kode, 'Kabupaten Barito Timur' AS nama
    UNION ALL
    SELECT 'K6213' AS kode, 'Kabupaten Murung Raya' AS nama
    UNION ALL
    SELECT 'K6214' AS kode, 'Kota Palangka Raya' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '62'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 63: 13 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K6301' AS kode, 'Kabupaten Tanah Laut' AS nama
    UNION ALL
    SELECT 'K6302' AS kode, 'Kabupaten Kotabaru' AS nama
    UNION ALL
    SELECT 'K6303' AS kode, 'Kabupaten Banjar' AS nama
    UNION ALL
    SELECT 'K6304' AS kode, 'Kabupaten Barito Kuala' AS nama
    UNION ALL
    SELECT 'K6305' AS kode, 'Kabupaten Tapin' AS nama
    UNION ALL
    SELECT 'K6306' AS kode, 'Kabupaten Hulu Sungai Selatan' AS nama
    UNION ALL
    SELECT 'K6307' AS kode, 'Kabupaten Hulu Sungai Tengah' AS nama
    UNION ALL
    SELECT 'K6308' AS kode, 'Kabupaten Hulu Sungai Utara' AS nama
    UNION ALL
    SELECT 'K6309' AS kode, 'Kabupaten Tabalong' AS nama
    UNION ALL
    SELECT 'K6310' AS kode, 'Kabupaten Tanah Bumbu' AS nama
    UNION ALL
    SELECT 'K6311' AS kode, 'Kabupaten Balangan' AS nama
    UNION ALL
    SELECT 'K6312' AS kode, 'Kota Banjarmasin' AS nama
    UNION ALL
    SELECT 'K6313' AS kode, 'Kota Banjarbaru' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '63'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 64: 10 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K6401' AS kode, 'Kabupaten Paser' AS nama
    UNION ALL
    SELECT 'K6402' AS kode, 'Kabupaten Kutai Barat' AS nama
    UNION ALL
    SELECT 'K6403' AS kode, 'Kabupaten Kutai Kartanegara' AS nama
    UNION ALL
    SELECT 'K6404' AS kode, 'Kabupaten Kutai Timur' AS nama
    UNION ALL
    SELECT 'K6405' AS kode, 'Kabupaten Berau' AS nama
    UNION ALL
    SELECT 'K6406' AS kode, 'Kabupaten Penajam Paser Utara' AS nama
    UNION ALL
    SELECT 'K6407' AS kode, 'Kabupaten Mahakam Ulu' AS nama
    UNION ALL
    SELECT 'K6408' AS kode, 'Kota Balikpapan' AS nama
    UNION ALL
    SELECT 'K6409' AS kode, 'Kota Samarinda' AS nama
    UNION ALL
    SELECT 'K6410' AS kode, 'Kota Bontang' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '64'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 65: 5 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K6501' AS kode, 'Kabupaten Malinau' AS nama
    UNION ALL
    SELECT 'K6502' AS kode, 'Kabupaten Bulungan' AS nama
    UNION ALL
    SELECT 'K6503' AS kode, 'Kabupaten Tana Tidung' AS nama
    UNION ALL
    SELECT 'K6504' AS kode, 'Kabupaten Nunukan' AS nama
    UNION ALL
    SELECT 'K6505' AS kode, 'Kota Tarakan' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '65'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 71: 15 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K7101' AS kode, 'Kabupaten Bolaang Mongondow' AS nama
    UNION ALL
    SELECT 'K7102' AS kode, 'Kabupaten Minahasa' AS nama
    UNION ALL
    SELECT 'K7103' AS kode, 'Kabupaten Kepulauan Sangihe' AS nama
    UNION ALL
    SELECT 'K7104' AS kode, 'Kabupaten Kepulauan Talaud' AS nama
    UNION ALL
    SELECT 'K7105' AS kode, 'Kabupaten Minahasa Selatan' AS nama
    UNION ALL
    SELECT 'K7106' AS kode, 'Kabupaten Minahasa Utara' AS nama
    UNION ALL
    SELECT 'K7107' AS kode, 'Kabupaten Bolaang Mongondow Utara' AS nama
    UNION ALL
    SELECT 'K7108' AS kode, 'Kabupaten Kepulauan Siau Tagulandang Biaro' AS nama
    UNION ALL
    SELECT 'K7109' AS kode, 'Kabupaten Minahasa Tenggara' AS nama
    UNION ALL
    SELECT 'K7110' AS kode, 'Kabupaten Bolaang Mongondow Selatan' AS nama
    UNION ALL
    SELECT 'K7111' AS kode, 'Kabupaten Bolaang Mongondow Timur' AS nama
    UNION ALL
    SELECT 'K7112' AS kode, 'Kota Manado' AS nama
    UNION ALL
    SELECT 'K7113' AS kode, 'Kota Bitung' AS nama
    UNION ALL
    SELECT 'K7114' AS kode, 'Kota Tomohon' AS nama
    UNION ALL
    SELECT 'K7115' AS kode, 'Kota Kotamobagu' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '71'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 72: 13 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K7201' AS kode, 'Kabupaten Banggai Kepulauan' AS nama
    UNION ALL
    SELECT 'K7202' AS kode, 'Kabupaten Banggai' AS nama
    UNION ALL
    SELECT 'K7203' AS kode, 'Kabupaten Morowali' AS nama
    UNION ALL
    SELECT 'K7204' AS kode, 'Kabupaten Poso' AS nama
    UNION ALL
    SELECT 'K7205' AS kode, 'Kabupaten Donggala' AS nama
    UNION ALL
    SELECT 'K7206' AS kode, 'Kabupaten Toli-Toli' AS nama
    UNION ALL
    SELECT 'K7207' AS kode, 'Kabupaten Buol' AS nama
    UNION ALL
    SELECT 'K7208' AS kode, 'Kabupaten Parigi Moutong' AS nama
    UNION ALL
    SELECT 'K7209' AS kode, 'Kabupaten Tojo Una-Una' AS nama
    UNION ALL
    SELECT 'K7210' AS kode, 'Kabupaten Sigi' AS nama
    UNION ALL
    SELECT 'K7211' AS kode, 'Kabupaten Banggai Laut' AS nama
    UNION ALL
    SELECT 'K7212' AS kode, 'Kabupaten Morowali Utara' AS nama
    UNION ALL
    SELECT 'K7213' AS kode, 'Kota Palu' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '72'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 73: 24 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K7301' AS kode, 'Kabupaten Kepulauan Selayar' AS nama
    UNION ALL
    SELECT 'K7302' AS kode, 'Kabupaten Bulukumba' AS nama
    UNION ALL
    SELECT 'K7303' AS kode, 'Kabupaten Bantaeng' AS nama
    UNION ALL
    SELECT 'K7304' AS kode, 'Kabupaten Jeneponto' AS nama
    UNION ALL
    SELECT 'K7305' AS kode, 'Kabupaten Takalar' AS nama
    UNION ALL
    SELECT 'K7306' AS kode, 'Kabupaten Gowa' AS nama
    UNION ALL
    SELECT 'K7307' AS kode, 'Kabupaten Sinjai' AS nama
    UNION ALL
    SELECT 'K7308' AS kode, 'Kabupaten Maros' AS nama
    UNION ALL
    SELECT 'K7309' AS kode, 'Kabupaten Pangkajene dan Kepulauan' AS nama
    UNION ALL
    SELECT 'K7310' AS kode, 'Kabupaten Barru' AS nama
    UNION ALL
    SELECT 'K7311' AS kode, 'Kabupaten Bone' AS nama
    UNION ALL
    SELECT 'K7312' AS kode, 'Kabupaten Soppeng' AS nama
    UNION ALL
    SELECT 'K7313' AS kode, 'Kabupaten Wajo' AS nama
    UNION ALL
    SELECT 'K7314' AS kode, 'Kabupaten Sidenreng Rappang' AS nama
    UNION ALL
    SELECT 'K7315' AS kode, 'Kabupaten Pinrang' AS nama
    UNION ALL
    SELECT 'K7316' AS kode, 'Kabupaten Enrekang' AS nama
    UNION ALL
    SELECT 'K7317' AS kode, 'Kabupaten Luwu' AS nama
    UNION ALL
    SELECT 'K7318' AS kode, 'Kabupaten Tana Toraja' AS nama
    UNION ALL
    SELECT 'K7319' AS kode, 'Kabupaten Luwu Utara' AS nama
    UNION ALL
    SELECT 'K7320' AS kode, 'Kabupaten Luwu Timur' AS nama
    UNION ALL
    SELECT 'K7321' AS kode, 'Kabupaten Toraja Utara' AS nama
    UNION ALL
    SELECT 'K7322' AS kode, 'Kota Makassar' AS nama
    UNION ALL
    SELECT 'K7323' AS kode, 'Kota Parepare' AS nama
    UNION ALL
    SELECT 'K7324' AS kode, 'Kota Palopo' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '73'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 74: 17 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K7401' AS kode, 'Kabupaten Buton' AS nama
    UNION ALL
    SELECT 'K7402' AS kode, 'Kabupaten Muna' AS nama
    UNION ALL
    SELECT 'K7403' AS kode, 'Kabupaten Konawe' AS nama
    UNION ALL
    SELECT 'K7404' AS kode, 'Kabupaten Kolaka' AS nama
    UNION ALL
    SELECT 'K7405' AS kode, 'Kabupaten Konawe Selatan' AS nama
    UNION ALL
    SELECT 'K7406' AS kode, 'Kabupaten Bombana' AS nama
    UNION ALL
    SELECT 'K7407' AS kode, 'Kabupaten Wakatobi' AS nama
    UNION ALL
    SELECT 'K7408' AS kode, 'Kabupaten Kolaka Utara' AS nama
    UNION ALL
    SELECT 'K7409' AS kode, 'Kabupaten Buton Utara' AS nama
    UNION ALL
    SELECT 'K7410' AS kode, 'Kabupaten Konawe Utara' AS nama
    UNION ALL
    SELECT 'K7411' AS kode, 'Kabupaten Kolaka Timur' AS nama
    UNION ALL
    SELECT 'K7412' AS kode, 'Kabupaten Konawe Kepulauan' AS nama
    UNION ALL
    SELECT 'K7413' AS kode, 'Kabupaten Muna Barat' AS nama
    UNION ALL
    SELECT 'K7414' AS kode, 'Kabupaten Buton Tengah' AS nama
    UNION ALL
    SELECT 'K7415' AS kode, 'Kabupaten Buton Selatan' AS nama
    UNION ALL
    SELECT 'K7416' AS kode, 'Kota Kendari' AS nama
    UNION ALL
    SELECT 'K7417' AS kode, 'Kota Baubau' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '74'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 75: 6 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K7501' AS kode, 'Kabupaten Boalemo' AS nama
    UNION ALL
    SELECT 'K7502' AS kode, 'Kabupaten Gorontalo' AS nama
    UNION ALL
    SELECT 'K7503' AS kode, 'Kabupaten Pohuwato' AS nama
    UNION ALL
    SELECT 'K7504' AS kode, 'Kabupaten Bone Bolango' AS nama
    UNION ALL
    SELECT 'K7505' AS kode, 'Kabupaten Gorontalo Utara' AS nama
    UNION ALL
    SELECT 'K7506' AS kode, 'Kota Gorontalo' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '75'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 76: 6 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K7601' AS kode, 'Kabupaten Majene' AS nama
    UNION ALL
    SELECT 'K7602' AS kode, 'Kabupaten Polewali Mandar' AS nama
    UNION ALL
    SELECT 'K7603' AS kode, 'Kabupaten Mamasa' AS nama
    UNION ALL
    SELECT 'K7604' AS kode, 'Kabupaten Mamuju' AS nama
    UNION ALL
    SELECT 'K7605' AS kode, 'Kabupaten Pasangkayu' AS nama
    UNION ALL
    SELECT 'K7606' AS kode, 'Kabupaten Mamuju Tengah' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '76'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 81: 11 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K8101' AS kode, 'Kabupaten Kepulauan Tanimbar' AS nama
    UNION ALL
    SELECT 'K8102' AS kode, 'Kabupaten Maluku Tenggara' AS nama
    UNION ALL
    SELECT 'K8103' AS kode, 'Kabupaten Maluku Tengah' AS nama
    UNION ALL
    SELECT 'K8104' AS kode, 'Kabupaten Buru' AS nama
    UNION ALL
    SELECT 'K8105' AS kode, 'Kabupaten Kepulauan Aru' AS nama
    UNION ALL
    SELECT 'K8106' AS kode, 'Kabupaten Seram Bagian Barat' AS nama
    UNION ALL
    SELECT 'K8107' AS kode, 'Kabupaten Seram Bagian Timur' AS nama
    UNION ALL
    SELECT 'K8108' AS kode, 'Kabupaten Maluku Barat Daya' AS nama
    UNION ALL
    SELECT 'K8109' AS kode, 'Kabupaten Buru Selatan' AS nama
    UNION ALL
    SELECT 'K8110' AS kode, 'Kota Ambon' AS nama
    UNION ALL
    SELECT 'K8111' AS kode, 'Kota Tual' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '81'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 82: 10 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K8201' AS kode, 'Kabupaten Halmahera Barat' AS nama
    UNION ALL
    SELECT 'K8202' AS kode, 'Kabupaten Halmahera Tengah' AS nama
    UNION ALL
    SELECT 'K8203' AS kode, 'Kabupaten Kepulauan Sula' AS nama
    UNION ALL
    SELECT 'K8204' AS kode, 'Kabupaten Halmahera Selatan' AS nama
    UNION ALL
    SELECT 'K8205' AS kode, 'Kabupaten Halmahera Utara' AS nama
    UNION ALL
    SELECT 'K8206' AS kode, 'Kabupaten Halmahera Timur' AS nama
    UNION ALL
    SELECT 'K8207' AS kode, 'Kabupaten Pulau Morotai' AS nama
    UNION ALL
    SELECT 'K8208' AS kode, 'Kabupaten Pulau Taliabu' AS nama
    UNION ALL
    SELECT 'K8209' AS kode, 'Kota Ternate' AS nama
    UNION ALL
    SELECT 'K8210' AS kode, 'Kota Tidore Kepulauan' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '82'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 91: 9 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K9101' AS kode, 'Kabupaten Jayapura' AS nama
    UNION ALL
    SELECT 'K9102' AS kode, 'Kabupaten Kepulauan Yapen' AS nama
    UNION ALL
    SELECT 'K9103' AS kode, 'Kabupaten Biak Numfor' AS nama
    UNION ALL
    SELECT 'K9104' AS kode, 'Kabupaten Sarmi' AS nama
    UNION ALL
    SELECT 'K9105' AS kode, 'Kabupaten Keerom' AS nama
    UNION ALL
    SELECT 'K9106' AS kode, 'Kabupaten Waropen' AS nama
    UNION ALL
    SELECT 'K9107' AS kode, 'Kabupaten Supiori' AS nama
    UNION ALL
    SELECT 'K9108' AS kode, 'Kabupaten Mamberamo Raya' AS nama
    UNION ALL
    SELECT 'K9109' AS kode, 'Kota Jayapura' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '91'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 92: 7 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K9201' AS kode, 'Kabupaten Fakfak' AS nama
    UNION ALL
    SELECT 'K9202' AS kode, 'Kabupaten Kaimana' AS nama
    UNION ALL
    SELECT 'K9203' AS kode, 'Kabupaten Teluk Wondama' AS nama
    UNION ALL
    SELECT 'K9204' AS kode, 'Kabupaten Teluk Bintuni' AS nama
    UNION ALL
    SELECT 'K9205' AS kode, 'Kabupaten Manokwari' AS nama
    UNION ALL
    SELECT 'K9206' AS kode, 'Kabupaten Manokwari Selatan' AS nama
    UNION ALL
    SELECT 'K9207' AS kode, 'Kabupaten Pegunungan Arfak' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '92'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 93: 4 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K9301' AS kode, 'Kabupaten Merauke' AS nama
    UNION ALL
    SELECT 'K9302' AS kode, 'Kabupaten Boven Digoel' AS nama
    UNION ALL
    SELECT 'K9303' AS kode, 'Kabupaten Mappi' AS nama
    UNION ALL
    SELECT 'K9304' AS kode, 'Kabupaten Asmat' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '93'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 94: 8 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K9401' AS kode, 'Kabupaten Nabire' AS nama
    UNION ALL
    SELECT 'K9402' AS kode, 'Kabupaten Puncak Jaya' AS nama
    UNION ALL
    SELECT 'K9403' AS kode, 'Kabupaten Paniai' AS nama
    UNION ALL
    SELECT 'K9404' AS kode, 'Kabupaten Mimika' AS nama
    UNION ALL
    SELECT 'K9405' AS kode, 'Kabupaten Puncak' AS nama
    UNION ALL
    SELECT 'K9406' AS kode, 'Kabupaten Dogiyai' AS nama
    UNION ALL
    SELECT 'K9407' AS kode, 'Kabupaten Intan Jaya' AS nama
    UNION ALL
    SELECT 'K9408' AS kode, 'Kabupaten Deiyai' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '94'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 95: 8 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K9501' AS kode, 'Kabupaten Jayawijaya' AS nama
    UNION ALL
    SELECT 'K9502' AS kode, 'Kabupaten Pegunungan Bintang' AS nama
    UNION ALL
    SELECT 'K9503' AS kode, 'Kabupaten Yahukimo' AS nama
    UNION ALL
    SELECT 'K9504' AS kode, 'Kabupaten Tolikara' AS nama
    UNION ALL
    SELECT 'K9505' AS kode, 'Kabupaten Mamberamo Tengah' AS nama
    UNION ALL
    SELECT 'K9506' AS kode, 'Kabupaten Yalimo' AS nama
    UNION ALL
    SELECT 'K9507' AS kode, 'Kabupaten Lanny Jaya' AS nama
    UNION ALL
    SELECT 'K9508' AS kode, 'Kabupaten Nduga' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '95'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);

-- provinsi 96: 6 kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
    SELECT 'K9601' AS kode, 'Kabupaten Sorong' AS nama
    UNION ALL
    SELECT 'K9602' AS kode, 'Kabupaten Sorong Selatan' AS nama
    UNION ALL
    SELECT 'K9603' AS kode, 'Kabupaten Raja Ampat' AS nama
    UNION ALL
    SELECT 'K9604' AS kode, 'Kabupaten Tambrauw' AS nama
    UNION ALL
    SELECT 'K9605' AS kode, 'Kabupaten Maybrat' AS nama
    UNION ALL
    SELECT 'K9606' AS kode, 'Kota Sorong' AS nama
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = '96'
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);
