"use client";

import { useCartStore } from "../../../store/useCartStore";
import { X, FolderOpen, ArrowRight, Trash2 } from "lucide-react";

type HeldCartsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const HeldCartsModal = ({ isOpen, onClose }: HeldCartsModalProps) => {
  const { heldCarts, recallCart, deleteHeldCart } = useCartStore();

  if (!isOpen) return null;

  // Format time held
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  // Helper to calculate held cart total
  const getCartTotal = (items: any[], member: any) => {
    return items.reduce((sum, item) => {
      const isBig = item.unit_choice === "big" && item.price_big > 0;
      const isMemberPrice = !isBig && member && item.price_member > 0;
      const harga =
        item.custom_price != null && item.custom_price > 0
          ? item.custom_price
          : isBig
          ? item.price_big
          : isMemberPrice
          ? item.price_member
          : item.price;
      return sum + harga * item.qty;
    }, 0);
  };

  const handleRecall = (id: string) => {
    recallCart(id);
    onClose();
  };

  const handleDelete = (id: string, note: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus keranjang "${note}"?`)) {
      deleteHeldCart(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              Keranjang Tersimpan
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Daftar transaksi tertunda yang siap dibuka kembali
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {heldCarts.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FolderOpen className="h-5 w-5" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Tidak Ada Keranjang Tersimpan</p>
              <p className="text-xs text-slate-400 font-medium max-w-xs">
                Keranjang yang ditunda penanganannya akan tercatat di sini.
              </p>
            </div>
          ) : (
            heldCarts.map((item) => {
              const totalAmount = getCartTotal(item.items, item.selectedMember);
              const totalItems = item.items.reduce((sum, it) => sum + it.qty, 0);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white shadow-sm flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-800 truncate">
                        {item.note}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">
                        {formatTime(item.heldAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
                      <span>{totalItems} barang</span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      {item.selectedMember ? (
                        <span className="text-blue-600 font-semibold">
                          Member: {item.selectedMember.name}
                        </span>
                      ) : (
                        <span>Pelanggan Umum</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Tagihan
                      </p>
                      <p className="text-sm font-black text-blue-600 mt-0.5">
                        Rp {totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRecall(item.id)}
                        className="h-9 px-3.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                        title="Buka kembali keranjang"
                      >
                        Buka <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.note)}
                        className="h-9 w-9 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus keranjang ditunda"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
