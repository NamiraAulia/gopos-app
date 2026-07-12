"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { cashierApi } from "../api";

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
    const qty = Math.max(1, Math.min(max, val));
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
      const res = await cashierApi.refundTransaction(transaction.id, {
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-amber-600">
            <RotateCcw className="h-5 w-5" />
            <div>
              <h3 className="font-bold text-sm">Proses Retur Barang</h3>
              <p className="text-[10px] text-slate-400 font-medium">#{transaction.transaction_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Pilih Item Yang Diretur
              </label>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/30">
                {(transaction.items || []).map((item) => {
                  const isChecked = !!selectedItems[item.product_id];
                  const currentQty = refundQtys[item.product_id] || 1;

                  return (
                    <div
                      key={item.product_id}
                      className={`p-3.5 flex items-center justify-between transition-colors ${isChecked ? "bg-blue-50/30" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`item-${item.product_id}`}
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.product_id)}
                          className="size-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`item-${item.product_id}`}
                          className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                        >
                          <p className="leading-snug">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Beli: {item.qty} {item.unit_choice === "big" ? "grosir" : "pcs"} · Rp {item.unit_price.toLocaleString("id-ID")}
                          </p>
                        </label>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 mr-1">Qty Retur:</span>
                          <input
                            type="number"
                            min="1"
                            max={item.qty}
                            value={currentQty}
                            onChange={(e) => handleQtyChange(item.product_id, parseInt(e.target.value, 10) || 1, item.qty)}
                            className="w-16 h-8 text-center text-xs font-black border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Alasan Retur (Wajib)
              </label>
              <textarea
                required
                rows={2}
                placeholder="Contoh: Barang cacat/rusak, salah input barang oleh kasir, dll..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs font-bold border-2 border-slate-200 rounded-xl p-3 focus:border-blue-600 outline-none transition-all resize-none placeholder:text-slate-300"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
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
