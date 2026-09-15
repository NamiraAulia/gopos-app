# 📖 Dokumentasi Arsitektur & Panduan GoPOS App
> **Catatan Efisiensi Konteks (Token Optimization)**: Dokumen ini dirancang sebagai *single source of truth* teknis berdensitas tinggi untuk AI Assistant dan Developer agar memahami arsitektur, modul, skema data, dan konvensi GoPOS tanpa perlu membaca seluruh file source code.

---

## 1. 🚀 Tech Stack & Core Dependencies
- **Framework**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS v4, Lucide React (Icons), Radix UI Primitives, tw-animate-css
- **Backend & Auth**: Supabase (`@supabase/supabase-js` v2.110.7)
- **State Management**: Zustand v5 (Persisted Auth & Cart State), TanStack React Query v5 (Server State)
- **Mobile/Hybrid POS Wrapper**: Capacitor v8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`)
- **Reporting & Charts**: Recharts v3
- **Data Export/Import**: PapaParse (CSV)

---

## 2. 📁 Struktur Direktori & Tanggung Jawab Modul

```
frontend/
├── android/                 # Proyek native Android (Capacitor wrapper)
├── public/                  # Static assets (logo, icons)
├── src/
│   ├── app/                 # Next.js App Router (Halaman & Layouts)
│   │   ├── (auth)/login/    # Halaman Login
│   │   ├── admin/           # Halaman Admin (User, Role, Settings)
│   │   ├── cashier/         # Layar Utama POS Kasir
│   │   ├── customer-display/# Layar Kedua Pelanggan (Dual Display)
│   │   ├── dashboard/       # Ringkasan KPI & Analytics Penjualan
│   │   ├── finance/         # Keuangan & Arus Kas
│   │   ├── kasbon/          # Pencatatan Piutang/Hutang Kasbon Pelanggan
│   │   ├── member/          # Manajemen Member/Pelanggan
│   │   ├── products/        # Manajemen Master Produk & Harga
│   │   ├── restock/         # Pembelian/Restock Stok dari Supplier
│   │   ├── settings/        # Konfigurasi Printer, Toko, & Akun
│   │   ├── suppliers/       # Master Supplier
│   │   └── transactions/    # Riwayat Transaksi & Void/Refund
│   ├── components/          # Shared Reusable UI Components
│   ├── config/              # Konfigurasi Global Aplikasi (`app.config.ts`)
│   ├── enum/                # Enums (Role, TransactionStatus, PaymentMethod, ExpenseCategory)
│   ├── helper/              # Supabase Client (`supabaseClient.ts`), formatters, utilities
│   ├── interface/           # TypeScript interfaces & DTO API (`api.ts`)
│   ├── lib/                 # Printer engines (USB, Bluetooth, PCL), utils
│   ├── modules/             # Business Logic UI per Feature (Views, Components, Hooks)
│   ├── service/             # Layer Interaksi Data & Query Supabase (*.service.ts)
│   ├── store/               # Zustand Global Stores (`authStore.ts`, `useCartStore.ts`)
│   └── styles/              # Global styling & CSS variables
├── middleware.ts            # Route protection & Auth cookie verification
└── capacitor.config.ts      # Konfigurasi Capacitor Android app
```

---

## 3. 🗺️ Peta Modul & Alur Bisnis (Core Business Flows)

### A. Autentikasi & Otorisasi (`authStore.ts` & `middleware.ts`)
- **Role**: `admin` vs `kasir`.
- **Mekanisme**: Menggunakan Supabase Auth (`signInWithPassword`) + tabel `users` untuk profil dan status `is_active`.
- **Token & Session Handling**: Disimpan di `localStorage.getItem('token')`, Cookie `auth_token`, dan Cookie `user_role`.
- **Middleware Rules (RBAC Guard)**:
  - Unauthenticated $\rightarrow$ Redirect ke `/login`.
  - Authenticated mengakses `/login` $\rightarrow$ Redirect ke `/dashboard` (admin) atau `/cashier` (kasir).
  - Kasir mengakses rute khusus Admin (`/admin`, `/dashboard`, `/finance`, `/suppliers`, `/restock`, `/settings`) $\rightarrow$ Ditolak dan otomatis redirect ke `/cashier`.
  - Shift Tracking: Kasir wajib memiliki shift aktif (`shifts.status = 'open'`) untuk melakukan transaksi kasir.

### B. Transaksi Kasir / POS (`src/modules/Cashier`, `useCartStore.ts`, `cashier.service.ts`)
- **Keranjang Belanja (`useCartStore`)**:
  - Multi-unit: Mendukung satuan kecil (`small`) & satuan besar (`big`) dengan rasio konversi (`conversion`).
  - Multi-tier Pricing: Regular price (`price`), Member price (`price_member`), Grosir (`price_big`), dan Custom Price.
  - Hold / Recall Cart: Fitur penahanan keranjang (disimpan di `localStorage: gopos-held-carts`) dengan catatan transaksi.
  - Global Hardware Barcode Scanner (`useBarcodeScanner`): Mendeteksi input cepat dari alat scan barcode USB/Bluetooth di seluruh layar tanpa harus mengklik kotak search bar terlebih dahulu.
- **Metode Pembayaran**: `cash`, `qris`, `transfer`, `kasbon`.
- **Status Transaksi**: `completed`, `voided`, `partially_refunded`.
- **Customer Display Sync**: Transaksi keranjang kasir disinkronkan ke rute `/customer-display` secara realtime via Supabase / local broadcast.

### C. Sistem Pencetakan Struk / Printer (`src/lib/printer.ts`, `useUsbPrinter.ts`, `useBluetoothPrinter.ts`)
- **Dukungan Tipe Printer**:
  1. `pcl` (PCL / Internal / Thermal / Raw Native)
  2. `escpos` (ESC/POS standard command)
  3. Bluetooth Thermal Printer
  4. Web USB / OTG Direct Thermal Printer
- ⚠️ **ATURAN WAJIB SISTEM PRINTER**:
  - Inisialisasi printer dan fallback konfigurasi **HARUS SELALU** default ke `"pcl"` (bukan `"escpos"`).
  - Contoh: `printerType: "pcl"` atau `localStorage.getItem("gopos-printer-type") || "pcl"`.

### D. Manajemen Shift & Cash Summary (`src/service/cashSummary.service.ts`, `shifts` table)
- **Buka Shift**: Input `start_cash` (modal awal kasir).
- **Tutup Shift**: Input `total_cash_actual`, sistem menghitung `total_cash_expected` vs `total_cash_actual`, lalu menghasilkan status selisih: `'lebih' | 'kurang' | 'pas'`.

- **Produk**: Barcode unik, best_price (harga modal), price (harga jual), price_big, price_member, stok, min_stock, unit/unit_big, promo flag.
- **Pencarian Produk**: Multi-kolom search (`name`, `barcode`, `supplier_name`) dengan optimasi Debounce 300ms agar hemat query Supabase.
- **Restock**: Pencatatan pembelian stok masuk dari supplier dan update otomatis stok produk.

### F. Member & Kasbon / Piutang (`src/service/member.service.ts`, `kasbon.service.ts`)
- Pencatatan saldo kasbon / piutang per pelanggan.
- Pembayaran / pelunasan kasbon dan pencatatan histori transaksi piutang.

### G. Keuangan & Pengeluaran (`src/service/finance.service.ts`, `expenses.service.ts`)
- Kategori pengeluaran: `Operasional`, `Suplai`, `Gaji`, `Hutang`.
- Rekapitulasi laba rugi, cashflow harian, mingguan, bulanan.

---

## 4. 🗄️ Skema Database Supabase & Relasi Utama

| Tabel | Deskripsi & Kolom Kunci |
| :--- | :--- |
| `users` | `id`, `email`, `name`, `role` ('admin' \| 'kasir'), `is_active` |
| `products` | `id`, `name`, `barcode`, `best_price`, `price`, `price_big`, `price_member`, `stock`, `min_stock`, `unit`, `unit_big`, `conversion`, `supplier_id`, `is_promo`, `is_active` |
| `suppliers` | `id`, `name`, `phone`, `address`, `created_at` |
| `transactions` | `id`, `transaction_code`, `user_id`, `cashier_name`, `subtotal`, `discount_total`, `total_amount`, `payment_method`, `amount_paid`, `change_amount`, `status`, `created_at` |
| `transaction_items` | `id`, `transaction_id`, `product_id`, `product_name`, `unit_price`, `unit_choice`, `conversion_used`, `qty`, `discount_amount`, `subtotal` |
| `shifts` | `id`, `user_id`, `start_time`, `end_time`, `start_cash`, `total_cash_expected`, `total_cash_actual`, `cash_difference`, `difference_status`, `status` ('open' \| 'closed') |
| `refunds` | `id`, `transaction_id`, `user_id`, `reason`, `total_refunded`, `created_at` |
| `expenses` | `id`, `category`, `amount`, `notes`, `user_id`, `created_at` |
| `members` | `id`, `name`, `phone`, `address`, `total_debt`, `created_at` |
| `kasbon_logs` | `id`, `member_id`, `transaction_id`, `amount`, `type` ('debt' \| 'payment'), `notes`, `created_at` |
| `audit_logs` | `id`, `user_id`, `username`, `action`, `target_table`, `target_id`, `old_value`, `new_value`, `ip_address`, `created_at` |

---

## 5. ⚙️ Pemetaan Layer Service (`src/service/`)

| File Service | Kegunaan & Tabel Terkait |
| :--- | :--- |
| `authStore.ts` | Login, session cookies, user role, active shift |
| `cashier.service.ts` | Checkout, hitung diskon/promo, cetak struk, void transaksi (`transactions`, `transaction_items`, `products`) |
| `products.service.ts` | CRUD produk, validasi barcode, import/export CSV, filter kategori (`products`) |
| `cashSummary.service.ts`| Buka/tutup shift kasir, rekonsiliasi kas harian (`shifts`) |
| `kasbon.service.ts` | Pencatatan piutang, pelunasan hutang pelanggan (`members`, `kasbon_logs`) |
| `member.service.ts` | CRUD member & riwayat belanja (`members`) |
| `restock.service.ts` | Transaksi stok masuk & update inventory (`products`, `suppliers`) |
| `expenses.service.ts` | CRUD pengeluaran operasional (`expenses`) |
| `finance.service.ts` | Laporan laba kotor, pendapatan, pengeluaran |
| `dashboard.service.ts` | Aggregasi KPI widget, grafik penjualan harian/bulanan |
| `auditLogs.service.ts` | Tracking histori perubahan data oleh admin/kasir (`audit_logs`) |

---

## 6. 📌 Konvensi Kode & Aturan Khusus (Critical Rules)

1. **Aturan Printer**:
   - Nilai default tipe printer **WAJIB** `"pcl"` (bukan `"escpos"`).
   - Selalu berikan fallback `"pcl"` pada `localStorage` reading atau state init.
2. **Layering Pattern**:
   - Komponen UI (`src/modules/*`) **TIDAK BOLEH** langsung memanggil query Supabase mentah; gunakan fungsi dari `src/service/*`.
3. **State Management**:
   - Server Cache & Remote Data $\rightarrow$ TanStack React Query (`useQuery`, `useMutation`).
   - Client Session & Keranjang $\rightarrow$ Zustand stores (`authStore`, `useCartStore`).
4. **Mata Uang & Waktu**:
   - Mata uang standar: `Rp` (Format: `Intl.NumberFormat('id-ID')` via helper).
   - Timezone: `Asia/Jakarta` (WIB).

---

## 7. 🛠️ Perintah CLI & Alur Build

```bash
# Development server (Next.js)
npm run dev

# Linting kode
npm run lint

# Build web production
npm run build

# Sinkronisasi ke Android (Capacitor)
npx cap sync android

# Buka Android Studio untuk build APK
npx cap open android

# Build APK langsung via script batch (Windows)
./build_apk.bat
```
