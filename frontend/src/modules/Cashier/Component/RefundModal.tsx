"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { cashierDAO } from "../DAO/cashier.dao";

// We define compatible local interface for Transaction details
interface TransactionItem {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  qty: number;
  subtotal: number;
  unit_choice: string;
}

interface Transaction {
  id: number;
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  status: string;
  created_at: string;
  items?: any[];
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: Transaction | null;
}

export const RefundModal = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: RefundModalProps) => {
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});
  const [refundQtys, setRefundQtys] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setSelectedItems({});
      const initialQtys: Record<number, number> = {};
      (transaction.items || []).forEach((item) => {
        initialQtys[item.product_id] = 1;
      });
      setRefundQtys(initialQtys);
      setReason("");
      setErrorMsg("");
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handleToggleSelect = (productId: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleQtyChange = (productId: number, val: number, max: number) => {
    const qty = Math.max(0.0001, Math.min(max, val));
    setRefundQtys((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const itemsToRefund = (transaction.items || [])
      .filter((item) => selectedItems[item.product_id])
      .map((item) => ({
        product_id: item.product_id,
        qty_refunded: refundQtys[item.product_id] || 1,
      }));

    if (itemsToRefund.length === 0) {
      setErrorMsg("Pilih minimal satu item untuk diretur.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Alasan retur harus diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await cashierDAO.refundTransaction(transaction.id, {
        reason: reason.trim(),
        items: itemsToRefund,
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message || "Gagal memproses retur barang.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Terjadi kesalahan koneksi atau server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 text-amber-700">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
              <RotateCcw className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-900">Proses Retur Barang</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-bold font-mono">Nota: #{transaction.transaction_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            
            {errorMsg && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold px-4 py-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                Pilih Item Yang Diretur
              </label>
              <div className="border-2 border-slate-200 rounded-xl divide-y-2 divide-slate-100 overflow-hidden bg-slate-50/30">
                {(transaction.items || []).map((item) => {
                  const isChecked = !!selectedItems[item.product_id];
                  const currentQty = refundQtys[item.product_id] || 1;

                  return (
                    <div
                      key={item.product_id}
                      className={`p-4 flex items-center justify-between transition-colors ${isChecked ? "bg-blue-50/40" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="checkbox"
                          id={`item-${item.product_id}`}
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.product_id)}
                          className="size-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`item-${item.product_id}`}
                          className="text-sm sm:text-base font-black text-slate-900 cursor-pointer select-none"
                        >
                          <p className="leading-snug">{item.product_name}</p>
                          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">
                            Beli: {item.qty} {item.unit_choice === "big" ? "grosir" : "pcs"} · Rp {item.unit_price.toLocaleString("id-ID")}
                          </p>
                        </label>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-600 mr-1">Qty Retur:</span>
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            max={item.qty}
                            value={currentQty}
                            onChange={(e) => handleQtyChange(item.product_id, parseFloat(e.target.value) || 0.1, item.qty)}
                            className="w-20 h-10 text-center text-sm sm:text-base font-black border-2 border-slate-300 rounded-xl focus:border-blue-600 outline-none transition-all bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                Alasan Retur <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Barang cacat/rusak, salah input barang oleh kasir, dll..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm sm:text-base font-bold border-2 border-slate-300 rounded-xl p-3.5 focus:border-blue-600 outline-none transition-all resize-none placeholder:text-slate-300 bg-white"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t-2 border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="h-12 px-5 border-2 border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm sm:text-base font-black text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm sm:text-base font-black transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <RotateCcw className="h-5 w-5 stroke-[2.5]" />
                  Proses Retur
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
