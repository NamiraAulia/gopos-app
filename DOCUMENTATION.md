# GoPOS Project Documentation

## 1. Overview
- **Project Name:** GoPOS App
- **Description:** Point of Sale (POS) application designed to manage transactions, inventory, kasbon (debts), stock restock, supplier management, loyalty members, customer secondary displays, and role-based access control.
- **Architecture:** Monorepo consisting of a Go (Gin Gonic) REST API backend and a Next.js 15 (Capacitor) web/Android mobile frontend.

---

## 2. Monorepo Folder Structure

```text
gopos-app/
├── backend/                # Go (Gin Gonic) REST API Backend
│   ├── database/           # Migration & security patches
│   ├── docs/               # Swagger API documentation (docs.go, swagger.json)
│   ├── internal/           # Private application code
│   │   ├── database/       # DB connection & seeders (ConnectDB, SeedAdmin)
│   │   ├── handlers/       # HTTP Request Handlers (Controller layer)
│   │   ├── middleware/     # Auth (JWT) & RBAC Middlewares
│   │   ├── models/         # Database GORM Entity models
│   │   ├── routes/         # Gin Engine API route definitions
│   │   └── utils/          # Hashing, JWT, & response helpers
│   ├── uploads/            # Media & uploaded product image assets
│   ├── DockerFile          # Docker container configuration
│   ├── main.go             # Application entry point (Port 8080)
│   └── go.mod              # Go dependencies management
│
├── frontend/               # Next.js 15 + Capacitor Native Frontend
│   ├── android/            # Native Android Capacitor Project
│   │   └── app/src/main/java/com/gopos/app/PrinterPlugin.kt  # Native Printer Plugin
│   ├── public/             # Static web assets
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # UI Components (Shadcn/UI, Tailwind)
│   │   ├── lib/            # Native bridges & printer utilities (printer.ts)
│   │   └── modules/        # Domain modules (Components, Containers, Stores, DAOs)
│   ├── build_apk.bat       # Windows build automation script
│   ├── capacitor.config.ts # Capacitor cross-platform configuration
│   ├── next.config.ts      # Next.js export & image optimization settings
│   └── package.json        # Frontend Node.js dependencies
│
├── .agents/                # AI Agent custom rule definitions
├── .antigravityignore      # Exclusions for AI code analysis
├── GEMINI.md               # Guidelines & rules for GoPOS App
├── REVERSE_ENGINEERING.md  # Technical reference for Telpo thermal printer reverse engineering
└── android_build_guide.md  # Guide for compiling Android APK via Capacitor & Gradle
```

---

## 3. Backend Architecture & Development Flow

The backend uses a layered (MVC-style) Go architecture:

```text
HTTP Request ---> Routes (Gin Engine) ---> Middleware (JWT/RBAC) ---> Handlers ---> Models / Database (GORM)
```

1. **Routes (`internal/routes/`):** Maps REST endpoints to corresponding handlers and applies JWT middleware protection.
2. **Handlers (`internal/handlers/`):** Validates request payloads, executes domain logic, and returns structured JSON responses.
3. **Models (`internal/models/`):** Struct definitions mapped to database tables via GORM.
4. **Database (`internal/database/`):** Connects SQLite/MySQL, executes auto-migrations, and seeds default admin credentials.
5. **Swagger Documentation:** Available at `/swagger/index.html` when running the backend.

---

## 4. Frontend & Mobile Architecture

The frontend is built with Next.js 15 (App Router) and packaged for Android using Capacitor.

- **UI Framework:** React 19, Tailwind CSS, Shadcn UI icons and components.
- **State Management:** Zustand stores (e.g. `useSettingsStore.ts`, cart stores, auth stores).
- **Native Hardware Bridge:** Capacitor custom plugin (`PrinterPlugin.kt`) for direct communication with Telpo internal thermal printers (via reflection/SDK) and generic USB POS thermal printers.
- **Printer Protocol Rule:** Default printer initialization always defaults to `"pcl"` (PCL / Internal Thermal) rather than `"escpos"`.

---

## 5. Complete Summary of App Menus & Modules

| Menu / Route Path | Description | Access Rights |
| :--- | :--- | :--- |
| **Dashboard** (`/dashboard`) | Overview of daily sales, revenue metrics, top products, and quick stats. | All Roles |
| **POS / Cashier** (`/cashier`) | Main cashier transaction interface, product selection, cart, and receipt printing. | Admin, Cashier |
| **Products & Categories** (`/products`) | Catalog management, stock tracking, price configuration, and categories. | Admin, Manager |
| **Transactions / History** (`/transactions`) | Comprehensive log of past sales, receipt re-printing, and order statuses. | Admin, Manager, Cashier |
| **Kasbon / Debts** (`/kasbon`) | Customer debt tracking, payment logging, and credit management. | Admin, Cashier |
| **Restock Inventory** (`/restock`) | Purchase orders, inventory replenishment, and stock additions. | Admin, Manager |
| **Members / Customers** (`/member`) | Customer directory, loyalty points, and member data management. | Admin, Cashier |
| **Suppliers** (`/suppliers`) | Supplier list, contact details, and inventory sourcing records. | Admin, Manager |
| **Finance & Reports** (`/finance`) | Revenue reports, sales analytics, expense tracking, and export functions. | Admin, Manager |
| **Customer Display** (`/customer-display`) | Secondary screen display for real-time customer cart and total calculation. | Cashier, Customer Screen |
| **Settings & Printer** (`/settings`) | Printer mode configuration (PCL / ESC-POS), USB pairing, and system settings. | Admin, Cashier |
| **User & Role Management** (`/admin`) | User accounts, role assignments (Admin, Manager, Cashier), and permissions. | Admin |

---

## 6. Roles & Permissions Matrix

- **Admin:** Unrestricted access to all modules, financial reports, user management, printer settings, and system configurations.
- **Manager:** Access to inventory, product catalog, stock restock, supplier management, transaction history, and sales reports.
- **Cashier:** Operational access restricted to POS cashier checkout, transaction history, kasbon recording, member registration, and printer settings.
