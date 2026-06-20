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
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Terminal Kasir", href: "/cashier", icon: ShoppingCart },
  { name: "Gudang & Stok", href: "/products", icon: Package },
  { name: "Keuangan", href: "/finance", icon: Wallet },
  { name: "Data Member", href: "/member", icon: Users },
  { name: "Asumsi Restock", href: "/restock", icon: AlertTriangle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar dari sistem?")) {
      localStorage.removeItem("token");
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      router.push("/login");
    }
  };

  return (
    <aside 
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shadow-sm ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-50 overflow-hidden">
        <div className="flex items-center gap-3 min-w-max">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black tracking-tight text-slate-900">
              GoPOS
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold"
              }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "group-hover:text-blue-600"}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              
              {/* Tooltip saat collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 font-bold transition-colors group relative"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Keluar</span>}
          
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
              Keluar
            </div>
          )}
        </button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all z-20"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}