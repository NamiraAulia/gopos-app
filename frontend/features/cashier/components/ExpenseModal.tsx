import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import api from "@/lib/axios";

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseData?: any;
}

export const ExpenseModal = ({ isOpen, onClose, onSuccess, expenseData }: ExpenseModalProps) => {
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "Operasional" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (expenseData && typeof expenseData === "object") {
        setNewExpense({
          name: expenseData.name || "",
          amount: expenseData.amount ? expenseData.amount.toString() : "",
          category: expenseData.category || "Operasional"
        });
      } else {
        setNewExpense({ name: "", amount: "", category: "Operasional" });
      }
    }
  }, [expenseData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!(expenseData && expenseData.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      name: newExpense.name,
      amount: parseInt(newExpense.amount.replace(/\D/g, "") || "0", 10),
      category: newExpense.category
    };

    try {
      let res;
      if (isEditMode) {
        res = await api.put(`/expenses/${expenseData.id}`, payload);
      } else {
        res = await api.post("/expenses", payload);
      }

      if (res.data?.success || res.status === 200 || res.status === 201) {
        onSuccess();
        onClose();
      } else {
        alert(isEditMode ? "Gagal mengubah pengeluaran" : "Gagal mencatat pengeluaran");
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Terjadi kesalahan sistem.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseData || !expenseData.id) return;

    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.delete(`/expenses/${expenseData.id}`);
      if (res.data?.success || res.status === 200) {
        onSuccess();
        onClose();
      } else {
        alert("Gagal menghapus pengeluaran");
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Terjadi kesalahan sistem saat menghapus.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-900 uppercase tracking-tight">
            {isEditMode ? "Ubah Catatan Pengeluaran" : "Catat Pengeluaran Baru"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nama Pengeluaran</label>
            <input
              type="text"
              required
              className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-red-500 outline-none font-bold"
              placeholder="Contoh: Bayar Listrik Toko"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nominal (Rp)</label>
            <input
              type="text"
              required
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

          <div className="flex gap-3 mt-4">
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 h-14 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors border border-red-200"
                title="Hapus Pengeluaran"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              disabled={isLoading}
              className="flex-1 h-14 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 transition-all uppercase tracking-widest"
            >
              {isLoading ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Pengeluaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
