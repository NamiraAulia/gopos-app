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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">Pelunasan Kasbon</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-xs font-semibold text-blue-700">Member: {member.name}</p>
            <p className="text-sm font-bold text-blue-900 mt-0.5">
              Sisa Utang: Rp {(member.total_debt || 0).toLocaleString("id-ID")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nominal Pembayaran (Rp)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Proses Bayar</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
