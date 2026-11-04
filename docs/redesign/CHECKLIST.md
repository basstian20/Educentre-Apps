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
- [ ] Masuk dengan akun demo, keluar, dan halaman terproteksi berfungsi.
- [ ] Siswa: tambah, ubah, nonaktifkan/aktifkan, hapus (dengan konfirmasi), cari, urut, halaman, impor CSV, rapor.
- [ ] Pendidik dan orang tua: tambah, ubah, hapus.
- [ ] Kelas: tambah, ubah, hapus; tampilan kartu dan jadwal mingguan; warna kelas dari data tetap dipakai.
- [ ] Pendaftaran 4 langkah sampai konfirmasi.
- [ ] Absensi: pilih kelas/tanggal, ubah status per siswa, tandai semua hadir, simpan.
- [ ] Nilai: buat penilaian, isi nilai dan catatan, simpan semua, terbitkan.
- [ ] Hasil: siswa dan orang tua hanya melihat nilai yang sudah terbit.
- [ ] Materi: tambah (tautan/berkas/video), buka, hapus, cari.
- [ ] Tagihan: buat, catat pembayaran (sebagian/penuh), cetak, hapus, filter status, ekspor CSV.
- [ ] Pengumuman: buat/ubah/hapus dengan audiens; orang lain hanya melihat yang relevan.
- [ ] Pengaturan: profil, ganti kata sandi, data pusat bimbel (admin).
- [ ] Notifikasi, ganti bahasa ID/EN, mode gelap, menu akun.
- [ ] Setiap peran hanya melihat menu dan data perannya.

## D. Tampilan dan kualitas
- [ ] Tidak ada teks meluber, terpotong, atau menimpa di desktop maupun HP (teks Indonesia lebih panjang).
- [ ] Teks minimal 12 px; kontras teks utama dan redup minimal AA (4,5:1).
- [ ] Mode gelap: tidak ada elemen yang tetap terang atau tak terbaca.
- [ ] Keadaan memuat, kosong, dan gagal tampil benar.
- [ ] HP: tabel menjadi kartu dengan label; bilah bawah dan menu geser berfungsi.
- [ ] Fokus keyboard terlihat; semua tombol bisa dicapai dengan Tab; dialog bisa ditutup dengan Esc.
- [ ] Gerak: saklar Hemat dan `prefers-reduced-motion` mematikan animasi.
- [ ] Cetak tagihan dan rapor tetap polos (tanpa bayangan/gradien/efek 3D).
- [ ] Kredit NobleDev terlihat.

## E. Teknis
- [ ] `$env:CI = "true"; yarn build` lulus tanpa peringatan.
- [ ] Konsol browser tanpa kesalahan saat mengklik seluruh halaman.
- [ ] `data-testid` tidak berubah atau hilang.
- [ ] Tidak ada perubahan di `backend/`.
- [ ] Tidak ada perubahan di `main`.
