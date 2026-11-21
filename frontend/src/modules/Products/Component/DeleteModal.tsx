"use client";

import { Trash2, X, AlertTriangle } from "lucide-react";
import type { Product } from "@/types/api";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  product: Product | null;
  isDeleting: boolean;
}

export function DeleteModal({ isOpen, onClose, onConfirm, product, isDeleting }: DeleteModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4.5 border-b-2 border-slate-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-600">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-lg text-red-900">Konfirmasi Hapus Produk</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-base font-bold text-slate-700 leading-relaxed">
            Apakah Anda yakin ingin menghapus produk <span className="font-black text-slate-900 text-lg">"{product.name}"</span> dari sistem inventori?
          </p>
          <div className="text-sm font-bold text-red-700 bg-red-50 p-4 rounded-xl border-2 border-red-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 stroke-[2.5]" />
            <span>Tindakan ini bersifat permanen dan data stok yang berkaitan akan dihapus dari sistem kasir.</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3.5 justify-end">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="h-12 px-5 border-2 border-slate-300 bg-white rounded-xl text-base font-black text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="h-12 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-base font-black shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus Produk"}
          </button>
        </div>
      </div>
    </div>
  );
}