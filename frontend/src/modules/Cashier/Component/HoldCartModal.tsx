"use client";

import { useState } from "react";
import { X, PlayCircle } from "lucide-react";

type HoldCartModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
};

export const HoldCartModal = ({ isOpen, onClose, onConfirm }: HoldCartModalProps) => {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onConfirm(note.trim());
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5 border-b-2 border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-lg flex items-center gap-2.5">
            <PlayCircle className="h-6 w-6 text-blue-600 stroke-[2.5]" />
            Simpan Keranjang Sementara
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Nama / Catatan Penanda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Meja 4, Budi Baju Merah, dll."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-12 px-4 text-base font-bold border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 bg-white text-slate-900 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm uppercase tracking-wider transition-colors cursor-pointer border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!note.trim()}
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Simpan Keranjang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
