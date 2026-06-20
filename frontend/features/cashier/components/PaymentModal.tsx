import { useState } from "react";
import { useCartStore } from "../../../store/useCartStore";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
  grandTotal: number;
};

export const PaymentModal = ({ isOpen, onClose, onSuccess, grandTotal }: PaymentModalProps) => {
  const { cart, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const amountPaidNum = parseInt(amountPaid.replace(/\D/g, "")) || 0;
  const change = amountPaidNum - grandTotal;
  const isPaymentValid = cart.length > 0 && (paymentMethod !== "cash" || amountPaidNum >= grandTotal);

  const handleConfirmPayment = async () => {
    if (!isPaymentValid) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,
          qty: item.qty,
          unit_price: Number(item.price),
        })),
        payment_method: paymentMethod,
        amount_paid: paymentMethod === "cash" ? amountPaidNum : grandTotal,
      };

      const response = await fetch(`${API_URL}/api/v1/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        clearCart();
        onSuccess(result.data); // Kirim data transaksi ke halaman utama untuk buka Struk
      } else {
        alert(result.message || "Transaksi gagal.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Gagal menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center mb-6">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Tagihan</p>
          <h2 className="text-3xl font-black text-blue-600 mt-1">
            Rp {grandTotal.toLocaleString("id-ID")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setPaymentMethod("cash")}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-base font-bold transition-all ${paymentMethod === "cash" ? "border-blue-600 bg-blue-700 text-white shadow-md" : "border-slate-200 text-slate-600 bg-white"}`}>
            Tunai
          </button>
          <button onClick={() => setPaymentMethod("qris")}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-base font-bold transition-all ${paymentMethod === "qris" ? "border-blue-600 bg-white text-blue-600 shadow-md" : "border-slate-200 text-slate-600 bg-white"}`}>
            QRIS
          </button>
        </div>

        {paymentMethod === "cash" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Uang Cepat</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setAmountPaid(grandTotal.toString())} className="py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Uang Pas</button>
                <button onClick={() => setAmountPaid("50000")} className="py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Rp 50.000</button>
                <button onClick={() => setAmountPaid("100000")} className="py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Rp 100.000</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Uang Tunai Diterima</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                <input type="text" value={amountPaidNum === 0 ? "" : amountPaidNum.toLocaleString("id-ID")} onChange={(e) => setAmountPaid(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-14 rounded-xl border-2 border-slate-200 pl-12 pr-4 text-xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all" autoFocus />
              </div>
            </div>

            <div className={`mt-2 border-2 rounded-xl p-4 text-center ${change >= 0 ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${change >= 0 ? "text-emerald-700" : "text-slate-500"}`}>Kembalian</p>
              <p className={`text-2xl font-black mt-1 ${change >= 0 ? "text-emerald-600" : "text-slate-400"}`}>
                {change >= 0 ? `Rp ${change.toLocaleString("id-ID")}` : "Rp 0"}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-2">
          <button onClick={handleConfirmPayment} disabled={!isPaymentValid || isLoading}
            className="w-full h-14 rounded-xl bg-blue-700 text-white text-base font-black uppercase tracking-wide hover:bg-blue-800 transition-colors disabled:opacity-50">
            {isLoading ? "Memproses..." : "Selesaikan Transaksi"}
          </button>
          <button onClick={onClose} disabled={isLoading} className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700">
            Batal Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};