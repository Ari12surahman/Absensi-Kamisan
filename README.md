# 🕌 SalApp Asatidz - Portal Presensi & Pelaporan Kegiatan Asatidz Terpadu

**SalApp Asatidz** adalah aplikasi web presensi dan pelaporan kinerja divisi terintegrasi berbasis **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, dan **Google Sheets API**. Aplikasi ini dirancang khusus untuk kenyamanan para asatidz dan pengurus yayasan/pesantren dalam pencatatan kehadiran berbasis radius (geofencing) serta manajemen operasional secara real-time.

---

## ✨ Fitur Utama

### 📱 1. Portal Asatidz (Mobile-First Experience)
- **Presensi Hadir & Pulang Cerdas**:
  - Validasi koordinat GPS realtime via Haversine Formula (radius deteksi toleransi lokasi kegiatan).
  - Pilihan acara/kajian dinamis (Otomatis menyesuaikan status acara `Aktif`).
  - Unggah foto bukti kehadiran instan (otomatis konversi Base64 / Cloud image upload).
  - Tanda tangan digital interaktif di layar HP (HTML5 Canvas Signature).
- **Laporan Kinerja Divisi**:
  - Pelaporan kegiatan berkala per divisi (Madrasah, Tahfidz, Sarpras, Keuangan, Dakwah, dll).
  - Unggah dokumentasi foto kegiatan.
- **Dock Navigasi Mengambang ("Kece" Floating Dock)**:
  - Navigasi modern di bagian bawah layar ala iOS/Stitch UI untuk perpindahan cepat antara *Presensi*, *Laporan Divisi*, dan *Akses Admin*.

### 💻 2. Dashboard Admin Modern (Clean & Real-Time)
- **Bebas Menu Ganda**: Header atas disederhanakan secara elegan; navigasi desktop terpusat di sidebar kiri dan navigasi mobile di floating bottom bar.
- **Real-Time Data & Pagination**:
  - Ringkasan KPI: Total Presensi, Kehadiran Hari Ini, Total Laporan, dan Jumlah Divisi Aktif.
  - Tabel data presensi dan laporan dilengkapi pencarian, filter tanggal/divisi/acara, serta sistem **Pagination** sehingga tidak lag saat data bertambah ribuan baris.
- **Ekspor Data Rapi (No Corrupted Icons)**:
  - **Ekspor Excel (.xlsx)**: Menggunakan SheetJS dengan format tabel resmi dan kolom bersih (Nama, NIP/ID, Acara, Waktu, Lokasi, Status).
  - **Ekspor PDF Laporan Resmi**: Menggunakan jsPDF + AutoTable dengan header instansi yayasan dan penomoran otomatis.
- **Manajemen Acara & Divisi (CRUD)**:
  - Tambah, edit, dan hapus acara dengan pengaturan titik koordinat & toleransi radius (meter).
  - Tambah, edit, dan hapus divisi kerja serta deskripsi tupoksi.

---

## 🛠️ Arsitektur Teknologi

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Route Handlers)
- **UI Library**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: Lucide React & Google Material Symbols Outlined
- **Database Backend**:
  - **Google Sheets API v4**: Menghubungkan langsung ke spreadsheet operasional (`SHEET_ID: 1YC8IBmPgw7bFtJ7GVCZSaunQuD62hUg677S8pcOZHMs`).
  - **Dual Mode Fallback**: Dilengkapi mock in-memory database otomatis jika kredensial Google Service Account belum diisi (memudahkan deployment preview atau testing lokal tanpa hambatan).
- **Exporting**: SheetJS (`xlsx`) & `jspdf` / `jspdf-autotable`

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/Ari12surahman/Absensi-Kamisan.git
cd Absensi-Kamisan
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel konfigurasi di `.env.local`:
```env
# Spreadsheet ID
GOOGLE_SHEET_ID="1YC8IBmPgw7bFtJ7GVCZSaunQuD62hUg677S8pcOZHMs"

# Google Cloud Service Account (Opsional untuk integrasi Google Sheet langsung)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Dashboard Access
ADMIN_PASSWORD="admin"
```

> **Catatan**: Jika `GOOGLE_SERVICE_ACCOUNT_EMAIL` dibiarkan kosong, aplikasi otomatis beralih ke in-memory mock database sehingga tetap dapat dijalankan dan diuji 100% tanpa error!

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

### 5. Kompilasi Produksi (Production Build)
```bash
npm run build
npm run start
```

---

## ☁️ Panduan Deploy ke Vercel

1. Buka dashboard [Vercel](https://vercel.com/) dan pilih **Add New Project**.
2. Hubungkan repository GitHub: `https://github.com/Ari12surahman/Absensi-Kamisan`.
3. Pada bagian **Environment Variables**, tambahkan:
   - `GOOGLE_SHEET_ID`: ID spreadsheet target.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email service account Google Cloud.
   - `GOOGLE_PRIVATE_KEY`: Private key service account (ganti baris baru dengan `\n`).
   - `ADMIN_PASSWORD`: Sandi login dashboard admin.
4. Klik **Deploy**. SalApp Asatidz siap digunakan oleh seluruh asatidz via HP atau laptop!

---

## 📁 Struktur Folder

```text
├── legacy_gas/                 # Backup kode lama Google Apps Script (kode.gs, index.html)
├── public/                     # Asset statis, favicon, dan PWA webmanifest
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── absensi/route.ts  # Endpoint data absensi (GET, POST, PUT, DELETE)
│   │   │   ├── acara/route.ts    # Endpoint data master acara & geofence
│   │   │   ├── auth/route.ts     # Endpoint otentikasi login admin
│   │   │   ├── divisi/route.ts   # Endpoint data master divisi kerja
│   │   │   └── laporan/route.ts  # Endpoint data pelaporan kegiatan divisi
│   │   ├── globals.css         # Styling global Tailwind
│   │   ├── layout.tsx          # Root layout & font metadata SalApp Asatidz
│   │   └── page.tsx            # Halaman utama aplikasi (Portal Asatidz & Admin)
│   ├── lib/
│   │   ├── export-utils.ts     # Generator ekspor Excel & PDF bersih
│   │   ├── geo-utils.ts        # Algoritma Haversine formula deteksi jarak
│   │   ├── google-sheets.ts    # Integrasi Google Sheets API & sinkronisasi
│   │   └── mock-db.ts          # Mock store in-memory untuk offline/demo fallback
│   └── types/
│       └── index.ts            # Definisi TypeScript interface & tipe data
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📄 Lisensi & Hak Cipta
Dikembangkan untuk Yayasan / Lembaga Asatidz Terpadu.
Repo: [Ari12surahman/Absensi-Kamisan](https://github.com/Ari12surahman/Absensi-Kamisan)

