# Panduan Build APK Android (Capacitor) - GoPOS App

Dokumen ini berisi panduan untuk membangun (build) aplikasi GoPOS web (Next.js) menjadi aplikasi native Android (APK) menggunakan **Capacitor** dan **Gradle Wrapper (`gradlew`)**.

---

## 📋 Prasyarat Sebelum Build
Pastikan komputer Anda sudah terinstal:
1. **Android Studio** dan **Android SDK**.
2. **Java Development Kit (JDK)** versi yang kompatibel (misalnya JDK 17).

---

## 🚀 Langkah-Langkah Build APK

### Langkah 1: Aktifkan Static HTML Export di Next.js
Buka file `frontend/next.config.ts` dan pastikan konfigurasi sudah berisi `output: 'export'` dan `unoptimized: true`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Penting untuk static export
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
Buka terminal Anda di folder **`frontend`** lalu jalankan perintah berikut:
```powershell
# 1. Masuk ke folder frontend (jika belum)
cd frontend

# 2. Build aplikasi web Next.js menjadi static HTML/JS/CSS
npm run build

# 3. Sinkronisasikan hasil export statis (folder 'out') ke dalam proyek Android Capacitor
npx cap sync
```

---

### Langkah 3: Build APK Menggunakan Gradle Wrapper
Setelah asset web tersinkronisasi, masuk ke folder `android` lalu gunakan script pembungkus Gradle (`gradlew.bat`) untuk mengompilasi APK.

```powershell
# 1. Masuk ke direktori android native
cd android

# 2. Build APK menggunakan Gradle Wrapper (pilih salah satu)
# - Untuk versi Debug (pengujian lokal):
.\gradlew.bat assembleDebug

# - Untuk versi Release (produksi tanpa tanda tangan):
.\gradlew.bat assembleRelease
```

> **Catatan untuk macOS/Linux:**
> Gunakan `./gradlew assembleDebug` (ganti `.\gradlew.bat` menjadi `./gradlew`).

---

## 📂 Lokasi Hasil File APK
Setelah proses build selesai (`BUILD SUCCESSFUL`), file APK Anda dapat ditemukan di folder berikut:

* **APK Debug (Untuk Testing):**
  `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

* **APK Release (Unsigned):**
  `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk`
