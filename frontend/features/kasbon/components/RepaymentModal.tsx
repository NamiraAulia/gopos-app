"use client";

import { useState, useEffect } from "react";
import { X, Banknote, CreditCard, Landmark, CheckCircle, AlertCircle } from "lucide-react";
import { kasbonApi } from "../api";
import type { Member } from "@/features/member/types";

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSuccess: () => void;
}

export const RepaymentModal = ({
  isOpen,
  onClose,
  member,
  onSuccess,
}: RepaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [amountStr, setAmountStr] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && member) {
      setAmountStr("");
      setNotes("");
      setErrorMsg("");
      setPaymentMethod("cash");
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const totalDebt = member.total_debt || 0;
  const amountPaidNum = parseInt(amountStr.replace(/\D/g, "")) || 0;
  const remainingAfter = totalDebt - amountPaidNum;

  const handleQuickAmount = (val: number) => {
    const safeVal = Math.min(val, totalDebt);
    setAmountStr(safeVal.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (amountPaidNum <= 0) {
      setErrorMsg("Nominal cicilan harus lebih dari Rp 0");
      return;
    }
    if (amountPaidNum > totalDebt) {
      setErrorMsg(`Nominal cicilan (Rp ${amountPaidNum.toLocaleString("id-ID")}) melebihi total utang (Rp ${totalDebt.toLocaleString("id-ID")})`);
      return;
    }

    setLoading(true);
    try {
      const res = await kasbonApi.processRepayment(member.id, {
        amount_paid: amountPaidNum,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal memproses pembayaran");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Bayar / Cicil Utang Kasbon</h3>
            <p className="text-xs text-slate-500 font-medium">
              Member: <strong className="text-slate-800">{member.name}</strong> ({member.member_code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Total Debt Banner */}
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase text-red-500 tracking-wider block">
                Total Utang Saat Ini
              </span>
              <h4 className="text-xl font-black text-red-700">
                Rp {totalDebt.toLocaleString("id-ID")}
              </h4>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs font-bold flex items-center gap-2 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Metode Pembayaran Cicilan
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                  paymentMethod === "cash"
                    ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="h-4 w-4" />
                <span>TUNAI</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("qris")}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                  paymentMethod === "qris"
                    ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                  paymentMethod === "transfer"
                    ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Landmark className="h-4 w-4" />
                <span>TRANSFER</span>
              </button>
            </div>
          </div>

          {/* Quick Amounts */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Pilihan Nominal Cepat
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickAmount(totalDebt)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border border-emerald-200 cursor-pointer"
              >
                LUNAS (Rp {totalDebt.toLocaleString("id-ID")})
              </button>
              {totalDebt >= 100000 && (
                <button
                  type="button"
                  onClick={() => handleQuickAmount(Math.round(totalDebt / 2))}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  50% (Rp {Math.round(totalDebt / 2).toLocaleString("id-ID")})
                </button>
              )}
              <button
                type="button"
                onClick={() => handleQuickAmount(50000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Rp 50.000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(100000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Rp 100.000
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nominal Yang Dibayarkan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={amountStr ? parseInt(amountStr).toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setAmountStr(cleaned);
                }}
                placeholder="0"
                className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 text-base font-black text-slate-900 focus:border-blue-600 outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Remaining Calculation Preview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500">Sisa Utang Setelah Pembayaran</span>
            <span className={`font-black ${remainingAfter <= 0 ? "text-emerald-600" : "text-slate-900"}`}>
              Rp {Math.max(0, remainingAfter).toLocaleString("id-ID")}
            </span>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Cicilan ke-1, via bapak Budi"
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-blue-600 bg-white text-slate-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || amountPaidNum <= 0}
              className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-black text-xs uppercase hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Proses Bayar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
