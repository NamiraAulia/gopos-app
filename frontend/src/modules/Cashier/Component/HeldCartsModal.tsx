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
    deleteHeldCart(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b-2 border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <FolderOpen className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xl">
                Keranjang Tersimpan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">
                Daftar transaksi tertunda yang siap dibuka kembali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {heldCarts.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <FolderOpen className="h-8 w-8 stroke-[2]" />
              </div>
              <p className="font-black text-slate-800 text-lg">Tidak Ada Keranjang Tersimpan</p>
              <p className="text-sm text-slate-500 font-bold max-w-xs">
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
                  onClick={() => handleRecall(item.id)}
                  className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 shadow-sm flex items-center justify-between gap-4 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-base sm:text-lg text-slate-900 truncate">
                        {item.note}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-black text-slate-600 border border-slate-200">
                        {formatTime(item.heldAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 font-bold">
                      <span>{totalItems} barang</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      {item.selectedMember ? (
                        <span className="text-blue-700 font-black">
                          Member: {item.selectedMember.name}
                        </span>
                      ) : (
                        <span className="text-slate-500">Pelanggan Umum</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Total Tagihan
                      </p>
                      <p className="text-base sm:text-lg font-black text-blue-700 mt-0.5">
                        Rp {totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id, item.note);
                        }}
                        className="h-11 w-11 rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus keranjang ditunda"
                      >
                        <Trash2 className="h-5 w-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="h-12 px-6 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-white text-sm sm:text-base font-black transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
