# Rencana Pengembangan Bertahap EduCentre

## Context
EduCentre (FastAPI + MongoDB + React/Tailwind/shadcn) saat ini berupa demo portofolio NobleDev untuk pemilik bimbel: auth 4 peran, CRUD siswa/pengajar/orang tua/kelas, pendaftaran, absensi, nilai, materi, invoice (pembayaran dicatat manual), pengumuman, laporan, notifikasi in-app, cetak invoice/rapor, impor CSV, dark mode, i18n ID/EN.
Tujuan: menjadikannya sistem manajemen bimbel yang lengkap dan layak produksi, dikerjakan bertahap agar tiap fase menghasilkan nilai yang bisa didemokan dan tidak merusak yang sudah ada.

Kendala/temuan kode: `backend/server.py` satu file 1.420 baris; tes backend hanya `backend/tests/test_educentre.py`; tidak ada rate limiting, reset password, soft delete; semua DELETE permanen; file lokal (`/materials/upload`, `/files/{id}`); single-tenant; notifikasi hanya `GET /notifications` yang dihitung on-the-fly.

Prinsip (dari `PRODUCT.md`): tiap peran hanya melihat yang relevan, phone-first, Bahasa Indonesia utama, data demo realistis, tugas cepat > banyak fitur, kredit NobleDev tetap tampil.

## Aturan pembaruan rencana
Setiap satu fungsi (F0-x) selesai dan di-merge, file ini diperbarui di tabel "Status per fase" dan "Status fungsi" (tanggal, hash merge, ringkasan verifikasi, catatan/risiko). Setiap satu fase selesai, status fase diubah ke "Selesai" dan rinciannya difinalkan sebelum fase berikutnya dimulai.

## Status per fase (diperbarui 2026-11-05)
| Fase | Isi | Status |
|---|---|---|
| 0 | Fondasi teknis | **Berjalan — 4 dari 10 fungsi selesai** |
| 1 | Uang & penagihan | Belum mulai |
| 2 | Komunikasi | Belum mulai |
| 3 | Akademik | Belum mulai |
| 4 | Absensi, jadwal, SDM | Belum mulai |
| 5 | Pengalaman mobile (PWA) | Belum mulai |
| 6 | Pertumbuhan & skala | Belum mulai |
| 7 | AI (opsional) | Belum mulai |

Catatan lintas-fase: **`main` sudah di-push ke `origin` pada 2026-11-05 (`f23f295`, berisi F0-1 s.d. F0-4).** CI GitHub hijau (backend pyflakes+pytest dan build frontend). Backend Railway otomatis redeploy: `/openapi.json` production sudah memuat endpoint baru dan login akun demo admin berhasil (HTTP 200, berarti `JWT_SECRET` ada di Railway). Masih perlu dipastikan di Railway: `TRUST_PROXY=true` (tanpa itu semua pengguna dianggap satu IP oleh penguncian login), konfigurasi email (`MAIL_PROVIDER=smtp`, `SMTP_*`, `MAIL_FROM`, `FRONTEND_URL`) agar lupa password mengirim email sungguhan, dan `PASSWORD_RESET_DEBUG_LINK` harus mati. Setiap push ke `main` berikutnya otomatis ter-deploy, jadi tetap butuh persetujuan pengguna.

## Fase 0 — Fondasi teknis: status per fungsi
Wajib duluan karena fase lain bergantung padanya. Satu branch per fungsi, merge ke `main` setelah diperiksa.

| # | Branch | Isi | Status |
|---|---|---|---|
| F0-1 | `refactor/split-routers` | Pecah `server.py` → `core.py` + 18 router | **Selesai** — merge `c2665cd` |
| F0-2 | `chore/test-ci` | DB uji terpisah, snapshot API, smoke per peran, GitHub Actions | **Selesai** — merge `455fd64` |
| F0-3 | `feat/login-rate-limit` | Kunci login setelah gagal berulang + admin unlock | **Selesai** — merge `6ab9373` |
| F0-4 | `feat/password-reset` | Lupa/reset password via token email | **Selesai** — merge `f23f295` |
| F0-5 | `feat/soft-delete` | Soft delete + tempat sampah admin + counter nomor invoice | Belum mulai |
| F0-6 | `feat/audit-log` | Audit log + halaman viewer admin | Belum mulai |
| F0-7 | `refactor/storage-service` | Abstraksi penyimpanan file (Mongo → S3/R2) | Belum mulai |
| F0-8 | `perf/pagination-indexes` | Paginasi sisi server + indeks Mongo | Belum mulai |
| F0-9 | `chore/observability` | Log terstruktur, health check, Sentry | Belum mulai |
| F0-10 | `test/e2e-playwright` | Tes E2E frontend di CI | Belum mulai |

### Hasil F0-1 s.d. F0-3 (ringkas)
- **F0-1:** route/OpenAPI identik (63 route), 129 respons GET empat peran identik dengan versi lama, 47 pytest lulus.
- **F0-2:** `backend/tests/conftest.py` menjalankan server sendiri di DB `edu_test` (dihapus setelah tes); `test_api_surface.py` (snapshot 59 endpoint + akses per peran); `.github/workflows/ci.yml` (pyflakes+pytest dengan mongo:7, build frontend `CI=true`); `backend/.env.example`. CI GitHub belum pernah berjalan (belum di-push). Data uji dari tes lama sudah dibersihkan dari `edu_db`.
- **F0-3:** `backend/login_guard.py` (5 gagal/ip+email dan 20/email → kunci 15 menit, 429 + `Retry-After`, TTL index `login_attempts`), `GET/DELETE /auth/lockouts`, terjemahan pesan ID, 141 tes lulus, diuji di browser (EN & ID).

### F0-4 `feat/password-reset` — lupa/reset password
**Hasil (2026-11-05):** `mailer.py` (provider `console` default dan `smtp`), `password_reset.py`, `POST /auth/forgot-password` dan `/auth/reset-password`, koleksi `password_resets` (hash token, TTL index `purge_at`), halaman `ForgotPassword.jsx`/`ResetPassword.jsx` + `AuthLayout.jsx`, tautan di `Login.jsx`, teks ID/EN. 153 tes lulus (12 baru), pyflakes bersih, build strict sukses, alur lengkap diuji di browser (lupa → tautan mode demo → password tidak sama → simpan → login password baru; password lama ditolak). Penyimpangan dari rencana: provider `sendgrid` ditunda (tetap opsional di Fase 2); pembatalan sesi lama saat reset tidak dibuat karena JWT stateless (sesi aktif tetap berlaku sampai kedaluwarsa 12 jam) — dicatat sebagai pekerjaan lanjutan (versi token / `password_changed_at` di `get_current_user`). Variabel baru ada di `backend/.env.example`; untuk production wajib `MAIL_PROVIDER=smtp` + `SMTP_*` + `FRONTEND_URL`, dan `PASSWORD_RESET_DEBUG_LINK` harus mati.

Masalah: pengguna yang lupa password tidak punya jalan keluar selain admin; hanya `POST /auth/change-password` (butuh login) yang ada.
1. Backend: `POST /auth/forgot-password {email}` (selalu 200 dengan pesan generik agar keberadaan akun tidak bocor) dan `POST /auth/reset-password {token, new_password}`. Token acak `secrets.token_urlsafe(32)`; yang disimpan hanya hash SHA-256 di koleksi `password_resets` (`user_id`, `token_hash`, `expires_at` + TTL index, `used_at`). Kedaluwarsa 30 menit, sekali pakai, token lama pengguna itu dibatalkan saat token baru dibuat. Aturan password sama seperti `PasswordChange` (min. 6 karakter). Reset berhasil → bersihkan kunci login email tersebut (`login_guard.clear_email`).
2. Pembatasan: maks. 3 permintaan/jam per email+ip (pola `login_guard`), agar tidak jadi alat spam email.
3. Pengirim email: `backend/mailer.py` dengan provider `console` (default; hanya mencetak tautan ke log, aman untuk demo karena email demo `@educentre.id` palsu), `smtp`, dan `sendgrid` (opsional, bisa menyusul di Fase 2). Env: `MAIL_PROVIDER`, `MAIL_FROM`, `FRONTEND_URL` (dasar tautan), `PASSWORD_RESET_MINUTES`.
4. Frontend: tautan "Lupa kata sandi?" di `Login.jsx`; halaman `ForgotPassword.jsx` dan `ResetPassword.jsx` (rute `/reset-password?token=`); teks ID/EN di `lib/i18n.jsx`; terjemahan galat di `lib/api.js`.
5. Tes (`test_password_reset.py`): respons generik untuk email tidak dikenal, token sekali pakai, token kedaluwarsa (env durasi pendek di conftest), token palsu, password lemah, kunci login ikut terbuka, pembatasan permintaan. Snapshot API diperbarui.
Verifikasi: pytest hijau, uji browser alur lengkap (minta tautan → buka dari log → ganti password → login), `edu_db` tidak tersentuh. Dependensi: F0-3 (memakai `login_guard`).
Risiko: kebocoran token lewat log (mode `console` hanya untuk dev/demo, tidak pernah di production); butuh keputusan penyedia email untuk production.

### F0-5 `feat/soft-delete` — hapus lunak + tempat sampah
Keadaan sekarang: siswa dan pengajar sudah nonaktif (`status: inactive`, bukan hapus), tetapi `DELETE` untuk orang tua (juga menghapus akunnya), pengumuman, materi (+file), dan invoice memakai `delete_one` permanen. Nomor invoice dihitung dari `count_documents` (`core._gen_invoice_number`), sehingga menghapus invoice di tengah deret bisa membuat nomor bentrok dengan indeks unik (terjadi saat pembersihan data uji).
1. Tambah `deleted_at`/`deleted_by` pada orang tua, pengumuman, materi, invoice; helper `core.not_deleted()` dipakai semua query daftar/detail/dasbor/notifikasi agar yang terhapus tak muncul. Orang tua: nonaktifkan akun pengguna, jangan hapus. Materi: file tetap sampai purge.
2. Admin: `GET /trash?type=` dan `POST /trash/{type}/{id}/restore`; `DELETE /trash/{type}/{id}` (purge permanen, hanya untuk yang sudah di tempat sampah dan tanpa dependensi).
3. Ganti penomoran invoice ke koleksi `counters` dengan `find_one_and_update($inc)` (atomik, tidak turun saat dihapus); inisialisasi counter dari nomor tertinggi yang ada.
4. Frontend: halaman tempat sampah admin (tab di Pengaturan) dengan tombol "Pulihkan"; konfirmasi hapus memakai teks "dipindahkan ke tempat sampah".
5. Tes: hapus → hilang dari daftar → muncul di tempat sampah → pulihkan → muncul lagi; invoice berpembayaran tetap tidak boleh dihapus; nomor invoice tidak bentrok setelah hapus.
Verifikasi: pytest + uji browser; migrasi data tidak diperlukan (field baru opsional). Dependensi: F0-2. Risiko: lupa menyaring `deleted_at` di satu query → data "hantu"; ditutup dengan tes per router.

### F0-6 `feat/audit-log` — jejak audit
1. Koleksi `audit_logs`: `id`, `at`, `actor_id`, `actor_name`, `actor_role`, `action` (create/update/delete/restore/login_success/login_locked/password_reset/...), `entity`, `entity_id`, `summary`, `changes` (sebelum/sesudah hanya untuk field yang berubah; password, hash, token disamarkan), `ip`. Indeks `(at desc)` dan `(entity, entity_id)`.
2. Pencatatan eksplisit lewat helper `audit.record(...)` di endpoint tulis (bukan middleware buta, karena entitas dan diff hanya diketahui di route), plus peristiwa auth dari `login_guard` dan F0-4. Kegagalan mencatat tidak boleh menggagalkan permintaan (log peringatan).
3. `GET /audit-logs` (admin) dengan filter `entity`, `actor_id`, `action`, rentang tanggal, paginasi `limit/skip` → `{items,total}`.
4. Frontend: halaman `AuditLog.jsx` (admin saja; menu di sidebar) berisi tabel + filter, label ID/EN, tampilan perbandingan perubahan.
5. Tes: tiap jenis aksi tercatat, field sensitif tersamar, non-admin ditolak (403), filter dan paginasi.
Dependensi: F0-5 (aksi restore/purge). Risiko: pertumbuhan koleksi — ditutup indeks + opsi retensi (TTL lewat env, default mati).

### F0-7 `refactor/storage-service` — abstraksi penyimpanan file
Keadaan sekarang: unggahan materi disimpan sebagai bytes di MongoDB (`material_files`, maks. 5 MB) dan disajikan oleh `GET /files/{id}` dengan pemeriksaan izin di `routers/uploads.py`.
1. `backend/services/storage.py`: antarmuka `put()/get()/delete()` dengan backend `mongo` (default = perilaku sekarang, tanpa migrasi) dan `s3` (S3/R2 via `boto3`, sudah ada di `requirements.txt`; env `STORAGE_BACKEND`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`). Kontrak API (`/materials/upload`, `/files/{id}`, kolom `file_url`) tidak berubah; pemeriksaan izin tetap di API (file disajikan lewat streaming, bukan URL publik).
2. Skrip idempoten `backend/scripts/migrate_files_to_s3.py` untuk memindahkan file lama; dapat diulang dan punya `--dry-run`.
3. Tes memakai backend memori palsu; satu tes integrasi S3 (moto) bila tersedia.
Verifikasi: tes unggah/unduh/hapus identik pada kedua backend; ukuran dokumen Mongo turun setelah migrasi uji. Risiko: butuh akun S3/R2 + kunci (keputusan pengguna); untuk demo cukup tetap `mongo`.

### F0-8 `perf/pagination-indexes` — paginasi sisi server + indeks
Keadaan sekarang: hampir semua daftar memakai `.to_list(200/500/2000)` (siswa, pengajar, kelas, pendaftaran, invoice, pembayaran, penilaian, nilai, materi); dasbor admin memuat semua invoice dan pembayaran (hingga 2000) ke memori; hanya presensi yang sudah berpaginasi (`{items,total,limit,skip}`). Data sampel 6 bulan (`seed_6bulan.py`) cukup besar untuk mengukur.
1. Helper `core.paginate()`; endpoint besar (siswa, invoice, pembayaran, pendaftaran, nilai) menerima `limit/skip` opsional dan mengembalikan `{items,total,limit,skip}` hanya bila diminta (`paged=true`), agar kontrak lama tidak rusak; frontend tabel besar (`Students`, `Invoices`, `Attendance`) beralih ke paginasi server lewat `TableTools.jsx`.
2. Dasbor admin: ganti pemuatan penuh dengan agregasi Mongo (`$group`) untuk pendapatan bulan ini dan tunggakan.
3. Indeks baru di startup: `invoices(student_id, created_at)`, `payments(invoice_id, paid_at)`, `grades(assessment_id, student_id)`, `assessments(class_id)`, `materials(class_id)`, `announcements(created_at)`, `enrollments(class_id, status)`.
4. Ukur sebelum/sesudah (waktu respons daftar dan dasbor pada data 6 bulan) dan catat di sini.
Dependensi: F0-5 (filter `deleted_at` ikut di query). Risiko: perubahan bentuk respons — ditutup opt-in `paged` + snapshot API.

### F0-9 `chore/observability` — log terstruktur, health check, Sentry
1. Middleware ID permintaan + log JSON (metode, path, status, durasi, `user_id`, `request_id`); level lewat env `LOG_LEVEL`.
2. `GET /api/health` (cek koneksi DB) untuk health check Railway; handler galat global dengan format JSON konsisten.
3. Sentry opsional (`SENTRY_DSN`; `sentry-sdk[fastapi]`) dengan penyamaran PII (email, password, token); Sentry frontend opsional.
Verifikasi: tes untuk header `X-Request-ID` dan `/health`; tanpa DSN aplikasi berjalan normal. Risiko: kecil; semua opsional via env.

### F0-10 `test/e2e-playwright` — tes E2E frontend
Playwright untuk alur kritis: login (termasuk kunci), absensi pengajar, buat invoice + catat pembayaran, ganti password (F0-4). Berjalan di CI sebagai job ketiga melawan backend (service `mongo:7`, DB uji) + build frontend. Dependensi: F0-2 dan F0-4. Risiko: tes E2E rentan flakiness; gunakan `data-testid` yang sudah ada.

### Urutan & ketergantungan Fase 0
F0-4 → F0-5 → F0-6 → F0-7 (independen, bisa paralel dengan F0-6) → F0-8 → F0-9 → F0-10. Fase 1 dimulai setelah F0-5 dan F0-6 minimal (soft delete + audit dibutuhkan keuangan); F0-7 s.d. F0-10 boleh berjalan paralel dengan Fase 1 bila diinginkan.

## Fase 1 — Uang & penagihan (2–3 minggu) — dampak jual tertinggi
- Model: tagihan berulang (`billing_schedules`), diskon/beasiswa/voucher, biaya pendaftaran, denda, pembayaran parsial/cicilan (saldo sisa dari `PaymentRecord`), kredit saldo & refund.
- Job terjadwal (APScheduler) generate invoice bulanan dari `fee_amount` kelas + pengingat H-3/H0/H+3.
- Pembayaran gabungan orang tua untuk beberapa anak.
- Payment gateway (Midtrans/Xendit, QRIS) + webhook yang idempoten; mode sandbox untuk demo.
- Laporan keuangan: piutang (aging), arus kas, pendapatan per kelas/pengajar, pengeluaran & laba-rugi, rekonsiliasi impor CSV mutasi bank.
- Ekspor Excel/PDF untuk invoice, laporan, rapor (util bersama di `backend/services/export.py`; frontend pakai pola `PrintSheet.jsx`/`csv.js`).

## Fase 2 — Komunikasi (2 minggu)
- Layer notifikasi multi-kanal: in-app (tabel `notifications` persisten + tanda baca), email (SendGrid/SMTP), WhatsApp (provider API) dengan template yang bisa diatur admin dan preferensi per pengguna.
- Pemicu otomatis: absen, nilai terbit, invoice/jatuh tempo, materi baru, pengumuman.
- Pesan langsung pengajar↔orang tua (thread, lampiran) + survei kepuasan.
- Web push (PWA) menyusul di Fase 5.

## Fase 3 — Akademik (3 minggu)
- Tugas/PR dengan pengumpulan file & penilaian; rubrik dan bobot nilai per kelas; nilai akhir & ranking.
- Bank soal + ujian online (pilihan ganda, timer, nilai otomatis), try out UTBK.
- Rapor semester lengkap (catatan wali, capaian, tanda tangan digital) memperluas `GET /students/{sid}/report` dan `ReportCard.jsx`.
- Grafik perkembangan siswa, deteksi siswa berisiko (absensi/nilai turun) → peringatan ke admin & orang tua.
- Silabus, jurnal mengajar per sesi, sertifikat otomatis, kategori/tag/akses materi.

## Fase 4 — Absensi, jadwal, SDM (2–3 minggu)
- QR check-in siswa/pengajar; absensi pengajar; izin sakit via orang tua dengan lampiran.
- Deteksi bentrok jadwal ruangan/pengajar, kelas pengganti & pembatalan sesi, waiting list saat penuh, tautan kelas online (Zoom/Meet), sinkron iCal/Google Calendar, reservasi ruangan.
- Penggajian pengajar (honor per sesi dari absensi) + slip gaji PDF, cuti/izin, penilaian kinerja.
- RBAC lebih rinci: peran staf/kasir/wali kelas.

## Fase 5 — Pengalaman mobile (1–2 minggu)
- PWA (manifest, service worker, install prompt), absensi offline dengan antrean sinkron, web push.
- Pemilih anak untuk akun orang tua, foto profil, onboarding per peran, reset data demo, audit aksesibilitas ulang (kontras, keyboard, screen reader), pencarian global Ctrl+K (komponen `command` sudah ada).

## Fase 6 — Pertumbuhan & skala (3 minggu)
- CRM calon siswa (pipeline inquiry → trial → daftar), form pendaftaran online publik, kelas percobaan, referral, re-enrollment akhir periode, landing page otomatis.
- Dashboard retensi/churn, keterisian kelas, prediksi pendapatan, laporan terjadwal ke email pemilik.
- Multi-cabang: tambahkan `branch_id` ke semua koleksi + filter di dependency auth, laporan konsolidasi. Dikerjakan terakhir karena menyentuh seluruh skema.
- Inventaris & peminjaman.

## Fase 7 — AI (opsional, 2 minggu)
Ringkasan perkembangan siswa untuk rapor/pesan, generator soal dari materi, asisten tanya-jawab siswa, prediksi churn/tunggakan, draf pengumuman, impor cerdas dari Excel/foto. Memakai Claude API (model default terbaru), dengan batas biaya dan persetujuan manusia sebelum terkirim.

## Urutan & ketergantungan
F0 → F1 → F2 (butuh layer notifikasi untuk pengingat F1) → F3 → F4 → F5 → F6 → F7. Boleh paralel: F3 dan F4 setelah F2; F5 kapan saja setelah F0.
Kandidat sesi paralel (file tidak bertabrakan): Fase 3 (akademik) vs Fase 4 (jadwal/SDM) setelah router dipecah.

## Cara pengerjaan tiap fase
1. **Satu branch per fungsi** (bukan per fase), dibuat dari `main` terbaru dengan penamaan `feat/<fungsi>` (mis. `feat/recurring-invoice`, `feat/forgot-password`, `fix/...` / `refactor/...` bila sesuai). Fungsi baru di router/service baru, bukan menambah `server.py`.
   - Alur per fungsi: buat branch → bangun → tes otomatis (pytest/Playwright) + uji manual di app (4 peran, desktop & ponsel, dark mode) → build frontend tanpa warning → **baru merge ke `main`** setelah dinyatakan selesai, diperiksa, dan berjalan baik. Branch yang belum lolos pemeriksaan tidak digabung.
   - Merge ke `main` hanya atas persetujuan pengguna per fungsi; tidak ada push/merge otomatis. Commit kecil dan jelas (gaya `feat(scope): ...` seperti riwayat saat ini).
   - Fungsi yang saling bergantung digabung berurutan (mis. refactor router F0 lebih dulu); fungsi independen boleh dikerjakan paralel di branch masing-masing (sesi/worktree terpisah) selama tidak menyentuh file yang sama.
   - Hapus branch setelah merge; `main` selalu dalam keadaan bisa di-deploy.
2. Tes pytest + Playwright ditulis bersamaan; seed demo diperbarui agar demo tetap realistis.
3. Semua teks baru di `frontend/src/lib/i18n.jsx` (ID dulu, lalu EN); UI dicek di lebar ponsel dan dark mode.
4. Integrasi eksternal (gateway, WhatsApp, email) lewat env var + mode mock default agar demo jalan tanpa kunci.

## Verifikasi (tiap fase)
- `pytest backend/tests` hijau; CI hijau (build frontend tanpa warning exhaustive-deps).
- Jalankan app, login ke keempat peran (akun seed di `memory/PRD.md`), jalankan alur fitur baru end-to-end di desktop & ponsel, cek konsol & log kosong galat.
- Fase 1: simulasi webhook sandbox → invoice berubah status satu kali (idempoten). Fase 2: pesan terkirim di mode mock tercatat di log. Fase 4: absensi offline tersinkron setelah online.
- Regresi: halaman lama (siswa, kelas, absensi, nilai, invoice) tetap berfungsi setelah refactor Fase 0.

## Estimasi
Total ± 15–20 minggu satu pengembang; Fase 0–2 (± 5–7 minggu) sudah memberi produk yang layak dijual.
