"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MonitorSmartphone,
  LogOut,
  FolderOpen,
  Boxes,
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
    { name: "Kasir", href: "/cashier" },
    { name: "Riwayat", href: "/cashier/historyTransactions" },
    { name: "Rekap Kas", href: "/cashier/cashSummary" },
    { name: "Dashboard", href: "/dashboard"},
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 print:hidden z-30">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            GoPOS
          </h1>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        <nav className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? "bg-blue-50 text-blue-600 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.name === "Kasir" && (
                  <span className={`h-2 w-2 rounded-full ${active ? "bg-blue-600" : "bg-transparent"}`} />
                )}
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {onRecallClick && (
          <button
            type="button"
            onClick={onRecallClick}
            className="h-10 px-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-xs"
            title="Buka Keranjang Tersimpan"
          >
            <FolderOpen className="h-4 w-4 text-amber-700" />
            <span className="hidden sm:inline font-bold">Tersimpan</span>
            <span className="bg-slate-900 text-white font-black text-[11px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
              {heldCarts.length}
            </span>
          </button>
        )}

        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
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
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isShiftActive
                ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
                : "bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20"
            }`}
          >
            {isShiftActive ? "Tutup Shift" : "Buka Shift"}
          </button>
        )}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
          title="Keluar dari sistem"
        >
          <LogOut className="h-4 w-4" />
        </button>

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
        />
      </div>
    </header>
  );
}

