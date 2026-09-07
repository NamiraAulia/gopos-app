"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { ExpenseCategory } from "@/enum";
import { cashierDAO } from "../DAO/cashier.dao";
import { validateExpense } from "../Validation/cashier.validation";
import type { ExpenseDTO } from "../DTO/cashier.dto";

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseData?: ExpenseDTO | any;
}

export const ExpenseModal = ({ isOpen, onClose, onSuccess, expenseData }: ExpenseModalProps) => {
  const [newExpense, setNewExpense] = useState<{
    name: string;
    amount: string;
    category: ExpenseCategory;
  }>({
    name: "",
    amount: "",
    category: ExpenseCategory.OPERATIONAL,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (expenseData && typeof expenseData === "object") {
        setNewExpense({
          name: expenseData.name || "",
          amount: expenseData.amount ? expenseData.amount.toString() : "",
          category: (expenseData.category as ExpenseCategory) || ExpenseCategory.OPERATIONAL,
        });
      } else {
        setNewExpense({
          name: "",
          amount: "",
          category: ExpenseCategory.OPERATIONAL,
        });
      }
    }
  }, [expenseData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!(expenseData && expenseData.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const amountNum = parseInt(newExpense.amount.replace(/\D/g, "") || "0", 10);

    const payload = {
      name: newExpense.name.trim(),
      amount: amountNum,
      category: newExpense.category,
    };

    const validation = validateExpense(payload);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Data pengeluaran tidak valid.");
      setIsLoading(false);
      return;
    }

    try {
      if (isEditMode) {
        await cashierDAO.updateExpense(expenseData.id, payload);
      } else {
        await cashierDAO.createExpense(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Expense operation error:", error);
      setErrorMessage(error.message || "Terjadi kesalahan sistem saat menyimpan pengeluaran.");
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
    setErrorMessage("");
    try {
      await cashierDAO.deleteExpense(expenseData.id);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Expense delete error:", error);
      setErrorMessage(error.message || "Terjadi kesalahan sistem saat menghapus pengeluaran.");
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

        {errorMessage && (
          <div className="px-6 pt-4">
            <p className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              {errorMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Kategori
            </label>
            <select
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold text-slate-700 bg-white"
            >
              <option value={ExpenseCategory.OPERATIONAL}>
                Operasional (Mengurangi Kas Laci)
              </option>
              <option value={ExpenseCategory.INVENTORY}>
                Inventaris (Bukan dari Kas Kasir)
              </option>
              <option value={ExpenseCategory.OTHER}>
                Lainnya (Mengurangi Kas Laci)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Nama / Deskripsi Pengeluaran
            </label>
            <input
              type="text"
              required
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              placeholder="Contoh: Beli Es Batu, Isi Ulang Gas..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Jumlah Uang (Rp)
            </label>
            <input
              type="text"
              required
              value={newExpense.amount}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, "");
                const formatted = clean ? parseInt(clean, 10).toLocaleString("id-ID") : "";
                setNewExpense({ ...newExpense, amount: formatted });
              }}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors font-black text-blue-600 text-lg"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 font-bold hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> HAPUS
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 flex-grow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>MENYIMPAN...</span>
                </>
              ) : (
                "SIMPAN"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
