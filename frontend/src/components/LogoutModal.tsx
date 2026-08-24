"use client";

import { LogOut, X, Shield, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  description?: string;
}

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Keluar",
  description,
}: LogoutModalProps) {
  const router = useRouter();
  const { user, activeShift, logout } = useAuthStore();

  if (!isOpen) return null;

  const handleExecuteLogout = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      logout();
      router.push("/login");
    }
    onClose();
  };

  const isKasir = user?.role === "kasir";
  const defaultDesc = isKasir
    ? "Apakah Anda yakin ingin mengakhiri sesi kasir? Pastikan semua sisa transaksi keranjang atau kas sudah direkap."
    : "Apakah Anda yakin ingin keluar dari sistem GoPOS? Sesi Anda akan diakhiri.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="size-8 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
              <LogOut className="h-4 w-4 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-sm text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-center sm:text-left">
          {/* User Badge Info */}
          {user && (
            <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 truncate">
                    {user.username}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      user.role === "admin"
                        ? "bg-purple-50 text-purple-600 border border-purple-200"
                        : "bg-blue-50 text-blue-600 border border-blue-200"
                    }`}
                  >
                    <Shield className="size-3" />
                    {user.role}
                  </span>
                </div>
                {activeShift ? (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <Wallet className="size-3" /> Shift Kasir Aktif
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Terminal POS Toko
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {description || defaultDesc}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-black text-slate-600 uppercase tracking-wider transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteLogout}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
