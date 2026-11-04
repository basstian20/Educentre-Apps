# Rencana Penerapan Redesign EduCentre

> Dokumen ini adalah **sumber kebenaran** rencana redesign. Siapa pun (termasuk sesi chat baru) yang melanjutkan pekerjaan harus membacanya lebih dulu bersama `README.md` dan `CHECKLIST.md` di folder ini.

## Status tahap
| Tahap | Branch | Status |
|---|---|---|
| 0 · Persiapan | `redesign/clay-t0-persiapan` | **Disetujui, digabung** (PR #1) |
| 1 · Fondasi tampilan | `redesign/clay-t1-fondasi` | **Disetujui, digabung** (PR #2) |
| 2 · Kerangka aplikasi | `redesign/clay-t2-kerangka` | **Disetujui, digabung** (PR #3) |
| 3 · Layar masuk dan dasbor | `redesign/clay-t3-masuk-dasbor` | **Disetujui, digabung** (PR #4) |
| 4 · Halaman data dan keuangan | `redesign/clay-t4-halaman-data` | **Disetujui, digabung** (PR #5) |
| 5 · Halaman akademik dan laporan | `redesign/clay-t5-halaman-akademik` | **Disetujui, digabung** (PR #6) |
| 6 · Gerak dan komponen interaktif | `redesign/clay-t6-gerak` | **Disetujui, digabung** (PR #7) |
| 7 · Merapikan dan dokumen cetak | `redesign/clay-t7-rapi-cetak` | **Disetujui, digabung** |
| 8 · Uji akhir dan serah terima | `redesign/clay-t8-uji-akhir` | **Selesai, menunggu persetujuan Anda** (PR ke `redesign/clay`); penggabungan `redesign/clay` → `main` hanya atas persetujuan eksplisit |

Perbarui tabel ini di akhir setiap tahap. `main` tetap tidak disentuh sampai Tahap 8 disetujui.

## Hal yang masih terbuka
- ~~Database uji terpisah~~ Disetujui dan dipakai: `edu_redesign_test` (dibuat otomatis saat backend lokal jalan dengan `DB_NAME=edu_redesign_test`). Catatan: `backend/.env` tidak memuat `JWT_SECRET`, jadi saat menjalankan lokal setel juga `JWT_SECRET` (nilai acak apa saja) lewat variabel lingkungan, dan pasang dependensi dengan `pip install -r backend/requirements.txt` di `venv`.
- ~~Baseline "sebelum" halaman login-wajib~~ Selesai. `main` (f97a633) dijalankan lokal di worktree pada `edu_redesign_test`, lalu ditangkap dengan Edge headless (skrip CDP, resolusi 2x): Admin Dasbor/Siswa/Tagihan dan Siswa Dasbor dalam HP terang, HP gelap, dan desktop gelap (bahasa Indonesia) di `docs/redesign/before/main-*.jpg` (12 berkas, ±1,4 MB). Baseline desktop terang lama (`*-desktop.jpg`) tetap ada. Catatan: data tangkapan memuat baris uji T8 (siswa impor), bukan data demo.

- Tahap 3: grafik dasbor (area, donat, cincin, mini-grafik, garis waktu) ditulis sebagai komponen SVG sendiri di `frontend/src/components/dashboard/charts.jsx`, bukan Recharts, supaya animasi menggambar-diri dan warna token bisa dipakai langsung. Recharts tetap dipakai di Laporan sampai Tahap 5. Grafik hanya memakai data nyata (kehadiran per tanggal sesi, status tagihan, kapasitas kelas, pendapatan); mini-grafik pendapatan disembunyikan bila data kurang dari 2 bulan.

- Tahap 4: tabel memakai kelas bersama `.clay-table` (kepala pita lembut, 12 px), avatar inisial `.avatar-clay` berwarna token, tombol ikon `.icon-btn`, kotak cari memakai `field-clay`; kartu Materi/Pengumuman memakai `clay-card`. Perbaikan lintas halaman: animasi `fadeUp` pada `<main>` sebelumnya meninggalkan transform sehingga dialog (fixed) bergeser; kini memakai fill-mode `backwards`. Dialog di HP diberi ruang bawah agar tombol Simpan tidak tertutup kredit NobleDev. Alur tulisnya diuji setelah Tahap 6, lihat `CHECKLIST.md`.

- Tahap 5: warna kelas dari data (`color_hex`) dipakai lewat variabel `--t` (pita samping kartu, blok jadwal, bar kapasitas); emoji kartu kelas diganti ikon Lucide. Grafik Laporan tetap Recharts, tetapi warnanya dibaca dari token CSS lewat hook `useTokens` (atribut SVG tidak mengenal `var()`), dan ikut berganti saat mode terang/gelap. Gaya `.attendance-btn`/`.timetable-cell` di `App.css` dipindah ke token. Alur tulisnya diuji setelah Tahap 6, lihat `CHECKLIST.md`.

- Tahap 6: semua gerak bergantung pada `<html data-motion="full|lite">` (`lib/motion.jsx`, gaya di `src/motion.css`). Saklar Penuh/Hemat ada di bilah atas (tersimpan di `ec_motion`); bila sistem meminta `prefers-reduced-motion`, mode otomatis Hemat dan saklar dikunci. Palet perintah (`components/CommandPalette.jsx`, Ctrl/Cmd+K atau tombol cari di bilah atas) memakai `cmdk` yang sudah ada: pindah halaman sesuai peran, aksi cepat (tema, bahasa, gerak, keluar), dan cari siswa (admin; membuka rapor). Konfeti (`lib/confetti.js`, kanvas sendiri tanpa pustaka) menyala saat nilai diterbitkan dan saat pembayaran melunasi tagihan. Kartu `.clay-hover` miring/berkilau mengikuti kursor lewat satu pendengar di `Layout.jsx`. Kartu rapor yang bisa dibalik sudah ada sejak Tahap 3. Pengujian: palet (buka, filter, kosong, pindah halaman), saklar gerak, dan kemiringan kartu diperiksa di browser; konfeti sudah diuji kemudian (muncul saat terbit dan saat tagihan lunas, tidak muncul saat bayar sebagian), begitu pula pencarian siswa di palet.

- Tahap 7: `dark.css` dihapus (aturan isian gelap pindah ke `theme.css`; kelas warna Tailwind yang tersisa diganti token `--ok-ink`/`--bad-ink`). Alias `.font-outfit`/`.font-jakarta` (137 pemakaian) diganti `font-heading`/`font-sans` dari `tailwind.config.js`. Semua teks 7–11,5 px (kredit NobleDev, label tabel HP, bilah bawah, label sidebar/bilah atas, kop cetak, bantuan formulir) kini minimal 12 px; kredit NobleDev dilebarkan agar muat. Cetak: lembar tagihan/rapor selalu terang, tanpa bayangan/animasi/sudut bulat, baris tabel tidak terpotong antar halaman. Build ketat `CI=true yarn build` lulus. Pemeriksaan di browser: teks ≥ 12 px dan kontras AA lulus di 7 halaman admin (terang/gelap); gelembung latar tetap bergerak di mode Hemat, sudah diperbaiki. Catatan lingkungan: di jaringan ini Python gagal menyelesaikan DNS SRV Atlas (`mongodb+srv`), jadi backend uji dijalankan dengan URI Atlas bentuk langsung lewat variabel lingkungan `MONGO_URL` (jangan ditulis ke `launch.json`/repo).

- Tahap 8 (laporan serah terima): tidak ada perubahan kode aplikasi, hanya dokumen. `CI=true yarn build` lulus ("Compiled successfully"). Uji di browser pada `edu_redesign_test`: sapuan semua halaman menu empat peran tanpa kesalahan konsol; Admin 13 halaman × terang/gelap × 375 px tanpa teks meluber; alur tulis yang tersisa (urut, halaman, impor CSV, filter/ekspor/hapus/cetak tagihan, catatan nilai, audiens pengumuman, nilai draf tersembunyi dari siswa) lulus; menu geser HP, notifikasi, bahasa, mode gelap, fokus keyboard lulus. Rincian dan keterbatasan ada di `CHECKLIST.md`. Temuan: (1) "tandai semua hadir" tidak pernah ada, bukan regresi; (2) di mode dev, kegagalan jaringan memunculkan overlay galat CRA, kartu "Gagal memuat" tetap tampil di bawahnya; (3) API `/assessments` mengembalikan penilaian draf ke siswa (nama dan tanggal saja; nilainya disaring) dan API `/invoices`/`/students` terbuka bagi Educator: perilaku backend lama yang sengaja tidak disentuh. Data uji tambahan tertinggal di `edu_redesign_test` saja (10 siswa impor, penilaian "T8 Draf Tak Terbit", 3 pengumuman "T8 khusus …"). Diperiksa lanjutan (setelah PR #9 dibuka): unggah berkas/video Materi, ganti kata sandi berhasil, dan keadaan memuat kini lulus (lihat `CHECKLIST.md`). Baseline "sebelum" HP/gelap kini sudah diambil. **Masih terbuka tinggal satu:** dialog cetak sistem (`window.print`) yang tidak bisa dijalankan dari panel browser, aturan `@media print` sudah diperiksa dari kode. Tidak memblokir penggabungan.

## Cara melanjutkan di chat baru
Buka proyek ini di Claude Code, lalu kirim, misalnya:
> Lanjutkan redesign EduCentre. Baca docs/redesign/PLAN.md, README.md, dan CHECKLIST.md. Mulai Tahap 1 di branch redesign/clay-t1-fondasi (dibuat dari redesign/clay). Jangan sentuh main.

---

## Ringkasan: Clay Soft · Ocean Blue · Bricolage Grotesque + Instrument Sans

## Konteks
Tampilan EduCentre yang sekarang (kaca pastel hijau-ungu, font Outfit/Jakarta, beberapa teks sangat kecil) akan diganti dengan desain akhir yang Anda pilih: **Clay Soft** (kartu empuk 3D lembut), warna **Ocean Blue**, font **Bricolage Grotesque + Instrument Sans**. Semua fitur lama tetap ada. Sesuai pilihan Anda, ikut diterapkan juga **komponen baru** dari mockup: dasbor bergrafik, kartu rapor yang bisa dibalik, palet perintah (Ctrl+K), konfeti, dan gerak halus. Rujukan visual: `mockup-redesign/mockups/v8-font-kombinasi-lain.html#2` dan `mockup-redesign/DESIGN.md`.

Yang **tidak** berubah: isi dan cara kerja fitur, data, server belakang (backend), teks bahasa, dan atribut penanda uji (`data-testid`).

## Aturan main yang dijaga
1. **`main` tidak disentuh** sampai seluruh redesign selesai dan Anda menyetujui. Situs demo yang hidup (educentre-apps.vercel.app) tetap seperti sekarang.
2. Semua pekerjaan ada di **branch lain**. Setiap tahap punya **branch sendiri** yang dibuat dari branch redesign, bukan dari `main`.
3. Tiap tahap digabung ke branch redesign **hanya setelah Anda setuju** (lewat usulan perubahan/PR + peragaan).
4. Satu tahap pada satu waktu (tahap-tahap memakai berkas gaya yang sama, jadi tidak dikerjakan bersamaan).
5. Tidak ada perubahan pada backend; tidak ada deploy ke produksi selama redesign.

## Peta branch
```
main                      ← tidak berubah sampai akhir
 └── redesign/clay        ← branch utama redesign (dibuat sekali dari main)
      ├── redesign/clay-t0-persiapan
      ├── redesign/clay-t1-fondasi
      ├── redesign/clay-t2-kerangka
      ├── redesign/clay-t3-masuk-dasbor
      ├── redesign/clay-t4-halaman-data
      ├── redesign/clay-t5-halaman-akademik
      ├── redesign/clay-t6-gerak
      ├── redesign/clay-t7-rapi-cetak
      └── redesign/clay-t8-uji-akhir
```
Alur tiap tahap: buat branch tahap → kerjakan → periksa → buka usulan perubahan ke `redesign/clay` → Anda lihat dan setujui → digabung → branch tahap dihapus. Setelah tahap 8 dan persetujuan akhir Anda, `redesign/clay` baru digabung ke `main`.

## Tahap demi tahap

### Tahap 0 · Persiapan (ukuran: kecil)
- **Tujuan:** menyiapkan landasan yang aman.
- **Isi:** membuat branch redesign; menyimpan folder `mockup-redesign` dan `DESIGN.md` sebagai rujukan di dalam proyek; membuat **daftar periksa tetap** (4 peran × 2 bahasa × terang/gelap × desktop/HP × semua halaman); mengambil **tangkapan layar "sebelum"** dari tampilan sekarang untuk pembanding; mencatat cara menjalankan pratinjau lokal.
- **Yang Anda lihat:** belum ada perubahan tampilan.
- **Catatan:** file lain yang belum tersimpan di Git (`PRODUCT.md`, `.claude/`, `.agents/`, `skills-lock.json`) tidak ikut kecuali Anda minta.

### Tahap 1 · Fondasi tampilan (ukuran: besar)
- **Tujuan:** mengganti "bahan dasar" tampilan di seluruh aplikasi sekaligus.
- **Isi:** font baru (dipasang sendiri agar cepat, tidak bergantung pihak luar); palet Ocean Blue terang dan gelap; bentuk Clay (sudut besar, bayangan empuk, tombol menggembung); komponen dasar (tombol, kartu, isian, kotak dialog, chip status, kotak pencarian); merapikan penamaan warna yang saling bentrok; mulai memindahkan mode gelap dari "tambalan per kelas" ke **warna berbasis aturan** supaya tidak mudah rusak.
- **Yang Anda lihat:** seluruh aplikasi sudah berganti warna dan font, walaupun tata letak belum final.
- **Risiko:** mode gelap bisa tampak salah di sebagian tempat → diperiksa di setiap halaman sebelum disetujui.

### Tahap 2 · Kerangka aplikasi (ukuran: sedang)
- **Tujuan:** mengganti "rangka" yang dilihat di semua halaman.
- **Isi:** sidebar melayang beserta indikator menu yang meluncur; bilah atas (cari/palet, bahasa, mode gelap, notifikasi, akun); latar dengan gelembung lembut; navigasi HP (bilah bawah + menu geser); kredit NobleDev tetap terlihat.
- **Yang Anda lihat:** bingkai aplikasi seperti di mockup di semua peran.
- **Risiko:** tabel di HP yang berubah menjadi kartu bergantung pada mekanisme khusus → bentuk tabel dijaga dan hanya tampilannya yang diganti.

### Tahap 3 · Layar masuk dan dasbor empat peran (ukuran: besar)
- **Tujuan:** halaman pertama yang dilihat semua orang.
- **Isi:** layar masuk baru (hero bentuk tanah liat, tombol akun demo, ID/EN); dasbor Admin, Educator, Siswa, dan Orang tua dengan grafik baru (area, donut, cincin progres, mini-grafik, garis waktu sesi); kartu rapor yang bisa dibalik; angka KPI menghitung naik; warna kartu statistik pindah ke aturan warna baru.
- **Yang Anda lihat:** dasbor sesuai mockup, termasuk dasbor siswa dan orang tua yang kini lebih kaya.

### Tahap 4 · Halaman data dan keuangan (ukuran: sedang)
- **Isi:** Siswa (cari, urut, halaman, impor CSV, rapor), Pendidik, Orang tua, Tagihan (buat, catat bayar), Materi, Pengumuman, Pengaturan; seluruh tabel, kotak dialog, dan keadaan kosong/gagal/memuat.
- **Yang Anda lihat:** semua halaman daftar dan formulir bergaya baru, di desktop dan HP.

### Tahap 5 · Halaman akademik dan laporan (ukuran: sedang)
- **Isi:** Kelas (kartu + jadwal mingguan, warna kelas dari data tetap dipakai), Pendaftaran 4 langkah, Absensi, Nilai (buat penilaian, input, terbitkan), Hasil siswa/orang tua, Laporan (grafik dengan warna baru).

### Tahap 6 · Gerak dan komponen interaktif (ukuran: sedang)
- **Isi:** transisi antarhalaman (kartu masuk bergantian), pantulan halus saat disentuh, kilau dan kemiringan kartu mengikuti kursor, **palet perintah Ctrl+K** (pindah halaman, aksi cepat, cari siswa), konfeti saat nilai terbit atau tagihan lunas, saklar gerak **Penuh/Hemat** (dan otomatis hemat bila sistem Anda memintanya).
- **Teks baru** (palet, petunjuk balik kartu, dll.) disediakan dalam Indonesia dan Inggris.

### Tahap 7 · Merapikan dan dokumen cetak (ukuran: sedang)
- **Isi:** tagihan dan rapor cetak tetap **polos** (tanpa efek 3D); membuang gaya lama yang tak terpakai (termasuk file mode gelap lama); menaikkan semua teks yang masih 8–10 px menjadi minimal 12 px; memeriksa kontras, fokus keyboard, dan kecepatan; memperbarui `DESIGN.md` dan README.

### Tahap 8 · Uji akhir dan serah terima (ukuran: kecil–sedang)
- **Isi:** uji menyeluruh seluruh daftar periksa; memastikan build produksi bersih; membandingkan dengan tangkapan layar "sebelum"; laporan ringkas untuk Anda.
- **Hasil:** `redesign/clay` siap digabung ke `main`. **Penggabungan ke `main` hanya atas persetujuan eksplisit Anda.**

## Cara Anda meninjau tiap tahap
- Saya jalankan aplikasi di komputer ini dan tunjukkan hasilnya (tangkapan layar atau pratinjau yang bisa Anda buka) untuk keempat peran, desktop dan HP, terang dan gelap.
- Anda menyetujui atau meminta perbaikan; baru setelah itu tahap digabung.
- Catatan: pratinjau otomatis dari Vercel untuk branch kemungkinan **tidak bisa login** (server belakang hanya mengizinkan alamat tertentu). Karena itu peninjauan memakai pratinjau lokal, dan backend sengaja tidak diubah.

## Pengaman
- **Situs demo aman:** `main` tidak berubah; tidak ada deploy dari branch redesign.
- **Build produksi:** sebelum tiap tahap digabung, dijalankan build dalam mode ketat (satu peringatan saja bisa menggagalkan deploy di Vercel).
- **Tanpa tes otomatis di proyek ini:** ditutup dengan daftar periksa tetap, tangkapan layar sebelum/sesudah, dan pemeriksaan klik otomatis lewat browser oleh saya di setiap tahap.
- **Mundur mudah:** tiap tahap terpisah, jadi bisa dibatalkan sendiri; penggabungan akhir ke `main` bisa dibalik dengan satu langkah.
- **Penanda uji (`data-testid`), kredit NobleDev, teks Indonesia-utama, dan HP-pertama** dipertahankan di setiap tahap.

## Keputusan yang sudah ditetapkan
- Cakupan: tampilan + gerak + komponen baru (pilihan Anda).
- Peninjauan: Anda setujui tiap tahap (pilihan Anda).
- Hero 3D layar masuk memakai **CSS murni** (ringan, tanpa pustaka 3D).
- Palet perintah memakai komponen yang sudah ada di proyek (`cmdk`/`command.jsx`); grafik memakai **Recharts** yang sudah terpasang; animasi memakai CSS (tanpa menambah pustaka animasi).
- Font dipasang sendiri lewat paket `@fontsource` (tambahan kecil), menggantikan impor Google Fonts.

## Lampiran teknis (untuk pelaksana)
- Berkas inti: `frontend/src/index.css` (~1500 baris: token, shell, dasbor, login), `frontend/src/dark.css` (164 baris, pemetaan mode gelap, target dipensiunkan), `frontend/src/components/UI.jsx` (Card, Btn, Modal, StatTile… tuas utama), `Layout.jsx` (MutationObserver untuk label tabel HP; jaga kelas `rtable`), `Sidebar.jsx`, `Topbar.jsx`, `pages/Dashboard.jsx` (419 baris, 4 peran satu komponen), `pages/Login.jsx` (~40 kelas `.login-*`), `pages/Reports.jsx` (warna recharts hex), `pages/Classes.jsx` (warna kelas dinamis `color_hex`), `tailwind.config.js` (belum ada fontFamily/warna merek), `src/App.css` (legacy).
- Token bentrok: `--primary`/`--border`/`--bg` bernilai hex sedangkan shadcn mengharap HSL (`--primary-shad`, `--border-shad`); rapikan di Tahap 1.
- Warna lewat prop hex (`StatTile`, `RoleHero`, `ActionPanel`, `InsightCard`: `${color}15`) → pindah ke variabel CSS.
- Sumber token/komponen: `mockup-redesign/v6/palettes.css` (palet D), `v7/clay7.css`, `v8/fonts8.css` (font F), `v4/base4.css` + `v4/pages3.js` + `v4/motion.js` (grafik, kartu balik, palet, konfeti).
- Git: branch dari `main` (f97a633); gaya komit mengikuti riwayat (`feat(ui): …`); usulan perubahan per tahap memakai `gh pr create --base redesign/clay`. Tidak ada CI di repo; Vercel membangun dengan `CI=true` sehingga peringatan ESLint menggagalkan build.
- Jalankan lokal: backend FastAPI + MongoDB (`uvicorn server:app --port 8000`), frontend `yarn start` (port 3000, diizinkan CORS); akun demo ada di `memory/test_credentials.md`.

## Verifikasi (tiap tahap dan akhir)
1. Build ketat: `CI=true yarn build` di `frontend/` harus lulus tanpa peringatan.
2. Jalankan aplikasi lokal; masuk dengan keempat akun demo; periksa semua halaman peran tersebut di lebar desktop dan HP, bahasa ID dan EN, mode terang dan gelap.
3. Uji klik otomatis lewat browser (tombol, modal, formulir, tabel cari/urut/halaman) tanpa kesalahan konsol.
4. Bandingkan dengan tangkapan layar "sebelum" dan dengan mockup acuan.
5. Periksa: kontras teks, ukuran teks ≥ 12 px, fokus keyboard, `prefers-reduced-motion`, cetak tagihan/rapor polos, `data-testid` tidak berubah.
