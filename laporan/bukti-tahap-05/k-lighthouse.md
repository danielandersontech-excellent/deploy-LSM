# Uji k — Lighthouse 12 (mobile, throttling tersimulasi) pada BUILD PRODUKSI lokal

| Halaman | Performance | Accessibility | Best Practices | SEO | Metrik |
|---|---|---|---|---|---|
| berita | 78 | 98 | 96 | 100 | LCP 4.5 s, FCP 2.9 s, TBT 110 ms, CLS 0 |
|   | audit a11y <1: heading-order ; bp <1: errors-in-console | | | | |
| detail | 73 | 100 | 96 | 100 | LCP 5.1 s, FCP 3.5 s, TBT 90 ms, CLS 0.001 |
|   | audit a11y <1: - ; bp <1: errors-in-console | | | | |

Laporan lengkap: laporan/bukti-tahap-05/lighthouse/*.report.{json,html}. Penyebab Performance < 90 sama dengan Tahap 4 (font Fira Sans ±570 KB tidak disubset — menunggu keputusan pemilik).
