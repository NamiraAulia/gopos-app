"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MonitorSmartphone,
  LogOut,
  FolderOpen,
  Boxes,
  ShoppingCart,
  Receipt,
  Calculator,
  LayoutDashboard,
  Wallet,
} from "lucide-react";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import LogoutModal from "@/components/LogoutModal";

type NavbarProps = {
  isShiftActive?: boolean;
  onOpenShiftClick?: () => void;
  onCloseShiftClick?: () => void;
  onRecallClick?: () => void;
};

export default function Navbar({
  isShiftActive = false,
  onOpenShiftClick,
  onCloseShiftClick,
  onRecallClick,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.user);
  const heldCarts = useCartStore((s) => s.heldCarts);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path: string) => {
    if (path === "/cashier") {
      return pathname === "/cashier";
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { name: "Kasir", href: "/cashier", icon: ShoppingCart },
    { name: "Riwayat", href: "/cashier/historyTransactions", icon: Receipt },
    { name: "Rekap Kas", href: "/cashier/cashSummary", icon: Calculator },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5 lg:px-6 print:hidden z-30">
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
        {/* <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 shrink-0">
            <MonitorSmartphone className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 shrink-0">
            GoPOS
          </h1>
        </div> */}

        <div className="h-7 w-px bg-slate-200 hidden md:block" />

        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 lg:px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm lg:text-base ${
                  active
                    ? "bg-blue-600 text-white font-black shadow-md shadow-blue-600/20"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-extrabold"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 lg:h-5 lg:w-5 shrink-0 stroke-[2.5] ${active ? "text-white" : "text-slate-600"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
        {onRecallClick && (
          <button
            type="button"
            onClick={onRecallClick}
            className="h-11 px-3 sm:px-4 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all flex items-center gap-2 text-xs sm:text-sm font-black cursor-pointer shadow-sm shrink-0"
            title="Buka Keranjang Tersimpan"
          >
            <FolderOpen className="h-4.5 w-4.5 text-amber-700 stroke-[2.5]" />
            <span className="hidden sm:inline">Tersimpan</span>
            <span className="bg-slate-900 text-white font-black text-xs min-w-[22px] h-5.5 px-1 rounded-full flex items-center justify-center">
              {heldCarts.length}
            </span>
          </button>
        )}

        <div className="hidden xl:flex items-center gap-2 px-3.5 h-11 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-black text-slate-800 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          <span>
            {currentUser?.username || "Kasir"} ({currentUser?.role === "admin" ? "Admin" : "Kasir 01"})
          </span>
        </div>

        {onOpenShiftClick && onCloseShiftClick && (
          <button
            type="button"
            onClick={() => {
              if (isShiftActive) {
                onCloseShiftClick();
              } else {
                onOpenShiftClick();
              }
            }}
            className={`h-11 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 border-2 cursor-pointer shadow-sm shrink-0 ${
              isShiftActive
                ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                : "bg-amber-500 border-amber-600 text-white hover:bg-amber-600 shadow-amber-500/20"
            }`}
          >
            <Wallet className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>{isShiftActive ? "Tutup Shift" : "Buka Shift"}</span>
          </button>
        )}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border-2 border-red-200 shrink-0"
          title="Keluar dari sistem"
        >
          <LogOut className="h-5 w-5 stroke-[2.5]" />
        </button>

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
        />
      </div>
    </header>
  );
}
