# Panduan Build APK Android (Capacitor) - GoPOS App

Dokumen ini berisi panduan untuk membangun (build) aplikasi GoPOS web (Next.js) menjadi aplikasi native Android (APK) menggunakan **Capacitor** dan **Gradle Wrapper (`gradlew`)**.

---

## ⚠️ PENTING: Arsitektur Live Server vs Bundled

Saat ini, file `frontend/capacitor.config.ts` memiliki konfigurasi `server.url` yang mengarah ke **Vercel deployment**:

```typescript
server: {
  url: 'https://gopos-app-iota.vercel.app',
  cleartext: false
}
```

**Artinya:** APK yang dihasilkan **TIDAK** membundel asset web secara lokal. APK hanya menjadi "shell" native yang memuat konten dari URL Vercel. Konsekuensinya:

| Mode                       | Cara Kerja                            | Butuh Rebuild APK?                          |
| :------------------------- | :------------------------------------ | :------------------------------------------ |
| **Live Server** (saat ini) | APK memuat web dari Vercel URL        | Hanya jika ada perubahan **native Android** |
| **Bundled/Offline**        | APK menyimpan semua HTML/JS/CSS lokal | Setiap perubahan FE membutuhkan rebuild APK |

> Untuk beralih ke mode **Bundled/Offline**, hapus atau komentari blok `server` di `capacitor.config.ts` agar Capacitor menggunakan folder `out/` yang dibundel langsung ke APK.

---

## 🔀 Kondisi & Skenario: Kapan Harus Melakukan Apa?

### Skenario 1: Perubahan di Frontend (UI / Logic Web)

Contoh perubahan: edit komponen React, ubah halaman, tambah fitur POS, perbaiki bug tampilan, update Zustand store, dsb.

#### ➤ Jika menggunakan mode **Live Server** (Vercel URL aktif):

| Langkah                   | Perintah / Aksi | Keterangan                                                                    |
| :------------------------ | :-------------- | :---------------------------------------------------------------------------- |
| 1. Push kode FE ke branch | `git push`      | Pastikan branch terhubung ke Vercel                                           |
| 2. Vercel auto-deploy     | — (otomatis)    | Vercel akan rebuild & deploy otomatis                                         |
| 3. **Selesai** ✅         | —               | APK yang sudah terinstal otomatis menampilkan versi terbaru tanpa rebuild APK |

> **Tidak perlu rebuild APK!** Karena APK memuat konten langsung dari URL Vercel.

#### ➤ Jika menggunakan mode **Bundled/Offline** (tanpa server URL):

| Langkah                   | Perintah / Aksi                                 | Keterangan                                            |
| :------------------------ | :---------------------------------------------- | :---------------------------------------------------- |
| 1. Aktifkan static export | Pastikan `output: 'export'` di `next.config.ts` | Wajib agar `npm run build` menghasilkan folder `out/` |
| 2. Build web asset        | `cd frontend && npm run build`                  | Menghasilkan static HTML/JS/CSS di folder `out/`      |
| 3. Sync ke Android        | `npx cap sync`                                  | Menyalin folder `out/` ke dalam proyek Android        |
| 4. Build APK              | `cd android && ./gradlew assembleDebug`         | Compile APK baru dengan asset terbaru                 |
| 5. Install APK baru       | Instal ulang APK ke perangkat                   | Wajib agar perubahan tampil                           |

> **Harus rebuild APK** setiap ada perubahan FE karena asset dibundel di dalam APK.

---

### Skenario 2: Perubahan di Backend (API / Database / Logic Server)

Contoh perubahan: tambah endpoint baru, ubah response JSON, migrasi database, update handler, ubah model GORM, dsb.

| Langkah                                   | Perintah / Aksi                  | Keterangan                                                       |
| :---------------------------------------- | :------------------------------- | :--------------------------------------------------------------- |
| 1. Edit kode backend                      | Edit file di `backend/internal/` | Handlers, models, routes, middleware, dsb.                       |
| 2. Test lokal                             | `cd backend && go run main.go`   | Pastikan API berjalan di `localhost:8080`                        |
| 3. Update Swagger (jika endpoint berubah) | `swag init` di folder `backend/` | Regenerate documentation                                         |
| 4. Deploy backend                         | Deploy ke server / VPS / Docker  | Sesuaikan dengan environment production                          |
| 5. **Selesai** ✅                         | —                                | FE & APK otomatis menyesuaikan selama endpoint URL tidak berubah |

> **Tidak perlu rebuild APK!** Backend berjalan terpisah sebagai REST API. APK berkomunikasi via HTTP request.

#### ⚠️ Kondisi khusus yang PERLU perhatian ekstra:

| Kondisi                                                | Yang Harus Dilakukan                                                                             |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **URL / host backend berubah** (misal pindah server)   | Update `NEXT_PUBLIC_*` env variables di FE, lalu redeploy FE (dan rebuild APK jika mode bundled) |
| **Struktur response API berubah** (field baru/dihapus) | Update kode FE yang mengonsumsi API tersebut, lalu redeploy FE                                   |
| **Database schema berubah** (migrasi)                  | Jalankan migrasi di server production, pastikan backward compatibility                           |
| **JWT secret berubah**                                 | Update `.env` di backend, semua user akan ter-logout (token lama invalid)                        |

---

### Skenario 3: Perubahan di Native Android (Kotlin / Plugin)

Contoh perubahan: edit `PrinterPlugin.kt`, tambah Capacitor plugin baru, ubah `AndroidManifest.xml`, update Gradle dependencies, dsb.

| Langkah                                    | Perintah / Aksi                                           | Keterangan                                                 |
| :----------------------------------------- | :-------------------------------------------------------- | :--------------------------------------------------------- |
| 1. Edit kode native                        | Edit file `.kt` / `.java` / `.xml` di `frontend/android/` | Misal: PrinterPlugin.kt, build.gradle, AndroidManifest.xml |
| 2. Sync (jika ada perubahan plugin config) | `npx cap sync` dari folder `frontend/`                    | Sinkronisasi konfigurasi plugin                            |
| 3. Build APK baru                          | `cd frontend/android && ./gradlew assembleDebug`          | Compile ulang proyek Android                               |
| 4. Install APK baru                        | Instal ulang ke perangkat                                 | **Wajib** karena kode native berubah                       |

> **Selalu harus rebuild & install ulang APK!** Perubahan native tidak bisa di-deploy secara remote.

---

### Skenario 4: Perubahan di Konfigurasi Capacitor

Contoh perubahan: ubah `capacitor.config.ts` (appId, appName, server URL, plugins config).

| Kondisi                   | Aksi Yang Diperlukan                                                 |
| :------------------------ | :------------------------------------------------------------------- |
| Ubah `appId`              | Rebuild APK + uninstall APK lama (dianggap app berbeda oleh Android) |
| Ubah `appName`            | Rebuild APK (nama di launcher berubah)                               |
| Ubah/hapus `server.url`   | Rebuild APK (beralih antara mode Live Server ↔ Bundled)              |
| Tambah/ubah plugin config | `npx cap sync` + Rebuild APK                                         |

**Perintah wajib setelah ubah `capacitor.config.ts`:**

```bash
cd frontend
npx cap sync
cd android
./gradlew assembleDebug
```

---

### Skenario 5: Perubahan di Environment Variables

| Variable Yang Berubah                       | Dampak                            | Aksi                                                                    |
| :------------------------------------------ | :-------------------------------- | :---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                  | FE tidak bisa connect ke Supabase | Redeploy FE (Vercel) atau rebuild APK jika bundled                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`             | FE auth gagal                     | Redeploy FE (Vercel) atau rebuild APK jika bundled                      |
| `SUPABASE_SERVICE_ROLE_KEY`                 | Server-side FE function gagal     | Redeploy FE (Vercel), tidak perlu rebuild APK                           |
| Backend `.env` (DB_HOST, DB_PASSWORD, dsb.) | Backend crash / tidak connect DB  | Restart backend service, **tidak perlu** rebuild APK maupun redeploy FE |
| Backend `JWT_SECRET`                        | Semua token jadi invalid          | Restart backend, semua user ter-logout                                  |

---

### Skenario 6: Perubahan di Dependencies / Packages

| Jenis Perubahan                            | Aksi Yang Diperlukan                                                |
| :----------------------------------------- | :------------------------------------------------------------------ |
| Tambah/update npm package di FE            | `npm install` → Redeploy FE. Rebuild APK hanya jika mode bundled    |
| Tambah/update Go module di BE              | `go mod tidy` → Rebuild & redeploy backend. Tidak perlu rebuild APK |
| Tambah/update Gradle dependency di Android | Edit `build.gradle` → `npx cap sync` → Rebuild APK wajib            |
| Update Capacitor versi                     | `npm install @capacitor/*` → `npx cap sync` → Rebuild APK wajib     |

---

## 📊 Ringkasan Decision Flowchart

```
Apa yang berubah?
│
├─── 📱 Frontend (React/Next.js/UI) ──────────────────┐
│    │                                                  │
│    ├── Mode Live Server (Vercel)? ─── YA ──→ Push & Deploy ke Vercel saja ✅
│    │                                                  │
│    └── Mode Bundled/Offline? ─── YA ──→ npm run build → npx cap sync → gradlew assembleDebug
│
├─── ⚙️ Backend (Go/API/DB) ──────────────────────────┐
│    │                                                  │
│    ├── Endpoint URL / host berubah? ─── YA ──→ Update env FE + redeploy FE (+ rebuild APK jika bundled)
│    │                                                  │
│    └── Logic / handler / DB saja? ─── YA ──→ Deploy backend saja ✅ (APK & FE tidak terpengaruh)
│
├─── 🤖 Native Android (Kotlin/Plugin) ───────────────→ SELALU rebuild APK + install ulang
│
├─── 🔧 Capacitor Config ─────────────────────────────→ npx cap sync → rebuild APK
│
├─── 🔑 Environment Variables ────────────────────────┐
│    │                                                  │
│    ├── NEXT_PUBLIC_* (FE env)? ──→ Redeploy FE (+ rebuild APK jika bundled)
│    │                                                  │
│    └── Backend .env? ──→ Restart backend saja ✅
│
└─── 📦 Dependencies ─────────────────────────────────┐
     │                                                  │
     ├── npm (FE)? ──→ Redeploy FE (+ rebuild APK jika bundled)
     ├── Go modules (BE)? ──→ Rebuild & redeploy backend saja ✅
     └── Gradle / Capacitor? ──→ Rebuild APK wajib
```

---

## 📋 Prasyarat Sebelum Build

Pastikan komputer Anda sudah terinstal:

1. **Android Studio** dan **Android SDK**.
2. **Java Development Kit (JDK)** versi yang kompatibel (misalnya JDK 17).
3. **Node.js** dan **npm** (untuk build FE dan Capacitor CLI).
4. **Go** (untuk build dan test backend).

---

## 🚀 Langkah-Langkah Build APK (Lengkap)

### Langkah 1: Aktifkan Static HTML Export di Next.js

> ⚠️ Langkah ini **hanya diperlukan jika menggunakan mode Bundled/Offline**. Jika menggunakan mode Live Server (Vercel URL), lewati ke Langkah 3.

Buka file `frontend/next.config.ts` dan pastikan konfigurasi sudah berisi `output: 'export'` dan `unoptimized: true`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Penting untuk static export
  images: {
    unoptimized: true, // Penting agar export gambar tidak error
    remotePatterns: [
      // ... pattern URL gambar Anda
    ],
  },
};

export default nextConfig;
```

---

### Langkah 2: Lakukan Build & Sync Asset Web

> ⚠️ Jika mode **Live Server**, lewati langkah ini. Langsung ke Langkah 3.

Buka terminal Anda di folder **`frontend`** lalu jalankan perintah berikut:

```bash
# 1. Masuk ke folder frontend (jika belum)
cd frontend

# 2. Build aplikasi web Next.js menjadi static HTML/JS/CSS
npm run build

# 3. Sinkronisasikan hasil export statis (folder 'out') ke dalam proyek Android Capacitor
npx cap sync
```

---

### Langkah 3: Build APK Menggunakan Gradle Wrapper

Setelah asset web tersinkronisasi (atau jika menggunakan mode Live Server, langsung jalankan build), masuk ke folder `android` lalu gunakan Gradle Wrapper.

**Windows:**

```powershell
cd frontend\android
.\gradlew.bat assembleDebug      # Debug (pengujian lokal)
.\gradlew.bat assembleRelease    # Release (produksi, unsigned)
```

**macOS / Linux:**

```bash
cd frontend/android
./gradlew assembleDebug      # Debug (pengujian lokal)
./gradlew assembleRelease    # Release (produksi, unsigned)
```

---

### Langkah Otomatis: Gunakan Script Build

Untuk Windows, gunakan script otomatis yang sudah tersedia:

```powershell
cd frontend
.\build_apk.bat
```

Script ini otomatis menjalankan: `npm run build` → `npx cap sync` → `gradlew clean` → `gradlew assembleDebug`.

---

## 📂 Lokasi Hasil File APK

Setelah proses build selesai (`BUILD SUCCESSFUL`), file APK Anda dapat ditemukan di folder berikut:

- **APK Debug (Untuk Testing):**
  `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

- **APK Release (Unsigned):**
  `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🐛 Troubleshooting Umum

| Masalah                        | Penyebab                                                                    | Solusi                                                                    |
| :----------------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| APK blank / white screen       | `server.url` salah atau Vercel down                                         | Cek URL Vercel, atau switch ke mode bundled                               |
| APK error "net::ERR_CLEARTEXT" | Server URL pakai HTTP bukan HTTPS                                           | Ubah ke HTTPS atau set `cleartext: true` di capacitor.config.ts           |
| `npm run build` gagal          | `output: 'export'` belum diset atau ada dynamic route yang tidak compatible | Tambahkan `output: 'export'` dan `generateStaticParams` di dynamic routes |
| `npx cap sync` gagal           | `webDir` di capacitor.config.ts tidak sesuai                                | Pastikan `webDir: 'out'` dan folder `out/` sudah ada setelah build        |
| APK crash saat print           | PrinterPlugin.kt error atau device tidak support                            | Cek logcat, pastikan printer terhubung dan plugin terdaftar               |
| API call gagal dari APK        | Backend URL salah atau CORS belum diatur                                    | Cek env variables dan pastikan backend mengizinkan origin APK             |
| Build Gradle gagal             | JDK version mismatch atau SDK belum terinstal                               | Pastikan JDK 17 dan Android SDK API level yang sesuai terinstal           |
