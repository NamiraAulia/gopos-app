"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  AlertTriangle,
  LogOut,
  MonitorSmartphone,
  ChevronLeft,
  ChevronRight,
  Shield,
  Receipt,
  Printer,
  CreditCard,
  Truck,
  Warehouse,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useIsAdmin } from "@/store/authStore";
import LogoutModal from "@/components/LogoutModal";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 1280) {
      setIsCollapsed(true);
    }
  }, []);

  const activeMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kasir Toko", href: "/cashier", icon: ShoppingCart },
    { name: "Katalog & Stok Barang", href: "/products", icon: Package },
    { name: "Data Member", href: "/member", icon: Users },
    { name: "Lembar Belanja Stok", href: "/restock", icon: AlertTriangle },
    { name: "Pengaturan", href: "/settings", icon: Printer },
    { name: "Kasbon", href: "/kasbon", icon: CreditCard },
    { name: "Distributor", href: "/suppliers", icon: Truck },
    ...(isAdmin ? [
      { name: "Kelola Kasir", href: "/admin/users", icon: Users },
      { name: "Keuangan & Pengeluaran", href: "/finance", icon: Wallet },
      { name: "Riwayat Nota Transaksi", href: "/admin/transactions", icon: Receipt },
      { name: "Catatan Aktivitas Kasir", href: "/admin/audit-logs", icon: Shield }
    ] : []),

  ];

  return (
    <>
      <aside
        className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shadow-sm ${isCollapsed ? "w-20" : "w-72"
          }`}
      >
        <div className="h-18 flex items-center px-6 border-b border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3.5 min-w-max">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <MonitorSmartphone className="h-6 w-6 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <span className="text-2xl font-black tracking-tight text-slate-900">
                GoPOS
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
          {activeMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all group relative text-base ${isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-extrabold"
                  }`}
              >
                <item.icon className={`h-6 w-6 shrink-0 stroke-[2.5] ${isActive ? "text-white" : "text-slate-600 group-hover:text-blue-600"}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-red-600 hover:bg-red-50 text-base font-black transition-colors group relative cursor-pointer"
          >
            <LogOut className="h-6 w-6 shrink-0 stroke-[2.5]" />
            {!isCollapsed && <span>Keluar</span>}

            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                Keluar
              </div>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-20 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-slate-200 shadow-md text-slate-500 hover:text-blue-600 hover:border-blue-600 transition-all z-20 cursor-pointer"
          title={isCollapsed ? "Perlebar Menu" : "Perkecil Menu"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 stroke-[3]" /> : <ChevronLeft className="h-4 w-4 stroke-[3]" />}
        </button>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
}