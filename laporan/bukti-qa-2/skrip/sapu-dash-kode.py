# QA-2 K2 — sapu em dash (—) dan en dash (–) pada teks tampil di app/, components/, lib/ (di luar komentar).
# Aturan pengganti: judul/metadata "A — B" -> "A - B" (tanda hubung biasa); klausa penjelas " — " -> ", ";
# placeholder nilai kosong '—' -> '-'; label pilihan "— X —" -> "(X)"; rentang "A – B" -> "A s.d. B".
import re, subprocess, sys

def baca(p): return open(p, encoding='utf-8').read()
def tulis(p, s): open(p, 'w', encoding='utf-8').write(s)

# 1) pola khusus (judul/metadata, placeholder, label pilihan, rentang)
KHUSUS = [
    ('app/(publik)/page.js', "absolute: 'WARKOP NUSANTARA — Wadah", "absolute: 'WARKOP NUSANTARA - Wadah"),
    ('app/(publik)/berita/page.js', '${namaKategori} — Berita & Investigasi', '${namaKategori} - Berita & Investigasi'),
    ('app/(publik)/berita/page.js', '" — Berita & Investigasi', '" - Berita & Investigasi'),
    ('app/(publik)/tentang/page.js', "'Mengenal WARKOP NUSANTARA — Wadah", "'Mengenal WARKOP NUSANTARA - Wadah"),
    ('app/(publik)/berita/[slug]/page.js', '${artikel.penulis_nama} — lambang WARKOP NUSANTARA', '${artikel.penulis_nama}, lambang WARKOP NUSANTARA'),
    ('app/(publik)/galeri/page.js', '`${item.judul} — ${kat.label}`', '`${item.judul} (${kat.label})`'),
    ('components/publik/TombolBagikan.js', '`${judul} — ${ringkasan}`', '`${judul}: ${ringkasan}`'),
    ('components/staf/PanelStatusPengaduan.js', '— Belum ditugaskan —', '(Belum ditugaskan)'),
    ('components/staf/KelolaProgram.js', "return '—';", "return '-';"),
    ('components/staf/KelolaProgram.js', '`${awal} – ${akhir}`', '`${awal} s.d. ${akhir}`'),
    ('app/(auth)/tanpa-akses/page.js', '403 — Tidak Berhak', '403: Tidak Berhak'),
]
for p, lama, baru in KHUSUS:
    s = baca(p)
    if lama in s: tulis(p, s.replace(lama, baru)); print('khusus:', p, '|', lama[:40])
    else: print('  (tidak ditemukan)', p, lama[:40])

# 2) generik: placeholder '—' (nilai kosong) -> '-', lalu " — " -> ", " di luar komentar
out = subprocess.run([sys.executable, '-c', ''], capture_output=True)  # no-op
hasil = subprocess.run(['node', 'scripts/penjaga-dash.mjs'], capture_output=True, text=True, encoding='utf-8').stdout
berkas = sorted({b.split(':')[0].strip().replace('\\', '/') for b in hasil.split('\n') if b.startswith('  ') and ':' in b and not b.strip().startswith('DB ')})
for p in berkas:
    s = baca(p); asli = s
    baris = s.split('\n'); blok = False
    for i, b in enumerate(baris):
        kode = b
        # jangan ubah komentar baris/blok
        strip = b.lstrip()
        if strip.startswith('//') or strip.startswith('*') or strip.startswith('/*') or strip.startswith('{/*'): continue
        kode = re.sub(r"(['\"`?])—\1", r"\1-\1", kode)           # '—' placeholder
        kode = re.sub(r"\|\| '—'", "|| '-'", kode)
        kode = re.sub(r"\?\? '—'", "?? '-'", kode)
        kode = kode.replace(' — ', ', ').replace(' – ', ', ')
        kode = kode.replace('—', '-').replace('–', '-')
        baris[i] = kode
    s = '\n'.join(baris)
    if s != asli: tulis(p, s); print('generik:', p)
print(subprocess.run(['node', 'scripts/penjaga-dash.mjs'], capture_output=True, text=True, encoding='utf-8').stdout)
