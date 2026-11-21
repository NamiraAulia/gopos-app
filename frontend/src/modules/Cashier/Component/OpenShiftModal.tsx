"use client";

import { useState } from "react";
import { Wallet, Loader2, ArrowRight } from "lucide-react";
import { cashierDAO } from "../DAO/cashier.dao";

type OpenShiftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const OpenShiftModal = ({ isOpen, onClose, onSuccess }: OpenShiftModalProps) => {
  const [startingCash, setStartingCash] = useState<string>("");
  const [shiftLoading, setShiftLoading] = useState<boolean>(false);
  const [shiftError, setShiftError] = useState<string>("");

  if (!isOpen) return null;

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericCash = parseInt(startingCash.replace(/\D/g, "")) || 0;
    if (numericCash <= 0) {
      setShiftError("Modal laci kasir harus lebih besar dari Rp 0");
      return;
    }

    try {
      setShiftLoading(true);
      setShiftError("");
      const res = await cashierDAO.openShift(numericCash);
      
      if (res && res.success) {
        onSuccess(); // Triger untuk mereset catalog dan menutup modal di parent
      }
    } catch (err: any) {
      setShiftError(err.message || "Gagal membuka laci kasir.");
    } finally {
      setShiftLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-4 mx-auto">
          <Wallet className="h-7 w-7 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Buka Shift Kasir</h2>
        <p className="text-sm font-bold text-slate-500 mt-1">Masukkan modal awal laci mesin kasir kamu</p>
        
        {shiftError && (
          <p className="mt-3 bg-red-50 border-2 border-red-200 rounded-xl p-3 text-sm font-bold text-red-600 text-left">
            {shiftError}
          </p>
        )}

        <form onSubmit={handleOpenShiftSubmit} className="mt-6 text-left space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Uang Modal Awal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">Rp</span>
              <input
                type="text"
                required
                placeholder="0"
                value={parseInt(startingCash.replace(/\D/g, "")) ? parseInt(startingCash.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                onChange={(e) => setStartingCash(e.target.value.replace(/\D/g, ""))}
                className="w-full h-14 sm:h-15 rounded-xl border-2 border-slate-300 pl-12 pr-4 text-2xl font-black text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none text-right font-mono transition-all"
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-13 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm sm:text-base transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              type="submit"
              disabled={shiftLoading}
              className="flex-[2] h-13 rounded-xl bg-blue-600 text-white font-black text-sm sm:text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              {shiftLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Buka Shift</span>
                  <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};