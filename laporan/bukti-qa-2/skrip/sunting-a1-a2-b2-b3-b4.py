# QA-2 — suntingan A1 (alamat), A2 (kelompok pengurus: skema, lib/db, validasi, formulir, seed), B2 (hero segel), B3 (footer alamat),
# B4 (logo tentang utuh). Dijalankan sekali; disimpan sebagai jejak.
import re

def baca(p): return open(p, encoding='utf-8').read()
def tulis(p, s): open(p, 'w', encoding='utf-8').write(s)
def ganti(p, lama, baru, n=1):
    s = baca(p); assert lama in s, (p, lama[:70]); tulis(p, s.replace(lama, baru, n)); print('ok', p, '|', lama[:50].replace('\n', ' '))

ALAMAT = ("Komplek Perkantoran CNN", "Jl. Tuanku Tambusai No. B 15, Labuh Baru Tim., Payung Sekaki", "Kota Pekanbaru, Riau 28123")

# ---------- A1: alamat resmi (bawaan definisi + seed)
p = 'lib/pengaturanDefinisi.js'
ganti(p, "bawaan: 'Gedung Aspirasi Rakyat'", f"bawaan: '{ALAMAT[0]}'")
ganti(p, "bawaan: 'Jl. Kebenaran No. 1, Jakarta Pusat'", f"bawaan: '{ALAMAT[1]}'")
ganti(p, "bawaan: 'DKI Jakarta, 10110'", f"bawaan: '{ALAMAT[2]}'")
for p in ['database/seed.sql', 'sql/02-seed.sql']:
    s = baca(p)
    s = s.replace("('kontak_alamat_gedung', 'Gedung Aspirasi Rakyat',", f"('kontak_alamat_gedung', '{ALAMAT[0]}',")
    s = s.replace("('kontak_alamat_jalan',  'Jl. Kebenaran No. 1, Jakarta Pusat',", f"('kontak_alamat_jalan',  '{ALAMAT[1]}',")
    s = s.replace("('kontak_alamat_kota',   'DKI Jakarta, 10110',", f"('kontak_alamat_kota',   '{ALAMAT[2]}',")
    tulis(p, s); print('seed alamat', p)

# ---------- A2: skema (instalasi baru), lib/db, validasi, formulir
for p in ['database/schema.sql', 'sql/01-schema.sql']:
    s = baca(p)
    if 'kelompok' not in s:
        s = s.replace("  tingkat      ENUM('pusat','wilayah') NOT NULL,\n", "  tingkat      ENUM('pusat','wilayah') NOT NULL,\n  -- QA-2 A2: kelompok bagan (lib/kelompokPengurus.js); instalasi lama: migrasi 20260904-1500\n  kelompok     VARCHAR(40) NULL,\n", 1)
        s = s.replace("  KEY idx_pengurus_tingkat_urutan (tingkat, urutan),\n", "  KEY idx_pengurus_tingkat_urutan (tingkat, urutan),\n  KEY idx_pengurus_kelompok_urutan (kelompok, urutan),\n", 1)
        tulis(p, s); print('skema kelompok', p)

p = 'lib/db/pengurus.js'; s = baca(p)
s = s.replace("const KOLOM = `p.id, p.nama, p.jabatan, p.tingkat, p.wilayah_id,", "const KOLOM = `p.id, p.nama, p.jabatan, p.tingkat, p.kelompok, p.wilayah_id,", 1)
s = s.replace("export async function buatPengurus({ nama, jabatan, tingkat, wilayahId = null, foto = null, deskripsi = null, aktifSejak = null, urutan = 0, aktif = 1 }) {", "export async function buatPengurus({ nama, jabatan, tingkat, kelompok = null, wilayahId = null, foto = null, deskripsi = null, aktifSejak = null, urutan = 0, aktif = 1 }) {")
s = s.replace("`INSERT INTO pengurus (nama, jabatan, tingkat, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,", "`INSERT INTO pengurus (nama, jabatan, tingkat, kelompok, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,")
s = s.replace("export async function perbaruiPengurus(id, { nama, jabatan, tingkat, wilayahId = null, foto = null, deskripsi = null, aktifSejak = null, urutan = 0, aktif = 1 }) {", "export async function perbaruiPengurus(id, { nama, jabatan, tingkat, kelompok = null, wilayahId = null, foto = null, deskripsi = null, aktifSejak = null, urutan = 0, aktif = 1 }) {")
s = s.replace("`UPDATE pengurus SET nama = ?, jabatan = ?, tingkat = ?, wilayah_id = ?, foto = ?, deskripsi = ?, aktif_sejak = ?, urutan = ?, aktif = ? WHERE id = ?`,", "`UPDATE pengurus SET nama = ?, jabatan = ?, tingkat = ?, kelompok = ?, wilayah_id = ?, foto = ?, deskripsi = ?, aktif_sejak = ?, urutan = ?, aktif = ? WHERE id = ?`,")
tulis(p, s)
# parameter INSERT/UPDATE: sisipkan kelompok setelah tingkat
s = baca(p)
s = re.sub(r"\[nama, jabatan, tingkat, wilayahId,", "[nama, jabatan, tingkat, kelompok, wilayahId,", s)
tulis(p, s); print('lib/db/pengurus kelompok', s.count('kelompok'))

p = 'lib/validasi/konten.js'; s = baca(p)
if 'kelompokValid' not in s:
    s = s.replace("import { peranValid }", "import { peranValid }", 1)  # tanpa perubahan bila tidak ada
    baris = s.split('\n'); idx = max(i for i, b in enumerate(baris) if b.startswith('import ')); baris.insert(idx + 1, "import { kelompokValid, kelompokTemplate } from '../kelompokPengurus.js';"); s = '\n'.join(baris)
s = s.replace("""  const wilayahId = idOpsional(body.wilayah_id ?? body.wilayahId, 'wilayah_id', 'Wilayah');
  if (tingkat === 'wilayah' && !wilayahId) throw new GalatValidasiKonten('Pengurus tingkat wilayah wajib memilih wilayah', 'WILAYAH_WAJIB', 'wilayah_id');""",
"""  // QA-2 A2: kelompok bagan (opsional; slug dari lib/kelompokPengurus.js). Template DPW/DPD/DPC boleh tanpa wilayah.
  const kelompokMentah = teks(body.kelompok, 40);
  const kelompok = kelompokMentah ? kelompokMentah : null;
  if (kelompok && !kelompokValid(kelompok)) throw new GalatValidasiKonten('Kelompok tidak dikenal', 'KELOMPOK_TIDAK_SAH', 'kelompok');
  const wilayahId = idOpsional(body.wilayah_id ?? body.wilayahId, 'wilayah_id', 'Wilayah');
  if (tingkat === 'wilayah' && !wilayahId && !kelompokTemplate(kelompok)) throw new GalatValidasiKonten('Pengurus tingkat wilayah wajib memilih wilayah', 'WILAYAH_WAJIB', 'wilayah_id');""")
s = s.replace("    nama, jabatan, tingkat, wilayahId, foto: jalurGambar(body.foto, 'foto'),", "    nama, jabatan, tingkat, kelompok, wilayahId, foto: jalurGambar(body.foto, 'foto'),")
tulis(p, s); print('validasi kelompok')

p = 'components/staf/KelolaPengurus.js'; s = baca(p)
if 'KELOMPOK_PENGURUS' not in s:
    baris = s.split('\n'); idx = max(i for i, b in enumerate(baris) if b.startswith('import ')); baris.insert(idx + 1, "import { KELOMPOK_PENGURUS } from '@/lib/kelompokPengurus';"); s = '\n'.join(baris)
s = s.replace("return { nama: '', jabatan: '', tingkat, wilayah_id: '', foto: null,", "return { nama: '', jabatan: '', tingkat, kelompok: '', wilayah_id: '', foto: null,")
s = s.replace("    tingkat: p.tingkat,\n", "    tingkat: p.tingkat,\n    kelompok: p.kelompok || '',\n", 1)
s = s.replace("      wilayah_id: nilai.tingkat === 'wilayah' && nilai.wilayah_id ? Number(nilai.wilayah_id) : null,", "      kelompok: nilai.kelompok || null,\n      wilayah_id: nilai.tingkat === 'wilayah' && nilai.wilayah_id ? Number(nilai.wilayah_id) : null,")
s = s.replace("    if (nilai.tingkat === 'wilayah' && !nilai.wilayah_id) {", "    if (nilai.tingkat === 'wilayah' && !nilai.wilayah_id && !/^dp[wdc]$/.test(nilai.kelompok || '')) {")
# select kelompok setelah select tingkat
s = s.replace("""                    <option value="wilayah">Wilayah</option>
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>""", """                    <option value="wilayah">Wilayah</option>
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                  {/* QA-2 A2: kelompok bagan struktur (Dewan/DPP/Direktorat/Satgas/DPW-DPD-DPC) */}
                  <label className={KELAS_LABEL} htmlFor="pengurus-kelompok">Kelompok Bagan</label>
                  <select className={KELAS_SELECT} id="pengurus-kelompok" name="kelompok" value={nilai.kelompok} onChange={(e) => ubahNilai('kelompok', e.target.value)} disabled={memuat}>
                    <option value="">Tanpa kelompok (Pimpinan Regional)</option>
                    {KELOMPOK_PENGURUS.map((k) => (
                      <option key={k.slug} value={k.slug}>{k.label}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>""", 1)
tulis(p, s); print('KelolaPengurus kelompok', s.count('kelompok'))

# seed.sql: ganti blok pengurus contoh dengan data DPP (sama dengan migrasi 1510, tanpa DELETE)
data = baca('database/migrations/20260904-1510-pengurus-dpp-data.sql')
blok = data[data.index('INSERT INTO pengurus'):]
blok = blok.replace('INSERT INTO pengurus', 'INSERT IGNORE INTO pengurus', 1)
blok = blok[:blok.index('ON DUPLICATE KEY UPDATE')].rstrip().rstrip(')') + ');\n' if False else re.sub(r"\)\s*\nON DUPLICATE KEY UPDATE[\s\S]*$", ");\n", blok)
for p in ['database/seed.sql', 'sql/02-seed.sql']:
    s = baca(p)
    m = re.search(r"INSERT IGNORE INTO pengurus \(id, nama, jabatan, tingkat, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif\) VALUES\n(?:.*\n)*?.*?;\n", s)
    assert m, p
    s = s[:m.start()] + "-- QA-2 A2: susunan DPP asli pemilik (lihat database/migrations/20260904-1510-pengurus-dpp-data.sql)\n" + blok + s[m.end():]
    tulis(p, s); print('seed pengurus DPP', p)

# ---------- B2: hero beranda, segel besar di kanan (lg+)
p = 'app/(publik)/page.js'; s = baca(p)
lama = s[s.index('<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">'):s.index('<div className="max-w-3xl">')]
s = s.replace(lama, '<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 flex items-center justify-between gap-gutter">\n          ', 1)
# tutup: setelah blok max-w-3xl berakhir -> sisipkan segel sebelum penutup kontainer; cari penutup "</div>\n        </div>\n      </section>" pertama setelah hero
idx = s.index('<div className="max-w-3xl">')
penutup = s.index('          </div>\n        </div>\n      </section>', idx)
s = s[:penutup] + '          </div>\n          {/* QA-2 B2 (KEPUTUSAN PEMILIK): visual hero kanan = logo segel besar WARKOP; hanya lg+ agar teks hero tetap utuh di ponsel/tablet */}\n          <div className="hidden lg:flex shrink-0 items-center justify-center w-80 xl:w-96" aria-hidden="true">\n            <Image className="w-full h-auto object-contain drop-shadow-[0_12px_28px_rgba(39,19,16,0.25)]" src="/logo-warkop-besar.png" alt="" width={1024} height={1024} priority />\n          </div>\n        </div>\n      </section>' + s[penutup + len('          </div>\n        </div>\n      </section>'):]
tulis(p, s); print('hero segel')

# ---------- B3: footer + alamat dari pengaturan (A1)
p = 'components/publik/FooterPublik.js'; s = baca(p)
s = s.replace("const setelan = await ambilPengaturan(['kontak_email', 'kontak_hotline']);", "const setelan = await ambilPengaturan(['kontak_email', 'kontak_hotline', 'kontak_alamat_gedung', 'kontak_alamat_jalan', 'kontak_alamat_kota']);")
s = s.replace("""            <Ikon nama="call" className="text-sm" />
            {setelan.kontak_hotline}
          </p>""", """            <Ikon nama="call" className="text-sm" />
            {setelan.kontak_hotline}
          </p>
          {/* QA-2 A1/B3: alamat resmi dari pengaturan (kelas sama dengan baris email/hotline desain) */}
          <p className="font-body-md text-body-md text-surface-variant flex items-start gap-2 max-w-xs">
            <Ikon nama="location_on" className="text-sm mt-1" />
            <span>{setelan.kontak_alamat_gedung}, {setelan.kontak_alamat_jalan}, {setelan.kontak_alamat_kota}</span>
          </p>""")
tulis(p, s); print('footer alamat')

# ---------- B4: logo tentang utuh (object-contain, latar lembut)
p = 'app/(publik)/tentang/page.js'
ganti(p, '<div className="relative h-[500px] rounded-lg overflow-hidden border border-outline shadow-sm">', '{/* QA-2 B4: object-cover memotong segel di lebar tertentu -> object-contain + padding, latar surface-container-low */}\n            <div className="relative h-[500px] rounded-lg overflow-hidden border border-outline shadow-sm bg-surface-container-low p-6">')
ganti(p, 'className="object-cover w-full h-full"\n                src="/logo-warkop-besar.png"', 'className="object-contain w-full h-full p-6"\n                src="/logo-warkop-besar.png"')
print('selesai')
