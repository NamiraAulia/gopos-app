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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100 mb-4 mx-auto">
          <Wallet className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Buka Shift Kasir</h2>
        <p className="text-xs font-medium text-slate-400 mt-0.5">Masukkan modal awal laci mesin kasir kamu</p>
        
        {shiftError && (
          <p className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-600 text-left">
            {shiftError}
          </p>
        )}

        <form onSubmit={handleOpenShiftSubmit} className="mt-5 text-left space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              Uang Modal Awal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">Rp</span>
              <input
                type="text"
                required
                placeholder="0"
                value={parseInt(startingCash.replace(/\D/g, "")) ? parseInt(startingCash.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                onChange={(e) => setStartingCash(e.target.value.replace(/\D/g, ""))}
                className="w-full h-12 rounded-xl border-2 border-slate-200 pl-10 pr-4 text-lg font-black text-slate-900 focus:border-blue-600 outline-none text-right font-mono"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Nanti Saja
            </button>
            <button
              type="submit"
              disabled={shiftLoading}
              className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-100"
            >
              {shiftLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buka Shift <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};