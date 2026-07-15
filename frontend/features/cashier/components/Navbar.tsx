"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MonitorSmartphone,
  LogOut,
  Wallet,
  LockKeyholeOpen,
  FolderOpen,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";

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
  const logout = useAuthStore((s) => s.logout);
  const heldCarts = useCartStore((s) => s.heldCarts);

  const handleLogout = () => {
    if (confirm("Yakin ingin mengakhiri sesi kasir?")) {
      logout();
      router.push("/login");
    }
  };

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
    { name: "Gudang", href: "/products" },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 print:hidden">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            GoPOS
          </h1>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden md:block" />
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {onRecallClick && (
          <button
            type="button"
            onClick={onRecallClick}
            className="h-10 px-4 rounded-xl border-2 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider relative cursor-pointer"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Keranjang Tersimpan</span>
            {heldCarts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                {heldCarts.length}
              </span>
            )}
          </button>
        )}

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
            className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-2 ${
              isShiftActive
                ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 shadow-sm shadow-amber-50"
            }`}
          >
            {isShiftActive ? (
              <>
                <LockKeyholeOpen className="h-4 w-4" /> Tutup Shift (Selesai)
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 animate-pulse" /> Buka Shift Kasir
              </>
            )}
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
