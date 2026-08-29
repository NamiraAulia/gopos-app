# Dokumentasi Rekayasa Balik (Reverse Engineering) - GoPOS App

Dokumen ini menjelaskan fungsi dari folder `jadx` dan `ritgrow-source` yang ada pada root direktori proyek ini.

---

## 1. Folder `jadx/`
Folder ini berisi program **JADX (Dex to Java decompiler)**. JADX adalah alat open-source yang digunakan untuk melakukan dekompilasi file biner Android (seperti `.apk`, `.dex`, `.aar`, `.jar`) menjadi kode sumber Java/Kotlin yang dapat dibaca kembali oleh manusia.

**Fungsi utama dalam proyek:**
* Digunakan untuk membongkar APK dari aplikasi kasir lain yang sudah memiliki fitur cetak printer thermal native (misalnya pada perangkat Telpo) untuk dipelajari kodenya.

---

## 2. Folder `ritgrow-source/`
Folder ini berisi seluruh kode sumber hasil ekstraksi/dekompilasi dari APK aplikasi Android **"Ritgrow"** menggunakan alat JADX di atas.

**Tujuan dan Kegunaan:**
* **Referensi Integrasi Hardware**: Digunakan sebagai acuan teknis tentang bagaimana aplikasi kasir lain memanggil fungsi printer bawaan POS terminal (seperti SDK Telpo).
* **Pembuatan Plugin Printer**: Logika jembatan cetak native (seperti *reflection* Java yang ada di `frontend/android/app/src/main/java/com/gopos/app/PrinterPlugin.kt`) dibuat dengan mengacu pada alur kerja cetak yang ditemukan dari source code Ritgrow ini.

> [!NOTE]
> Sebagian besar nama paket dan folder di dalam `ritgrow-source/sources/` berupa satu huruf acak (`a`, `b0`, `c1`, dll.). Hal ini terjadi karena kode aplikasi aslinya telah disamarkan (*obfuscated*) menggunakan ProGuard/R8 saat diproduksi agar tidak mudah ditiru.
