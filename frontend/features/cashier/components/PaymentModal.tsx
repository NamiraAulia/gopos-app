"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "../../../store/useCartStore"; 
import { useCheckoutMutation } from "../hooks";
import { Banknote, CreditCard, Landmark } from "lucide-react";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
  grandTotal: number;
  onShiftRequired: () => void;
  memberId?: number;
  discountAmount?: number;
};

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  grandTotal,
  onShiftRequired,
  memberId,
  discountAmount,
}: PaymentModalProps) => {
  const { cart, clearCart } = useCartStore();
  const { mutateCheckout, isLoading } = useCheckoutMutation();

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [bankInfo, setBankInfo] = useState("");
  const [refNumber, setRefNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmountPaid("");
      setBankInfo("");
      setRefNumber("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const amountPaidNum = parseInt(amountPaid.replace(/\D/g, "")) || 0;
  const change = amountPaidNum - grandTotal;
  const isPaymentValid =
    cart.length > 0 &&
    (paymentMethod !== "CASH" || amountPaidNum >= grandTotal);

  const getQuickAmounts = (total: number): number[] => {
    let steps = [50000, 100000, 200000, 500000];
    if (total < 10000) {
      steps = [10000, 20000, 50000];
    } else if (total < 20000) {
      steps = [20000, 50000, 100000];
    } else if (total < 50000) {
      steps = [50000, 100000, 200000];
    } else {
      steps = [50000, 100000, 200000, 500000];
    }
    
    const candidates = steps.map(step => Math.ceil(total / step) * step);
    const uniqueCandidates = Array.from(new Set(candidates)).filter(val => val >= total).sort((a, b) => a - b);
    return uniqueCandidates.slice(0, 3);
  };

  const handleConfirmPayment = async () => {
    if (!isPaymentValid || isLoading) return;

    const payload = {
      items: cart.map((item) => ({
        product_id: Number(item.id),
        qty: Number(item.qty), 
        unit_price:
          item.unit_choice === "big"
            ? Number(item.price_big)
            : Number(item.price),
        unit_choice: item.unit_choice || "small", 
      })),
      payment_method: paymentMethod.toLowerCase() as "cash" | "qris" | "transfer",
      amount_paid: paymentMethod === "CASH" ? amountPaidNum : grandTotal,
      member_id: memberId || undefined,
      discount_amount: discountAmount || 0,
    };

    const result = await mutateCheckout(payload);

    if (result.success && result.data) {
      clearCart();
      onSuccess(result.data);
    } else {
      alert(result.message || "Transaksi gagal.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center mb-6">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Total Tagihan
          </p>
          <h2 className="text-3xl font-black text-blue-600 mt-1">
            Rp {grandTotal.toLocaleString("id-ID")}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`py-3.5 rounded-xl border-2 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${paymentMethod === "CASH" ? "border-blue-600 bg-blue-600 text-white shadow-md" : "border-slate-200 text-slate-600 bg-white"}`}
          >
            <Banknote className="h-4 w-4 shrink-0" /> TUNAI
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("QRIS")}
            className={`py-3.5 rounded-xl border-2 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${paymentMethod === "QRIS" ? "border-blue-600 bg-blue-600 text-white shadow-md" : "border-slate-200 text-slate-600 bg-white"}`}
          >
            <CreditCard className="h-4 w-4 shrink-0" /> QRIS/DEBIT
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("TRANSFER")}
            className={`py-3.5 rounded-xl border-2 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${paymentMethod === "TRANSFER" ? "border-blue-600 bg-blue-600 text-white shadow-md" : "border-slate-200 text-slate-600 bg-white"}`}
          >
            <Landmark className="h-4 w-4 shrink-0" /> TRANSFER
          </button>
        </div>

        {paymentMethod === "CASH" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Uang Cepat
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setAmountPaid(grandTotal.toString())}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border-2 ${
                    amountPaidNum === grandTotal
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                  }`}
                >
                  Uang Pas
                </button>
                {getQuickAmounts(grandTotal).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaid(amt.toString())}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border-2 ${
                      amountPaidNum === amt
                        ? "border-blue-600 text-blue-600 bg-blue-50"
                        : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    Rp {amt.toLocaleString("id-ID")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Uang Tunai Diterima
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  Rp
                </span>
                <input
                  type="text"
                  value={
                    amountPaidNum === 0
                      ? ""
                      : amountPaidNum.toLocaleString("id-ID")
                  }
                  onChange={(e) =>
                    setAmountPaid(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full h-14 rounded-xl border-2 border-slate-200 pl-12 pr-4 text-xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div
              className={`mt-2 border-2 rounded-xl p-4 text-center ${change >= 0 ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider ${change >= 0 ? "text-emerald-700" : "text-slate-500"}`}
              >
                Kembalian
              </p>
              <p
                className={`text-2xl font-black mt-1 ${change >= 0 ? "text-emerald-600" : "text-slate-400"}`}
              >
                {change >= 0 ? `Rp ${change.toLocaleString("id-ID")}` : "Rp 0"}
              </p>
            </div>
          </div>
        )}

        {paymentMethod === "TRANSFER" && (
          <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Informasi Bank / Rekening Tujuan
              </label>
              <input
                type="text"
                placeholder="Contoh: BCA - Rekening Toko (123456)"
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nomor Referensi / Nama Pengirim (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Ref 98765 atau a/n Budi"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={!isPaymentValid || isLoading}
            className="w-full h-14 rounded-xl bg-blue-600 text-white text-base font-black uppercase tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Selesaikan Transaksi"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700"
          >
            Batal Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};
