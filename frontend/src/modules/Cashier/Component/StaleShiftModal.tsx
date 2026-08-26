"use client";

import { AlertTriangle, Clock, LogOut, ChevronRight } from "lucide-react";
import type { ShiftDataDTO } from "../DTO/cashier.dto";

interface StaleShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  staleShiftInfo: { isStale: boolean; shift: ShiftDataDTO | null; hoursOpen: number } | null;
  onCloseShiftClick: () => void;
}

export function StaleShiftModal({
  isOpen,
  onClose,
  staleShiftInfo,
  onCloseShiftClick,
}: StaleShiftModalProps) {
  if (!isOpen || !staleShiftInfo || !staleShiftInfo.isStale || !staleShiftInfo.shift) {
    return null;
  }

  const shift = staleShiftInfo.shift;
  const hoursOpen = staleShiftInfo.hoursOpen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-amber-200 text-slate-900 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Shift Belum Ditutup
            </span>
            <h3 className="font-black text-lg text-slate-900 mt-1">Shift Kasir Masih Mengendap</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Sistem mendeteksi ada shift kasir aktif dari hari sebelumnya yang sudah terbuka selama{" "}
          <strong className="text-amber-700 font-black">{hoursOpen} jam</strong>.
        </p>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-400">Waktu Buka:</span>
            <span className="font-bold text-slate-900">
              {new Date(shift.start_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Modal Awal:</span>
            <span className="font-bold text-emerald-600">Rp {shift.start_cash.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-400">Estimasi Uang Tunai:</span>
            <span className="font-black text-slate-900">Rp {shift.total_cash_expected.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium italic">
          *Sangat disarankan untuk menutup shift kemarin terlebih dahulu agar laporan kasir hari ini tidak bercampur.
        </p>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCloseShiftClick}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Tutup Shift Kemarin Sekarang
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            Lanjutkan Shift Ini <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
