# Redesign EduCentre: Clay Soft · Ocean Blue

Dokumen kerja untuk redesign. Rujukan desain: [`mockup-redesign/DESIGN.md`](../../mockup-redesign/DESIGN.md) dan mockup hidup `mockup-redesign/mockups/v8-font-kombinasi-lain.html` (tab 2). Daftar periksa: [`CHECKLIST.md`](CHECKLIST.md).

## Aturan main
1. **`main` tidak disentuh** sampai redesign selesai dan disetujui pemilik proyek. Situs demo (https://educentre-apps.vercel.app/) tetap tampilan lama dan menjadi pembanding "sebelum".
2. Semua pekerjaan ada di branch `redesign/clay` dan branch tahap di bawahnya (`redesign/clay-tN-*`), yang dibuat dari `redesign/clay`, bukan dari `main`.
3. Satu tahap pada satu waktu. Tiap tahap digabung ke `redesign/clay` hanya setelah disetujui.
4. Tidak ada perubahan backend dan tidak ada deploy produksi selama redesign.
5. Yang tidak berubah: fitur dan perilaku, data, teks bahasa, atribut `data-testid`, kredit NobleDev.

## Peta branch
```
main (tidak berubah)
 └── redesign/clay
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
Alur satu tahap: buat branch tahap dari `redesign/clay` → kerjakan → periksa dengan `CHECKLIST.md` → usulan perubahan (PR) ke `redesign/clay` → disetujui → digabung → branch tahap dihapus.

## Menjalankan pratinjau lokal
Pratinjau otomatis Vercel untuk branch kemungkinan tidak bisa login karena backend hanya mengizinkan `localhost:3000/3001` dan situs produksi. Karena itu peninjauan memakai pratinjau lokal.

**Penting, jangan menulis ke database demo.** `backend/.env` menunjuk ke database Atlas `edu_db`, yang kemungkinan sama dengan situs demo. Uji yang menambah atau mengubah data (tambah siswa, catat bayar, terbitkan nilai, dll.) harus memakai **database terpisah**:

```powershell
# 1) Backend lokal dengan database khusus redesign (nama DB ditimpa lewat variabel lingkungan)
cd backend
$env:DB_NAME = "edu_redesign_test"
..\venv\Scripts\python.exe -m uvicorn server:app --port 8000

# 2) Frontend lokal menunjuk ke backend lokal (tanpa mengubah file .env)
cd frontend
$env:REACT_APP_BACKEND_URL = "http://localhost:8000"
yarn start        # http://localhost:3000
```
Data contoh terisi otomatis saat backend pertama kali jalan. Akun demo: lihat `memory/test_credentials.md`.

## Pemeriksaan wajib sebelum tiap tahap digabung
- **Build ketat:** `$env:CI = "true"; yarn build` di `frontend/` harus lulus tanpa peringatan (Vercel menggagalkan build bila ada satu peringatan ESLint).
- Daftar periksa di `CHECKLIST.md` untuk keempat peran, ID/EN, terang/gelap, desktop/HP.
- `data-testid` tidak berubah: `git diff redesign/clay -- frontend/src | Select-String "data-testid"` tidak boleh menunjukkan baris `data-testid` yang dihapus atau diubah tanpa alasan.

## Mundur
Tiap tahap terpisah sehingga bisa dibatalkan sendiri (`git revert` pada penggabungan tahap itu). Penggabungan akhir ke `main` juga bisa dibalik dengan satu `git revert -m 1`.

## Pembanding "sebelum"
- Situs demo produksi (`main`) tetap tampilan lama selama redesign: https://educentre-apps.vercel.app/ (jangan dipakai untuk uji yang menulis data).
- Tangkapan layar layar masuk saat ini ada di `docs/redesign/before/` (desktop 1280×800 dan HP 390×844, diambil dengan Edge headless). Catatan: pada tangkapan HP kartu masuk tampak terpotong di sisi kanan; belum dipastikan apakah itu artefak tangkapan atau kekurangan tata letak lama. Cek ulang di Tahap 3.
- Tangkapan halaman yang butuh login (dasbor dst.) diambil dari `main` yang dijalankan lokal dengan database terpisah, sebelum Tahap 1 digabung.
