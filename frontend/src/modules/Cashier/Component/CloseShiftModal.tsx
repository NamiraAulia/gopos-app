"use client";

import { useState } from "react";
import { Wallet, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { cashierDAO } from "../DAO/cashier.dao";

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

  const [discrepancyNote, setDiscrepancyNote] = useState<string>("");

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
      const res = await cashierDAO.closeShift(actualCashNum, discrepancyNote);

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
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        <div className="text-center mb-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg mb-2.5 mx-auto">
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Tutup Shift Kasir</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            Hitung uang fisik di laci kasir sebelum menutup sesi
          </p>
        </div>

        {shiftSummary && (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 sm:p-4 mb-4 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span className="text-slate-500">Modal Awal:</span>
              <span className="text-slate-800 font-black">
                Rp {shiftSummary.start_cash.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span className="text-slate-500">Penjualan Tunai:</span>
              <span className="text-slate-800 font-black">
                Rp {Math.max(0, shiftSummary.total_cash_expected - shiftSummary.start_cash).toLocaleString("id-ID")}
              </span>
            </div>
            {shiftSummary.total_refunded_cash > 0 && (
              <div className="flex justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-500">Refund:</span>
                <span className="text-red-600 font-black">
                  - Rp {shiftSummary.total_refunded_cash.toLocaleString("id-ID")}
                </span>
              </div>
            )}
            <div className="border-t-2 border-slate-200 pt-2.5 flex justify-between items-center">
              <span className="text-xs sm:text-sm font-black text-slate-600">Estimasi Kas Seharusnya:</span>
              <span className="text-lg sm:text-xl font-black text-blue-700 font-mono">
                Rp {expectedCash.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-red-600 text-left">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Uang Fisik Dihitung di Laci <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg font-mono">
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
                className="w-full h-14 sm:h-15 rounded-xl border-2 border-slate-300 pl-14 pr-5 text-2xl sm:text-3xl font-black text-slate-900 focus:border-blue-600 outline-none text-right font-mono transition-all"
              />
            </div>
          </div>

          {hasDifference && (
            <div className="space-y-3">
              <div
                className={`rounded-xl p-3.5 flex items-start gap-3 border-2 ${
                  difference > 0
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {difference > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0 stroke-[2.5]" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0 stroke-[2.5]" />
                )}
                <div>
                  <p
                    className={`text-sm sm:text-base font-black ${
                      difference > 0 ? "text-emerald-800" : "text-red-800"
                    }`}
                  >
                    {difference > 0 ? "Kas Lebih" : "Kas Kurang"} Rp{" "}
                    {Math.abs(difference).toLocaleString("id-ID")}
                  </p>
                  <p
                    className={`text-xs sm:text-sm font-bold mt-0.5 ${
                      difference > 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {difference > 0
                      ? "Uang di laci lebih banyak dari catatan sistem."
                      : "Uang di laci lebih sedikit dari catatan sistem."}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Alasan Selisih Kas (Opsional/Anjuran)
                </label>
                <textarea
                  rows={2}
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  placeholder="Misal: Salah memberikan kembalian Rp 2.000 pada nota TX-1234"
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-all bg-slate-50"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 sm:h-13 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 sm:h-13 rounded-xl bg-slate-900 text-white font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Tutup Shift & Selesai <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};