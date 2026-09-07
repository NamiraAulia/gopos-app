"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { PaymentMethod } from "@/enum";
import { memberDAO } from "../../Member/DAO/member.dao";
import { validateRepaymentInput } from "../../Member/Validation/member.validation";
import type { MemberDTO as Member } from "../../Member/DTO/member.dto";

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSuccess: () => void;
}

export function RepaymentModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: RepaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !member) return null;

  const currentDebt = Number(member.total_debt) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const payNum = Number(amount);
    const validation = validateRepaymentInput(payNum, currentDebt);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Nominal pembayaran tidak valid.");
      return;
    }

    setLoading(true);
    try {
      await memberDAO.repayDebt(member.id, {
        amount: payNum,
        payment_method: PaymentMethod.CASH,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses pelunasan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">Pelunasan Kasbon</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-xs font-semibold text-blue-700">
              Member: {member.name}
            </p>
            <p className="text-sm font-bold text-blue-900 mt-0.5">
              Sisa Utang: Rp {currentDebt.toLocaleString("id-ID")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Nominal Pembayaran (Rp)
            </label>
            <input
              type="number"
              required
              min={1}
              max={currentDebt}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Proses Bayar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
