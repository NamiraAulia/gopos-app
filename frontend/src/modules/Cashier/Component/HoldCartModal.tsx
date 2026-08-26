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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            Simpan Keranjang
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Nama / Catatan Penanda
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Meja 4, Budi Baju Merah, dll."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 px-4 text-sm font-semibold border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 bg-white text-slate-800 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!note.trim()}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
