# Keputusan desain EduCentre

Dipilih pengguna setelah delapan putaran eksplorasi (lihat `index.html` untuk riwayat). Rujukan visual hidup: `mockups/v8-font-kombinasi-lain.html#2` (font F, palet Ocean Blue, gaya Clay Soft). Mockup adalah statis/prototipe; belum ada kode aplikasi yang diubah.

## Ringkasan
| Aspek | Keputusan |
|---|---|
| Struktur | Familiar: sidebar + dasbor + halaman per modul (arah C "Tegas & Efisien" dari V3) |
| Gaya | **Clay Soft**: 3D lembut menggembung, kartu tebal dengan highlight dalam, gerak memantul, parallax, ikon bola 3D |
| Palet | **Ocean Blue** (terang dan gelap) |
| Font | **Bricolage Grotesque** (judul, angka) + **Instrument Sans** (isi) |
| Peran | Admin, Educator, Siswa, Orang tua. Semua fitur yang ada sekarang tetap tercakup |
| Perangkat | Desktop (sidebar) dan HP (bottom-nav + drawer, tabel jadi kartu) |
| Bahasa | Indonesia utama, EN sebagai pilihan |
| Kredit | NobleDev tetap terlihat (sidebar dan layar masuk) |

## Warna (Ocean Blue)
| Token | Terang | Gelap |
|---|---|---|
| `--bg` | #e9f0fd | #0d1630 |
| `--surface` | #ffffff | #172345 |
| `--ink` | #14264f | #e8efff |
| `--mut` (teks redup) | #516697 | #9fb1e0 |
| `--line` | #d9e5fa | rgba(255,255,255,.08) |
| `--soft` | #e4edfc | rgba(255,255,255,.06) |
| `--pri` (utama) | #3f6df2 | #6f95ff |
| `--pl` (terang, tombol atas) | #7aa2ff | #9bb7ff |
| `--pd` (gelap, sisi tombol) | #2447b8 | #3f63d6 |
| `--ok` | #22b573 | #4be0a0 |
| `--warn` | #f1a31c | #ffc15a |
| `--bad` | #ee4d6a | #ff7d97 |
| `--info` | #12b6d4 | #4fd3ee |
| Seri KPI `c1..c5` | #3f6df2 #12b6d4 #f1a31c #22b573 #ee4d6a | #6f95ff #4fd3ee #ffc15a #4be0a0 #ff7d97 |

Kontras teks utama 12–15:1; teks redup mode terang ≥ 4,6:1 terhadap latar dan kartu putih. Warna status (hijau OK, merah bahaya) sengaja konsisten antar palet.

## Tipografi
| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul halaman (h1) | Bricolage Grotesque | 800 | 33 px, tracking -0,035em, line-height 1,05 |
| Judul kartu (h3) | Bricolage Grotesque | 800 | 17 px, tracking -0,01em |
| Angka KPI, nilai, tagihan | Bricolage Grotesque | 800 | 33 px, tracking -0,04em, angka tabular |
| Isi, label, tabel, tombol | Instrument Sans | 400–700 (label 600) | dasar 13,5 px; label kecil minimal 12 px |
| Menu sidebar | Instrument Sans | 600 | 13,5 px |

Lisensi: Google Fonts (SIL OFL). Di aplikasi sungguhan, pasang sendiri (self-host) bobot yang dipakai saja agar cepat dan tidak bergantung pihak luar.

## Bentuk dan kedalaman (Clay Soft)
- Radius kartu 28 px, kontrol 16 px, tombol dan chip pil penuh. Sidebar melayang, radius 34 px.
- Bayangan kartu: `0 24px 34px -20px rgba(63,109,242,.5)` + highlight dalam putih di atas + bayangan dalam gelap tipis di bawah.
- Tombol utama menggembung dengan "tebal" bawah (`pd`), tertekan saat diklik.
- Latar: gradien lembut (biru muda dan cyan) dengan gelembung melayang yang bergeser mengikuti kursor (parallax).
- Ikon KPI berupa bola 3D dengan kilau.

## Gerak dan komponen
- Transisi halaman: kartu masuk bergantian (stagger), angka KPI menghitung naik, grafik menggambar diri.
- Indikator menu meluncur; hover kartu memantul (spring); tilt kartu halus; kilau mengikuti kursor.
- Grafik: area dengan garis menggambar diri, donut status, cincin progres, mini-grafik di KPI, garis waktu dengan penanda berdenyut.
- Kartu rapor yang bisa dibalik 3D (siswa dan orang tua); konfeti saat nilai terbit atau tagihan lunas.
- Palet perintah **Ctrl+K**: pindah halaman, aksi cepat, cari siswa.
- Hero layar masuk: bentuk tanah liat melayang dengan parallax.
- Aksesibilitas: saklar gerak Penuh/Hemat dan penghormatan terhadap `prefers-reduced-motion`; fokus dan keyboard tetap utuh.

## Cakupan fitur (empat peran)
- **Admin:** dasbor, laporan, siswa (cari, urut, halaman, impor CSV, rapor cetak), pendidik, orang tua, kelas (kartu + jadwal mingguan), pendaftaran 4 langkah, absensi, nilai (buat penilaian, input, terbitkan), materi (tautan/berkas/video), tagihan (buat, catat bayar, cetak), pengumuman (audiens), pengaturan (profil, kata sandi, data pusat bimbel).
- **Educator:** dasbor, kelas saya, isi absensi, input nilai, materi, pengumuman, pengaturan.
- **Siswa:** dasbor, jadwal saya, hasil saya, materi, kehadiran, biaya saya, pengumuman, pengaturan.
- **Orang tua:** dasbor (pilih anak), anak saya (rapor), hasil, kehadiran, kelas, biaya, pengumuman, pengaturan.
- **Umum:** notifikasi, ganti bahasa ID/EN, mode gelap, menu akun, kredit NobleDev.

## Hal yang perlu diputuskan saat implementasi
- Pustaka untuk animasi (mis. Framer Motion atau CSS murni), grafik (mis. Recharts yang sudah ada), dan 3D hero (CSS murni, tanpa three.js, agar ringan).
- Menjaga atribut `data-testid` yang ada saat merestyle komponen React/shadcn.
- ~~Menggeser token ke variabel; merapikan `dark.css`~~ Selesai: `dark.css` dihapus (Tahap 7), mode gelap berbasis token di `theme.css`.
- Menjaga kontras minimal AA dan ukuran teks minimal 12 px (tercapai di Tahap 7).
