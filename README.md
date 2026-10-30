### Panduan Kolaborasi & Menjalankan Proyek RupaRuang ERP

### 1. Tahap Persiapan Awal
Pastikan kamu sudah terdaftar sebagai kolaborator di repository GitHub proyek ini

### 2. Langkah-Langkah di Laptop Masing-Masing
1. **Unduh Proyek (Clone) untuk Pertama Kali:**
Buka terminal/VS Code di laptopmu, lalu ketik perintah ini untuk mendownload repositori:
```bash
git clone <link_repository_github>
```
*Ganti `<link_repository_github>` dengan link repository GitHub proyek kita.*

2. **Masuk ke Folder Proyek:**
```bash
cd ruparuang-erp
```

3. **Install Dependensi:**
Unduh semua modul dan *package* yang dibutuhkan proyek dengan perintah:
```bash
npm install
```

4. **Konfigurasi Database:**
* Minta file `.env` secara personal.
* Letakkan file `.env` tersebut di dalam folder utama (*root directory*) proyekmu agar bisa terhubung ke database Supabase pusat.

5. **Sinkronisasi Database:**
Hubungkan skema database ke environment lokalmu dengan menjalankan:
```bash
npx prisma db push
```

6. **Jalankan Server Lokal:**
Untuk mulai menulis kode dan melihat hasil perubahan secara *real-time* di browser, jalankan:
```bash
npm run dev
```

Buka browser dan akses alamat `http://localhost:3000`.

### 3. Cara Mengirim Perubahan (Jika Sudah Selesai Mengoding)
Jika kamu sudah selesai mengerjakan bagianmu dan ingin mengirimkan pembaruan kode ke GitHub agar tergabung dengan sistem utama, jalankan urutan perintah ini di terminal:
```bash
git add .
git commit -m "Tulis pesan singkat apa yang kamu kerjakan di sini"
git push origin main
```
