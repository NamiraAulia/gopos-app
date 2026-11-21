"use client";

import { useState } from "react";
import { X, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/helper/supabaseClient";
import type { MemberDTO as Member } from "../DTO/member.dto";

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSuccess: () => void;
}

export function RepaymentModal({ isOpen, onClose, member, onSuccess }: RepaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = Number(amount);
    if (isNaN(payNum) || payNum <= 0) return;

    setLoading(true);
    try {
      const currentDebt = member.total_debt || 0;
      const newDebt = Math.max(0, currentDebt - payNum);

      await supabase
        .from("members")
        .update({ total_debt: newDebt })
        .eq("id", member.id);

      await supabase.from("debt_logs").insert({
        member_id: member.id,
        type: "repayment",
        amount: payNum,
        remaining_debt: newDebt,
        payment_method: "cash",
        notes: `Pelunasan kasbon Rp ${payNum.toLocaleString("id-ID")}`,
        created_at: new Date().toISOString(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Gagal memproses pelunasan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 border-2 border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Wallet className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xl">Pelunasan Kasbon</h3>
              <p className="text-xs sm:text-sm font-bold text-slate-500">Bayar cicilan atau lunas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-xs sm:text-sm font-black text-blue-700 uppercase tracking-wider">Member: {member.name}</p>
            <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1">
              Sisa Utang: Rp {(member.total_debt || 0).toLocaleString("id-ID")}
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Nominal Pembayaran (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full h-14 px-4 bg-white border-2 border-slate-300 rounded-xl text-xl sm:text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-all font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 h-12 border-2 border-slate-200 bg-white hover:bg-slate-50 text-sm sm:text-base font-black text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !amount || Number(amount) <= 0}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Proses Bayar</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
