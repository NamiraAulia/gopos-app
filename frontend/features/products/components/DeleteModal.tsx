"use client";

import { Trash2, X } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-4 w-4" />
            <h3 className="font-bold text-sm">Konfirmasi Hapus</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus produk <span className="font-black text-slate-900">"{product.name}"</span> dari sistem inventori?
          </p>
          <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-2 rounded-lg border border-red-100/50">
            ⚠ Tindakan ini bersifat permanen dan data stok yang berkaitan akan dihapus dari sistem kasir.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus Produk"}
          </button>
        </div>
      </div>
    </div>
  );
}