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
- [ ] Masuk dengan akun demo, keluar, dan halaman terproteksi berfungsi.
- [~] Siswa: tambah, ubah, nonaktifkan/aktifkan, hapus (dengan konfirmasi), cari, urut, halaman, impor CSV, rapor. *Teruji (T6): tambah, ubah, nonaktifkan, aktifkan kembali, cari, dialog impor terbuka, rapor terbuka dari palet. Belum: urut, halaman, impor berkas CSV. Catatan: "hapus" untuk siswa adalah nonaktifkan, tidak ada hapus permanen.*
- [x] Pendidik dan orang tua: tambah, ubah, hapus. *Teruji (T6). Pendidik: hapus = nonaktif (muncul tombol Aktifkan kembali); orang tua: hapus sungguhan.*
- [~] Kelas: tambah, ubah, hapus; tampilan kartu dan jadwal mingguan; warna kelas dari data tetap dipakai. *Teruji (T6): tambah, ubah, hapus, kartu, warna `--t` dari data. Belum: jadwal mingguan setelah menambah kelas.*
- [x] Pendaftaran 4 langkah sampai konfirmasi. *Teruji (T6): sampai toast "Pendaftaran dikonfirmasi".*
- [~] Absensi: pilih kelas/tanggal, ubah status per siswa, tandai semua hadir, simpan. *Teruji (T6): pilih kelas, ubah status, simpan, riwayat tampil. Belum: ganti tanggal, tandai semua hadir.*
- [~] Nilai: buat penilaian, isi nilai dan catatan, simpan semua, terbitkan. *Teruji (T6): buat, isi nilai, simpan, terbitkan (konfeti muncul). Belum: kolom catatan.*
- [ ] Hasil: siswa dan orang tua hanya melihat nilai yang sudah terbit.
- [~] Materi: tambah (tautan/berkas/video), buka, hapus, cari. *Teruji (T6): tambah tautan, cari, hapus dengan konfirmasi; tombol buka tampil. Belum: berkas/video.*
- [~] Tagihan: buat, catat pembayaran (sebagian/penuh), cetak, hapus, filter status, ekspor CSV. *Teruji (T6): buat, bayar sebagian (status Sebagian, tanpa konfeti), bayar sisanya (Lunas, konfeti). Belum: cetak, hapus, filter, ekspor.*
- [~] Pengumuman: buat/ubah/hapus dengan audiens; orang lain hanya melihat yang relevan. *Teruji (T6): buat, ubah, hapus dengan konfirmasi. Belum: audiens dan tampilan peran lain.*
- [~] Pengaturan: profil, ganti kata sandi, data pusat bimbel (admin). *Teruji (T6): simpan profil, simpan data pusat, kata sandi salah ditolak. Belum: ganti kata sandi berhasil (sengaja tidak dicoba agar akun demo tetap bisa masuk).*
- [ ] Notifikasi, ganti bahasa ID/EN, mode gelap, menu akun.
- [x] Setiap peran hanya melihat menu dan data perannya. *Teruji (T7): menu Educator 7 item, Siswa 8, Orang tua 8, Admin 13, sesuai peran. Catatan: API `/invoices` dan `/students` membalas 200 untuk Educator (perilaku backend yang ada, bukan bagian redesign).*

## D. Tampilan dan kualitas
- [ ] Tidak ada teks meluber, terpotong, atau menimpa di desktop maupun HP (teks Indonesia lebih panjang).
- [x] Teks minimal 12 px; kontras teks utama dan redup minimal AA (4,5:1). *Teruji (T7): pemindaian otomatis di browser, 4 peran, semua halaman menu, terang+ID dan gelap+EN, lebar HP (admin: 7 halaman): tidak ada teks < 12 px; tidak ada teks di bawah 4,5:1 (teks di atas gradien/foto dikecualikan dari hitungan otomatis).*
- [x] Mode gelap: tidak ada elemen yang tetap terang atau tak terbaca. *Teruji (T7): keempat peran, semua halaman menu masing-masing, kontras AA dan teks ≥ 12 px lulus (terang+ID dan gelap+EN, lebar HP), tanpa gulir horizontal.*
- [ ] Keadaan memuat, kosong, dan gagal tampil benar.
- [~] HP: tabel menjadi kartu dengan label; bilah bawah dan menu geser berfungsi. *T7: tabel Siswa memberi label `data-label` pada sel (18), bilah bawah tampil di lebar HP. Belum: menu geser.*
- [~] Fokus keyboard terlihat; semua tombol bisa dicapai dengan Tab; dialog bisa ditutup dengan Esc. *Teruji (T7): dialog Tambah Siswa tertutup dengan Esc; aturan `:focus-visible` ada. Belum: penelusuran Tab menyeluruh.*
- [x] Gerak: saklar Hemat dan `prefers-reduced-motion` mematikan animasi. *T7: ditemukan gelembung latar masih bergerak di mode Hemat; diperbaiki di `theme.css`, kini 0 animasi berulang.*
- [~] Cetak tagihan dan rapor tetap polos (tanpa bayangan/gradien/efek 3D). *Teruji (T7): lembar tagihan dan rapor tampil terang polos (latar putih, teks ≥ 12 px) walau tema pengguna gelap. Belum: pratinjau dialog cetak sebenarnya (aturan `@media print` sudah ada).*
- [x] Kredit NobleDev terlihat. *T7: tampil di desktop dan HP pada 12 px, disembunyikan saat cetak.*

## E. Teknis
- [x] `$env:CI = "true"; yarn build` lulus tanpa peringatan. *T7: lulus sebelum perbaikan gerak; ulangi di Tahap 8.*
- [ ] Konsol browser tanpa kesalahan saat mengklik seluruh halaman.
- [x] `data-testid` tidak berubah atau hilang. *T7: diff terhadap `redesign/clay` hanya menyentuh kelas font pada baris yang memuatnya; nilai testid sama.*
- [x] Tidak ada perubahan di `backend/`. *T7: `git diff redesign/clay -- backend` kosong.*
- [x] Tidak ada perubahan di `main`. *T7: `main` = origin/main = f97a633.*
