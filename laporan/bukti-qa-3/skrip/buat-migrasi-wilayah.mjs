#!/usr/bin/env node
// QA-3 A3 — pembangkit migrasi daftar kabupaten/kota se-Indonesia.
//
// Tabel `wilayah` SUDAH punya kolom `jenis` enum('pusat','provinsi','kabupaten_kota') dan `induk_id`
// sejak Tahap 01, jadi TIDAK ada perubahan skema. Yang kurang hanyalah barisnya: sampai RUN QA-3
// tabel hanya berisi 1 baris 'pusat' + 38 provinsi (id 1-39, dipakai kolom pengaduan.wilayah_id).
//
// Migrasi yang dihasilkan:
//   * MENAMBAH baris kabupaten/kota saja; id 1-39 TIDAK PERNAH disentuh;
//   * induk_id diturunkan dari kode provinsi (JOIN), bukan ditulis tangan, agar tidak salah pasang;
//   * idempoten lewat kunci unik `kode` + ON DUPLICATE KEY UPDATE.
//
// KODE: dipakai awalan "K" + kode provinsi + nomor urut dua digit (mis. K1401 untuk kabupaten
// pertama di Riau). Ini kode INTERNAL, sengaja TIDAK menyerupai kode resmi BPS/Kemendagri supaya
// tidak ada yang mengira daftar ini sudah tervalidasi pemerintah. Lihat catatan kejujuran di laporan.
//
// Pemakaian: node laporan/bukti-qa-3/skrip/buat-migrasi-wilayah.mjs > database/migrations/20260905-0930-wilayah-kabupaten-kota.sql
const DAFTAR = {
  '11': ['Kabupaten Simeulue', 'Kabupaten Aceh Singkil', 'Kabupaten Aceh Selatan', 'Kabupaten Aceh Tenggara', 'Kabupaten Aceh Timur', 'Kabupaten Aceh Tengah', 'Kabupaten Aceh Barat', 'Kabupaten Aceh Besar', 'Kabupaten Pidie', 'Kabupaten Bireuen', 'Kabupaten Aceh Utara', 'Kabupaten Aceh Barat Daya', 'Kabupaten Gayo Lues', 'Kabupaten Aceh Tamiang', 'Kabupaten Nagan Raya', 'Kabupaten Aceh Jaya', 'Kabupaten Bener Meriah', 'Kabupaten Pidie Jaya', 'Kota Banda Aceh', 'Kota Sabang', 'Kota Langsa', 'Kota Lhokseumawe', 'Kota Subulussalam'],
  '12': ['Kabupaten Nias', 'Kabupaten Mandailing Natal', 'Kabupaten Tapanuli Selatan', 'Kabupaten Tapanuli Tengah', 'Kabupaten Tapanuli Utara', 'Kabupaten Toba', 'Kabupaten Labuhanbatu', 'Kabupaten Asahan', 'Kabupaten Simalungun', 'Kabupaten Dairi', 'Kabupaten Karo', 'Kabupaten Deli Serdang', 'Kabupaten Langkat', 'Kabupaten Nias Selatan', 'Kabupaten Humbang Hasundutan', 'Kabupaten Pakpak Bharat', 'Kabupaten Samosir', 'Kabupaten Serdang Bedagai', 'Kabupaten Batu Bara', 'Kabupaten Padang Lawas Utara', 'Kabupaten Padang Lawas', 'Kabupaten Labuhanbatu Selatan', 'Kabupaten Labuhanbatu Utara', 'Kabupaten Nias Utara', 'Kabupaten Nias Barat', 'Kota Sibolga', 'Kota Tanjungbalai', 'Kota Pematangsiantar', 'Kota Tebing Tinggi', 'Kota Medan', 'Kota Binjai', 'Kota Padangsidimpuan', 'Kota Gunungsitoli'],
  '13': ['Kabupaten Kepulauan Mentawai', 'Kabupaten Pesisir Selatan', 'Kabupaten Solok', 'Kabupaten Sijunjung', 'Kabupaten Tanah Datar', 'Kabupaten Padang Pariaman', 'Kabupaten Agam', 'Kabupaten Lima Puluh Kota', 'Kabupaten Pasaman', 'Kabupaten Solok Selatan', 'Kabupaten Dharmasraya', 'Kabupaten Pasaman Barat', 'Kota Padang', 'Kota Solok', 'Kota Sawahlunto', 'Kota Padang Panjang', 'Kota Bukittinggi', 'Kota Payakumbuh', 'Kota Pariaman'],
  '14': ['Kabupaten Kuantan Singingi', 'Kabupaten Indragiri Hulu', 'Kabupaten Indragiri Hilir', 'Kabupaten Pelalawan', 'Kabupaten Siak', 'Kabupaten Kampar', 'Kabupaten Rokan Hulu', 'Kabupaten Bengkalis', 'Kabupaten Rokan Hilir', 'Kabupaten Kepulauan Meranti', 'Kota Pekanbaru', 'Kota Dumai'],
  '15': ['Kabupaten Kerinci', 'Kabupaten Merangin', 'Kabupaten Sarolangun', 'Kabupaten Batanghari', 'Kabupaten Muaro Jambi', 'Kabupaten Tanjung Jabung Timur', 'Kabupaten Tanjung Jabung Barat', 'Kabupaten Tebo', 'Kabupaten Bungo', 'Kota Jambi', 'Kota Sungai Penuh'],
  '16': ['Kabupaten Ogan Komering Ulu', 'Kabupaten Ogan Komering Ilir', 'Kabupaten Muara Enim', 'Kabupaten Lahat', 'Kabupaten Musi Rawas', 'Kabupaten Musi Banyuasin', 'Kabupaten Banyuasin', 'Kabupaten Ogan Komering Ulu Selatan', 'Kabupaten Ogan Komering Ulu Timur', 'Kabupaten Ogan Ilir', 'Kabupaten Empat Lawang', 'Kabupaten Penukal Abab Lematang Ilir', 'Kabupaten Musi Rawas Utara', 'Kota Palembang', 'Kota Prabumulih', 'Kota Pagar Alam', 'Kota Lubuklinggau'],
  '17': ['Kabupaten Bengkulu Selatan', 'Kabupaten Rejang Lebong', 'Kabupaten Bengkulu Utara', 'Kabupaten Kaur', 'Kabupaten Seluma', 'Kabupaten Mukomuko', 'Kabupaten Lebong', 'Kabupaten Kepahiang', 'Kabupaten Bengkulu Tengah', 'Kota Bengkulu'],
  '18': ['Kabupaten Lampung Barat', 'Kabupaten Tanggamus', 'Kabupaten Lampung Selatan', 'Kabupaten Lampung Timur', 'Kabupaten Lampung Tengah', 'Kabupaten Lampung Utara', 'Kabupaten Way Kanan', 'Kabupaten Tulang Bawang', 'Kabupaten Pesawaran', 'Kabupaten Pringsewu', 'Kabupaten Mesuji', 'Kabupaten Tulang Bawang Barat', 'Kabupaten Pesisir Barat', 'Kota Bandar Lampung', 'Kota Metro'],
  '19': ['Kabupaten Bangka', 'Kabupaten Belitung', 'Kabupaten Bangka Barat', 'Kabupaten Bangka Tengah', 'Kabupaten Bangka Selatan', 'Kabupaten Belitung Timur', 'Kota Pangkalpinang'],
  '21': ['Kabupaten Karimun', 'Kabupaten Bintan', 'Kabupaten Natuna', 'Kabupaten Lingga', 'Kabupaten Kepulauan Anambas', 'Kota Batam', 'Kota Tanjungpinang'],
  '31': ['Kabupaten Administrasi Kepulauan Seribu', 'Kota Administrasi Jakarta Selatan', 'Kota Administrasi Jakarta Timur', 'Kota Administrasi Jakarta Pusat', 'Kota Administrasi Jakarta Barat', 'Kota Administrasi Jakarta Utara'],
  '32': ['Kabupaten Bogor', 'Kabupaten Sukabumi', 'Kabupaten Cianjur', 'Kabupaten Bandung', 'Kabupaten Garut', 'Kabupaten Tasikmalaya', 'Kabupaten Ciamis', 'Kabupaten Kuningan', 'Kabupaten Cirebon', 'Kabupaten Majalengka', 'Kabupaten Sumedang', 'Kabupaten Indramayu', 'Kabupaten Subang', 'Kabupaten Purwakarta', 'Kabupaten Karawang', 'Kabupaten Bekasi', 'Kabupaten Bandung Barat', 'Kabupaten Pangandaran', 'Kota Bogor', 'Kota Sukabumi', 'Kota Bandung', 'Kota Cirebon', 'Kota Bekasi', 'Kota Depok', 'Kota Cimahi', 'Kota Tasikmalaya', 'Kota Banjar'],
  '33': ['Kabupaten Cilacap', 'Kabupaten Banyumas', 'Kabupaten Purbalingga', 'Kabupaten Banjarnegara', 'Kabupaten Kebumen', 'Kabupaten Purworejo', 'Kabupaten Wonosobo', 'Kabupaten Magelang', 'Kabupaten Boyolali', 'Kabupaten Klaten', 'Kabupaten Sukoharjo', 'Kabupaten Wonogiri', 'Kabupaten Karanganyar', 'Kabupaten Sragen', 'Kabupaten Grobogan', 'Kabupaten Blora', 'Kabupaten Rembang', 'Kabupaten Pati', 'Kabupaten Kudus', 'Kabupaten Jepara', 'Kabupaten Demak', 'Kabupaten Semarang', 'Kabupaten Temanggung', 'Kabupaten Kendal', 'Kabupaten Batang', 'Kabupaten Pekalongan', 'Kabupaten Pemalang', 'Kabupaten Tegal', 'Kabupaten Brebes', 'Kota Magelang', 'Kota Surakarta', 'Kota Salatiga', 'Kota Semarang', 'Kota Pekalongan', 'Kota Tegal'],
  '34': ['Kabupaten Kulon Progo', 'Kabupaten Bantul', 'Kabupaten Gunungkidul', 'Kabupaten Sleman', 'Kota Yogyakarta'],
  '35': ['Kabupaten Pacitan', 'Kabupaten Ponorogo', 'Kabupaten Trenggalek', 'Kabupaten Tulungagung', 'Kabupaten Blitar', 'Kabupaten Kediri', 'Kabupaten Malang', 'Kabupaten Lumajang', 'Kabupaten Jember', 'Kabupaten Banyuwangi', 'Kabupaten Bondowoso', 'Kabupaten Situbondo', 'Kabupaten Probolinggo', 'Kabupaten Pasuruan', 'Kabupaten Sidoarjo', 'Kabupaten Mojokerto', 'Kabupaten Jombang', 'Kabupaten Nganjuk', 'Kabupaten Madiun', 'Kabupaten Magetan', 'Kabupaten Ngawi', 'Kabupaten Bojonegoro', 'Kabupaten Tuban', 'Kabupaten Lamongan', 'Kabupaten Gresik', 'Kabupaten Bangkalan', 'Kabupaten Sampang', 'Kabupaten Pamekasan', 'Kabupaten Sumenep', 'Kota Kediri', 'Kota Blitar', 'Kota Malang', 'Kota Probolinggo', 'Kota Pasuruan', 'Kota Mojokerto', 'Kota Madiun', 'Kota Surabaya', 'Kota Batu'],
  '36': ['Kabupaten Pandeglang', 'Kabupaten Lebak', 'Kabupaten Tangerang', 'Kabupaten Serang', 'Kota Tangerang', 'Kota Cilegon', 'Kota Serang', 'Kota Tangerang Selatan'],
  '51': ['Kabupaten Jembrana', 'Kabupaten Tabanan', 'Kabupaten Badung', 'Kabupaten Gianyar', 'Kabupaten Klungkung', 'Kabupaten Bangli', 'Kabupaten Karangasem', 'Kabupaten Buleleng', 'Kota Denpasar'],
  '52': ['Kabupaten Lombok Barat', 'Kabupaten Lombok Tengah', 'Kabupaten Lombok Timur', 'Kabupaten Sumbawa', 'Kabupaten Dompu', 'Kabupaten Bima', 'Kabupaten Sumbawa Barat', 'Kabupaten Lombok Utara', 'Kota Mataram', 'Kota Bima'],
  '53': ['Kabupaten Sumba Barat', 'Kabupaten Sumba Timur', 'Kabupaten Kupang', 'Kabupaten Timor Tengah Selatan', 'Kabupaten Timor Tengah Utara', 'Kabupaten Belu', 'Kabupaten Alor', 'Kabupaten Lembata', 'Kabupaten Flores Timur', 'Kabupaten Sikka', 'Kabupaten Ende', 'Kabupaten Ngada', 'Kabupaten Manggarai', 'Kabupaten Rote Ndao', 'Kabupaten Manggarai Barat', 'Kabupaten Sumba Tengah', 'Kabupaten Sumba Barat Daya', 'Kabupaten Nagekeo', 'Kabupaten Manggarai Timur', 'Kabupaten Sabu Raijua', 'Kabupaten Malaka', 'Kota Kupang'],
  '61': ['Kabupaten Sambas', 'Kabupaten Bengkayang', 'Kabupaten Landak', 'Kabupaten Mempawah', 'Kabupaten Sanggau', 'Kabupaten Ketapang', 'Kabupaten Sintang', 'Kabupaten Kapuas Hulu', 'Kabupaten Sekadau', 'Kabupaten Melawi', 'Kabupaten Kayong Utara', 'Kabupaten Kubu Raya', 'Kota Pontianak', 'Kota Singkawang'],
  '62': ['Kabupaten Kotawaringin Barat', 'Kabupaten Kotawaringin Timur', 'Kabupaten Kapuas', 'Kabupaten Barito Selatan', 'Kabupaten Barito Utara', 'Kabupaten Sukamara', 'Kabupaten Lamandau', 'Kabupaten Seruyan', 'Kabupaten Katingan', 'Kabupaten Pulang Pisau', 'Kabupaten Gunung Mas', 'Kabupaten Barito Timur', 'Kabupaten Murung Raya', 'Kota Palangka Raya'],
  '63': ['Kabupaten Tanah Laut', 'Kabupaten Kotabaru', 'Kabupaten Banjar', 'Kabupaten Barito Kuala', 'Kabupaten Tapin', 'Kabupaten Hulu Sungai Selatan', 'Kabupaten Hulu Sungai Tengah', 'Kabupaten Hulu Sungai Utara', 'Kabupaten Tabalong', 'Kabupaten Tanah Bumbu', 'Kabupaten Balangan', 'Kota Banjarmasin', 'Kota Banjarbaru'],
  '64': ['Kabupaten Paser', 'Kabupaten Kutai Barat', 'Kabupaten Kutai Kartanegara', 'Kabupaten Kutai Timur', 'Kabupaten Berau', 'Kabupaten Penajam Paser Utara', 'Kabupaten Mahakam Ulu', 'Kota Balikpapan', 'Kota Samarinda', 'Kota Bontang'],
  '65': ['Kabupaten Malinau', 'Kabupaten Bulungan', 'Kabupaten Tana Tidung', 'Kabupaten Nunukan', 'Kota Tarakan'],
  '71': ['Kabupaten Bolaang Mongondow', 'Kabupaten Minahasa', 'Kabupaten Kepulauan Sangihe', 'Kabupaten Kepulauan Talaud', 'Kabupaten Minahasa Selatan', 'Kabupaten Minahasa Utara', 'Kabupaten Bolaang Mongondow Utara', 'Kabupaten Kepulauan Siau Tagulandang Biaro', 'Kabupaten Minahasa Tenggara', 'Kabupaten Bolaang Mongondow Selatan', 'Kabupaten Bolaang Mongondow Timur', 'Kota Manado', 'Kota Bitung', 'Kota Tomohon', 'Kota Kotamobagu'],
  '72': ['Kabupaten Banggai Kepulauan', 'Kabupaten Banggai', 'Kabupaten Morowali', 'Kabupaten Poso', 'Kabupaten Donggala', 'Kabupaten Toli-Toli', 'Kabupaten Buol', 'Kabupaten Parigi Moutong', 'Kabupaten Tojo Una-Una', 'Kabupaten Sigi', 'Kabupaten Banggai Laut', 'Kabupaten Morowali Utara', 'Kota Palu'],
  '73': ['Kabupaten Kepulauan Selayar', 'Kabupaten Bulukumba', 'Kabupaten Bantaeng', 'Kabupaten Jeneponto', 'Kabupaten Takalar', 'Kabupaten Gowa', 'Kabupaten Sinjai', 'Kabupaten Maros', 'Kabupaten Pangkajene dan Kepulauan', 'Kabupaten Barru', 'Kabupaten Bone', 'Kabupaten Soppeng', 'Kabupaten Wajo', 'Kabupaten Sidenreng Rappang', 'Kabupaten Pinrang', 'Kabupaten Enrekang', 'Kabupaten Luwu', 'Kabupaten Tana Toraja', 'Kabupaten Luwu Utara', 'Kabupaten Luwu Timur', 'Kabupaten Toraja Utara', 'Kota Makassar', 'Kota Parepare', 'Kota Palopo'],
  '74': ['Kabupaten Buton', 'Kabupaten Muna', 'Kabupaten Konawe', 'Kabupaten Kolaka', 'Kabupaten Konawe Selatan', 'Kabupaten Bombana', 'Kabupaten Wakatobi', 'Kabupaten Kolaka Utara', 'Kabupaten Buton Utara', 'Kabupaten Konawe Utara', 'Kabupaten Kolaka Timur', 'Kabupaten Konawe Kepulauan', 'Kabupaten Muna Barat', 'Kabupaten Buton Tengah', 'Kabupaten Buton Selatan', 'Kota Kendari', 'Kota Baubau'],
  '75': ['Kabupaten Boalemo', 'Kabupaten Gorontalo', 'Kabupaten Pohuwato', 'Kabupaten Bone Bolango', 'Kabupaten Gorontalo Utara', 'Kota Gorontalo'],
  '76': ['Kabupaten Majene', 'Kabupaten Polewali Mandar', 'Kabupaten Mamasa', 'Kabupaten Mamuju', 'Kabupaten Pasangkayu', 'Kabupaten Mamuju Tengah'],
  '81': ['Kabupaten Kepulauan Tanimbar', 'Kabupaten Maluku Tenggara', 'Kabupaten Maluku Tengah', 'Kabupaten Buru', 'Kabupaten Kepulauan Aru', 'Kabupaten Seram Bagian Barat', 'Kabupaten Seram Bagian Timur', 'Kabupaten Maluku Barat Daya', 'Kabupaten Buru Selatan', 'Kota Ambon', 'Kota Tual'],
  '82': ['Kabupaten Halmahera Barat', 'Kabupaten Halmahera Tengah', 'Kabupaten Kepulauan Sula', 'Kabupaten Halmahera Selatan', 'Kabupaten Halmahera Utara', 'Kabupaten Halmahera Timur', 'Kabupaten Pulau Morotai', 'Kabupaten Pulau Taliabu', 'Kota Ternate', 'Kota Tidore Kepulauan'],
  '91': ['Kabupaten Jayapura', 'Kabupaten Kepulauan Yapen', 'Kabupaten Biak Numfor', 'Kabupaten Sarmi', 'Kabupaten Keerom', 'Kabupaten Waropen', 'Kabupaten Supiori', 'Kabupaten Mamberamo Raya', 'Kota Jayapura'],
  '92': ['Kabupaten Fakfak', 'Kabupaten Kaimana', 'Kabupaten Teluk Wondama', 'Kabupaten Teluk Bintuni', 'Kabupaten Manokwari', 'Kabupaten Manokwari Selatan', 'Kabupaten Pegunungan Arfak'],
  '93': ['Kabupaten Merauke', 'Kabupaten Boven Digoel', 'Kabupaten Mappi', 'Kabupaten Asmat'],
  '94': ['Kabupaten Nabire', 'Kabupaten Puncak Jaya', 'Kabupaten Paniai', 'Kabupaten Mimika', 'Kabupaten Puncak', 'Kabupaten Dogiyai', 'Kabupaten Intan Jaya', 'Kabupaten Deiyai'],
  '95': ['Kabupaten Jayawijaya', 'Kabupaten Pegunungan Bintang', 'Kabupaten Yahukimo', 'Kabupaten Tolikara', 'Kabupaten Mamberamo Tengah', 'Kabupaten Yalimo', 'Kabupaten Lanny Jaya', 'Kabupaten Nduga'],
  '96': ['Kabupaten Sorong', 'Kabupaten Sorong Selatan', 'Kabupaten Raja Ampat', 'Kabupaten Tambrauw', 'Kabupaten Maybrat', 'Kota Sorong'],
};

const kutip = (s) => `'${String(s).replace(/'/g, "''")}'`;
const baris = [];
let total = 0;
for (const [kodeProv, daftar] of Object.entries(DAFTAR)) {
  const nilai = daftar.map((nama, i) => `    SELECT ${kutip(`K${kodeProv}${String(i + 1).padStart(2, '0')}`)} AS kode, ${kutip(nama)} AS nama`);
  total += daftar.length;
  baris.push(`-- provinsi ${kodeProv}: ${daftar.length} kabupaten/kota
INSERT INTO wilayah (nama, jenis, induk_id, kode)
SELECT x.nama, 'kabupaten_kota', p.id, x.kode
  FROM (
${nilai.join('\n    UNION ALL\n')}
  ) x
  JOIN wilayah p ON p.jenis = 'provinsi' AND p.kode = ${kutip(kodeProv)}
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jenis = VALUES(jenis), induk_id = VALUES(induk_id);`);
}

console.log(`-- =====================================================================
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
--  Idempoten: kunci unik \`kode\` + ON DUPLICATE KEY UPDATE.
--
--  KODE bersifat INTERNAL: "K" + kode provinsi + nomor urut (mis. K1401). Sengaja TIDAK memakai
--  format kode resmi BPS/Kemendagri agar tidak ada yang mengira daftar ini sudah tervalidasi.
--
--  KEJUJURAN DATA: daftar ${total} kabupaten/kota ini disusun dari pengetahuan umum, BUKAN dari
--  salinan basis data resmi. Pemekaran/perubahan nama daerah terjadi berkala, jadi daftar ini bisa
--  tidak mutakhir. Pemilik perlu meninjau dan mengoreksi lewat basis data (lihat MENUNGGU PEMILIK
--  di laporan/LAPORAN-QA-3.md). Tidak ada satu pun nama daerah yang dipakai sebagai konten publik
--  selain sebagai pilihan wilayah.
-- =====================================================================

${baris.join('\n\n')}`);
