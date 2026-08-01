import { useState } from "react";
import { X } from "lucide-react";
import { ExpenseModalProps } from "../types";

export const ExpenseModal = ({ isOpen, onClose, onSuccess }: ExpenseModalProps) => {
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "Operasional" });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/v1/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newExpense.name,
          amount: parseInt(newExpense.amount.replace(/\D/g, "") || "0", 10), // Masking aman
          category: newExpense.category
        }),
      });

      if (response.ok) {
        setNewExpense({ name: "", amount: "", category: "Operasional" });
        onSuccess(); // Refresh data di page utama
        onClose();   // Tutup modal
      } else {
        alert("Gagal mencatat pengeluaran");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Tambah Pengeluaran</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleAddExpense} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nama Pengeluaran</label>
            <input
              type="text" required
              className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-red-500 outline-none font-bold"
              placeholder="Contoh: Bayar Listrik Toko"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nominal (Rp)</label>
            <input
              type="text" required
              className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-red-500 outline-none font-bold text-red-600"
              placeholder="0"
              value={newExpense.amount === "" ? "" : Number(newExpense.amount).toLocaleString("id-ID")}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
            <select
              className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-red-500 outline-none font-bold bg-white"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            >
              <option value="Operasional">Operasional</option>
              <option value="Suplai">Suplai / Restock</option>
              <option value="Gaji">Gaji Pegawai</option>
              <option value="Sewa">Sewa Tempat</option>
            </select>
          </div>
          <button 
            disabled={isLoading}
            className="w-full h-14 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 transition-all uppercase tracking-widest mt-4"
          >
            {isLoading ? "Menyimpan..." : "Simpan Pengeluaran"}
          </button>
        </form>
      </div>
    </div>
  );
};