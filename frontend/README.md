# GoPOS Frontend App

A modern Point of Sale (POS) frontend application built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **Zustand**, and **Capacitor 7** for native Android POS terminal support.

---

## 🚀 Key Features

- **POS Cashier Interface:** Fast checkout experience with barcode scanner support, cart management, and payment processing.
- **Native Android Printer Integration:** Custom Capacitor plugin (`PrinterPlugin.kt`) supporting:
  - Telpo internal thermal printers via SDK / Reflection
  - Generic USB thermal printers via Bulk OUT USB Host transfer
  - Automatic fallback to `"pcl"` protocol as specified in project rules.
- **Dual Display Support:** Dedicated Customer Secondary Display (`/customer-display`).
- **Complete POS Suite:** Inventory management, stock restock, supplier directory, member loyalty program, kasbon (debt tracking), and financial analytics.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Styling & UI:** Tailwind CSS, Shadcn UI / Radix UI, Lucide Icons
- **State Management:** Zustand (`useSettingsStore.ts`, cart & user stores)
- **Mobile Runtime:** Capacitor 7 (Android platform)
- **HTTP Client:** Axios with API interceptors

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📱 Building Android APK

To build the static web assets and compile the Android APK:

### On Windows:
Run the provided batch script in the `frontend` directory:
```cmd
build_apk.bat
```

### On macOS / Linux:
```bash
# 1. Build Next.js web application
npm run build

# 2. Sync compiled static assets to Capacitor Android project
npx cap sync

# 3. Compile Android APK using Gradle Wrapper
cd android
./gradlew assembleDebug
```

> **Note:** For static export build, ensure `output: 'export'` is set in `next.config.ts`.
