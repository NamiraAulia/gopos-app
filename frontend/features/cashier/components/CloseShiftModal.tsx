"use client";

import { useState } from "react";
import { Wallet, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { cashierApi } from "../api";

type ShiftSummary = {
  start_cash: number;
  total_cash_expected: number;
  total_refunded_cash: number;
  start_time: string;
};

type CloseShiftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftSummary: ShiftSummary | null;
};

export const CloseShiftModal = ({
  isOpen,
  onClose,
  onSuccess,
  shiftSummary,
}: CloseShiftModalProps) => {
  const [actualCash, setActualCash] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const actualCashNum = parseInt(actualCash.replace(/\D/g, "")) || 0;

  const expectedCash = shiftSummary
    ? shiftSummary.total_cash_expected -
      shiftSummary.total_refunded_cash
    : 0;

  const difference = actualCashNum - expectedCash;
  const hasDifference = actualCash !== "" && difference !== 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCashNum <= 0) {
      setError("Masukkan jumlah uang fisik yang dihitung di laci");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await cashierApi.closeShift(actualCashNum);

      if (res && res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Gagal menutup shift kasir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white shadow-lg mb-4 mx-auto">
            <Wallet className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Tutup Shift Kasir</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Hitung uang fisik di laci sebelum menutup sesi
          </p>
        </div>

        {shiftSummary && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-500">Modal Awal</span>
              <span className="font-bold text-slate-700">
                Rp {shiftSummary.start_cash.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-500">Penjualan Tunai</span>
              <span className="font-bold text-slate-700">
                Rp {Math.max(0, shiftSummary.total_cash_expected - shiftSummary.start_cash).toLocaleString("id-ID")}
              </span>
            </div>
            {shiftSummary.total_refunded_cash > 0 && (
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500">Refund</span>
                <span className="font-bold text-red-500">
                  - Rp {shiftSummary.total_refunded_cash.toLocaleString("id-ID")}
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">Estimasi Kas Seharusnya</span>
              <span className="text-base font-black text-blue-600">
                Rp {expectedCash.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-600 text-left">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Uang Fisik Dihitung
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">
                Rp
              </span>
              <input
                type="text"
                required
                autoFocus
                placeholder="0"
                value={
                  actualCashNum ? actualCashNum.toLocaleString("id-ID") : ""
                }
                onChange={(e) =>
                  setActualCash(e.target.value.replace(/\D/g, ""))
                }
                className="w-full h-14 rounded-xl border-2 border-slate-200 pl-10 pr-4 text-xl font-black text-slate-900 focus:border-blue-600 outline-none text-right font-mono transition-all"
              />
            </div>
          </div>

          {hasDifference && (
            <div
              className={`rounded-xl p-4 flex items-start gap-3 border-2 ${
                difference > 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {difference > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p
                  className={`text-xs font-black ${
                    difference > 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {difference > 0 ? "Kas Lebih" : "Kas Kurang"} Rp{" "}
                  {Math.abs(difference).toLocaleString("id-ID")}
                </p>
                <p
                  className={`text-[11px] font-medium mt-0.5 ${
                    difference > 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {difference > 0
                    ? "Uang di laci lebih banyak dari catatan sistem."
                    : "Uang di laci lebih sedikit dari catatan sistem."}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Tutup Shift & Selesai <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};