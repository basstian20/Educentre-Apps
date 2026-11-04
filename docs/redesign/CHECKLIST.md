# Daftar periksa redesign

Dipakai di setiap tahap, dan lengkap di Tahap 8. Centang per tahap di usulan perubahan (PR).

## A. Matriks yang diperiksa
| Dimensi | Nilai |
|---|---|
| Peran | Admin · Educator · Siswa · Orang tua |
| Bahasa | Indonesia (utama) · English |
| Mode | Terang · Gelap |
| Perangkat | Desktop (±1280 px) · HP (±375 px) |

Akun demo ada di `memory/test_credentials.md`. Pakai backend lokal dengan database terpisah (lihat `README.md`) agar data demo tidak tercemar.

## B. Halaman per peran
**Admin:** Masuk · Dasbor · Laporan · Siswa · Pendidik · Orang tua · Kelas · Pendaftaran · Absensi · Nilai · Materi · Tagihan · Pengumuman · Pengaturan · Cetak tagihan · Rapor cetak
**Educator:** Dasbor · Kelas saya · Isi absensi · Input nilai · Materi · Pengumuman · Pengaturan
**Siswa:** Dasbor · Jadwal saya · Hasil saya · Materi · Kehadiran · Biaya saya (+ cetak) · Pengumuman · Pengaturan
**Orang tua:** Dasbor (pilih anak) · Anak saya (+ rapor) · Hasil · Kehadiran · Kelas · Biaya (+ cetak) · Pengumuman · Pengaturan

## C. Perilaku yang tidak boleh berubah
`[x]` = teruji penuh, `[~]` = sebagian (keterangan di baris), `[ ]` = belum. Pengujian T6 memakai browser pada backend `edu_redesign_test`, tanpa kesalahan konsol.
- [~] Masuk dengan akun demo, keluar, dan halaman terproteksi berfungsi. *T8: keluar kembali ke `/login`; membuka `/students` tanpa token dialihkan ke `/login`; keempat akun demo (token dari API login) memuat semua halaman menunya tanpa kesalahan. Belum: mengetik formulir masuk satu per satu.*
- [x] Siswa: tambah, ubah, nonaktifkan/aktifkan, hapus (dengan konfirmasi), cari, urut, halaman, impor CSV, rapor. *Teruji (T6 + T8): tambah, ubah, nonaktifkan, aktifkan, cari, rapor; T8: urut (naik/turun), halaman (1–10, 11–13 dari 13, Sebelumnya/Berikutnya), keadaan kosong ("Tidak ada yang cocok" + Hapus filter), impor berkas CSV (10 masuk, 1 baris tanpa email valid ditolak dengan alasan). Catatan: "hapus" untuk siswa adalah nonaktifkan.*
- [x] Pendidik dan orang tua: tambah, ubah, hapus. *Teruji (T6). Pendidik: hapus = nonaktif (muncul tombol Aktifkan kembali); orang tua: hapus sungguhan.*
- [~] Kelas: tambah, ubah, hapus; tampilan kartu dan jadwal mingguan; warna kelas dari data tetap dipakai. *Teruji (T6): tambah, ubah, hapus, kartu, warna `--t` dari data. Belum: jadwal mingguan setelah menambah kelas.*
- [x] Pendaftaran 4 langkah sampai konfirmasi. *Teruji (T6): sampai toast "Pendaftaran dikonfirmasi".*
- [x] Absensi: pilih kelas/tanggal, ubah status per siswa, simpan. *Teruji (T6 + T8): pilih kelas, ganti tanggal, ubah status, simpan, riwayat. Catatan: tombol "tandai semua hadir" yang tertulis di daftar lama tidak ada di aplikasi (juga tidak ada di `main`), jadi bukan regresi.*
- [x] Nilai: buat penilaian, isi nilai dan catatan, simpan semua, terbitkan. *Teruji (T6 + T8): buat, isi nilai, simpan, terbitkan (konfeti); T8: catatan tersimpan dan terbaca di basis data.*
- [x] Hasil: siswa dan orang tua hanya melihat nilai yang sudah terbit. *Teruji (T8): nilai pada penilaian draf tidak muncul di `/grades` siswa (2 baris), muncul setelah diterbitkan (3 baris); halaman Hasil siswa hanya menampilkan baris bernilai.*
- [~] Materi: tambah (tautan/berkas/video), buka, hapus, cari. *Teruji (T6): tambah tautan, cari, hapus dengan konfirmasi; tombol buka tampil. Belum: berkas/video.*
- [x] Tagihan: buat, catat pembayaran (sebagian/penuh), cetak, hapus, filter status, ekspor CSV. *Teruji (T6 + T8): buat, bayar sebagian dan penuh (konfeti); T8: filter status (Belum lunas 2, Lunas 1, lainnya 0), ekspor CSV (4 baris, kepala kolom benar), halaman cetak tampil polos (latar putih, tanpa tombol saat cetak), hapus dengan konfirmasi (faktur lunas memang tidak bisa dihapus). Belum: dialog cetak sistem (`@media print` diperiksa dari kode).*
- [x] Pengumuman: buat/ubah/hapus dengan audiens; orang lain hanya melihat yang relevan. *Teruji (T6 + T8): buat, ubah, hapus; T8: pengumuman khusus pendidik/siswa/orang tua masing-masing hanya terlihat oleh peran itu.*
- [~] Pengaturan: profil, ganti kata sandi, data pusat bimbel (admin). *Teruji (T6): simpan profil, simpan data pusat, kata sandi salah ditolak. Belum: ganti kata sandi berhasil (sengaja tidak dicoba agar akun demo tetap bisa masuk).*
- [x] Notifikasi, ganti bahasa ID/EN, mode gelap, menu akun. *Teruji (T8, peran Siswa): panel notifikasi terbuka, bahasa berganti dan tersimpan (`ec_lang`), mode gelap menyala dan tersimpan (`ec_theme`), pil peran membuka Pengaturan, keluar berfungsi.*
- [x] Setiap peran hanya melihat menu dan data perannya. *Teruji (T7): menu Educator 7 item, Siswa 8, Orang tua 8, Admin 13, sesuai peran. Catatan: API `/invoices` dan `/students` membalas 200 untuk Educator (perilaku backend yang ada, bukan bagian redesign).*

## D. Tampilan dan kualitas
- [x] Tidak ada teks meluber, terpotong, atau menimpa di desktop maupun HP (teks Indonesia lebih panjang). *Teruji (T8): 13 halaman admin × terang/gelap × 375 px dalam bahasa Indonesia: tanpa gulir horizontal, tanpa elemen keluar bingkai, tanpa teks terpotong; desktop: 13 halaman tanpa gulir horizontal.*
- [x] Teks minimal 12 px; kontras teks utama dan redup minimal AA (4,5:1). *Teruji (T7): pemindaian otomatis di browser, 4 peran, semua halaman menu, terang+ID dan gelap+EN, lebar HP (admin: 7 halaman): tidak ada teks < 12 px; tidak ada teks di bawah 4,5:1 (teks di atas gradien/foto dikecualikan dari hitungan otomatis).*
- [x] Mode gelap: tidak ada elemen yang tetap terang atau tak terbaca. *Teruji (T7): keempat peran, semua halaman menu masing-masing, kontras AA dan teks ≥ 12 px lulus (terang+ID dan gelap+EN, lebar HP), tanpa gulir horizontal.*
- [~] Keadaan memuat, kosong, dan gagal tampil benar. *Teruji (T8): kosong (hasil cari) dan gagal (API dialihkan ke port mati: kartu "Gagal memuat" + tombol Coba lagi tampil). Belum: keadaan memuat (kerangka) tidak sempat ditangkap; komponennya ada. Catatan: di mode dev, kegagalan jaringan memunculkan overlay "Uncaught runtime errors" CRA (tidak muncul di build produksi).*
- [x] HP: tabel menjadi kartu dengan label; bilah bawah dan menu geser berfungsi. *T7: label `data-label` pada sel. T8: bilah bawah tampil, menu geser terbuka (lebar 256 px, 8 tautan Siswa) dan menutup setelah memilih halaman.*
- [x] Fokus keyboard terlihat; semua tombol bisa dicapai dengan Tab; dialog bisa ditutup dengan Esc. *Teruji (T7 + T8): cincin fokus 2,4 px tampil setelah Tab; 26 kontrol interaktif di halaman Tagihan semua punya `tabindex ≥ 0` dan nama aksesibel; dialog tutup dengan Esc.*
- [x] Gerak: saklar Hemat dan `prefers-reduced-motion` mematikan animasi. *T7: ditemukan gelembung latar masih bergerak di mode Hemat; diperbaiki di `theme.css`, kini 0 animasi berulang.*
- [~] Cetak tagihan dan rapor tetap polos (tanpa bayangan/gradien/efek 3D). *Teruji (T7): lembar tagihan dan rapor tampil terang polos (latar putih, teks ≥ 12 px) walau tema pengguna gelap. Belum: pratinjau dialog cetak sebenarnya (aturan `@media print` sudah ada).*
- [x] Kredit NobleDev terlihat. *T7: tampil di desktop dan HP pada 12 px, disembunyikan saat cetak.*

## E. Teknis
- [x] `$env:CI = "true"; yarn build` lulus tanpa peringatan. *T8: `CI=true yarn build` → "Compiled successfully", tanpa peringatan ESLint.*
- [x] Konsol browser tanpa kesalahan saat mengklik seluruh halaman. *Teruji (T8): berpindah ke semua halaman menu Admin (13), Educator (7), Siswa (8), Orang tua (8): nol `console.error`/`error` window.*
- [x] `data-testid` tidak berubah atau hilang. *T7: diff terhadap `redesign/clay` hanya menyentuh kelas font pada baris yang memuatnya; nilai testid sama.*
- [x] Tidak ada perubahan di `backend/`. *T7: `git diff redesign/clay -- backend` kosong.*
- [x] Tidak ada perubahan di `main`. *T7: `main` = origin/main = f97a633.*
