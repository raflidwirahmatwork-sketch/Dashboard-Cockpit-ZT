# Remix: ZT Cockpit Dashboard Rev02

Aplikasi dashboard eksekutif korporat untuk memantau dan memperbarui program strategis, laporan eksekutif, dokumen cloud, serta riwayat log rapat (Minutes of Meeting / MoM). 

Aplikasi ini menggunakan teknologi modern dengan **React 19**, **Vite**, **TypeScript**, **Tailwind CSS**, **Recharts**, dan **Motion** untuk animasi transisi yang mulus.

---

## 📋 Prasyarat (Prerequisites)

Sebelum menginstal, pastikan Anda telah memasang:
- **Node.js** (Sangat direkomendasikan versi 18 atau lebih baru)
- **npm** (biasanya otomatis terpasang dengan Node.js) atau **bun** / **yarn**

---

## 🛠️ Cara Instalasi

Ikuti langkah-langkah di bawah ini untuk menyiapkan proyek di komputer lokal Anda:

1. **Unduh / Ekstrak Proyek**
   Ekstrak file ZIP proyek ini ke dalam direktori kerja Anda.

2. **Masuk ke Direktori Proyek**
   Buka terminal/command prompt dan masuk ke folder proyek:
   ```bash
   cd nama-folder-proyek
   ```

3. **Instal Dependensi**
   Jalankan perintah berikut untuk mengunduh dan menginstal semua paket pustaka yang dibutuhkan:
   ```bash
   npm install
   ```

---

## 🔑 Konfigurasi Environment Variables

Aplikasi ini menggunakan environment variables untuk mengonfigurasi API eksternal dan URL sistem.

1. **Salin File Contoh Environment**
   Salin file `.env.example` menjadi file `.env` di root direktori proyek Anda:
   ```bash
   cp .env.example .env
   ```

2. **Isi Nilai Environment di File `.env`**
   Buka file `.env` yang baru dibuat dengan teks editor Anda, lalu isi variabel berikut:

   ```env
   # Kunci API untuk Google Gemini AI (Opsional untuk server-side AI)
   GEMINI_API_KEY="ISI_DENGAN_GEMINI_API_KEY_ANDA"

   # URL di mana aplikasi ini dijalankan/dihosting
   APP_URL="http://localhost:3000"
   ```

> ⚠️ **Penting**: Jangan pernah membagikan atau mempublikasikan kunci `GEMINI_API_KEY` Anda ke repositori publik seperti GitHub.

---

## 🚀 Cara Menjalankan Server Lokal

Setelah menginstal dependensi dan mengonfigurasi variabel lingkungan, jalankan perintah berikut untuk memulai server pengembangan lokal:

```bash
npm run dev
```

Server pengembangan akan aktif pada:
👉 **[http://localhost:3000](http://localhost:3000)**

Buka browser Anda dan kunjungi URL tersebut untuk melihat dashboard interaktif.

---

## 📦 Perintah Tambahan (Scripts)

Di dalam file `package.json`, tersedia beberapa perintah pendukung yang dapat Anda gunakan:

- **Membangun Aplikasi Produksi**:
  ```bash
  npm run build
  ```
  Perintah ini akan mengompilasi dan mengoptimalkan aplikasi menjadi berkas statis siap pakai di dalam folder `dist/`.

- **Pratinjau Hasil Build**:
  ```bash
  npm run preview
  ```
  Digunakan untuk menjalankan server lokal sederhana guna mempratinjau hasil build produksi dari folder `dist/`.

- **Pengecekan Tipe Data (Linting)**:
  ```bash
  npm run lint
  ```
  Melakukan pengecekan statis terhadap kesalahan tipe TypeScript menggunakan `tsc --noEmit`.

---

## 💡 Ringkasan Hak Akses Pengguna (Role-based Access)

Sistem ini mendukung 3 peran pengguna yang dapat diuji dari layar login:
1. **Admin**: Memiliki kontrol penuh untuk menambah, mengedit, melihat detail, dan menghapus program/dokumen/log.
2. **Team Internal**: Memiliki akses untuk membuat dan mengedit program, melihat detail, dan menyusun Minutes of Meeting (MoM).
3. **Viewer (Direksi)**: Memiliki hak akses khusus membaca (**Read-Only**). Sekarang sudah dioptimalkan agar dapat **melihat detail lengkap program & status roadmap**, tetapi **tidak dapat** melakukan modifikasi, edit, tambah, ataupun hapus data.
