import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { supabase } from "@/helper/supabaseClient";

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

    const amountNum = parseInt(newExpense.amount.replace(/\D/g, "") || "0", 10);
    const payload = {
      name: newExpense.name,
      amount: amountNum,
      category: newExpense.category
    };

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("User tidak terautentikasi.");
      
      const { data: profile, error: profErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", authUser.email)
        .single();

      if (profErr || !profile) throw new Error("Profil pengguna tidak ditemukan.");
      const userId = profile.id;

      if (isEditMode) {
        // Fetch old expense to adjust shift expected cash
        const { data: oldExpense } = await supabase
          .from("expenses")
          .select("amount, category")
          .eq("id", expenseData.id)
          .single();

        const oldAmount = oldExpense?.amount || 0;

        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", expenseData.id);

        if (error) throw error;

        // Adjust expected shift cash if category is Operasional/Lainnya
        if (payload.category.toLowerCase() === "operasional" || payload.category.toLowerCase() === "lainnya") {
          const { data: activeShift } = await supabase
            .from("shifts")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "open")
            .maybeSingle();

          if (activeShift) {
            const difference = payload.amount - oldAmount;
            await supabase
              .from("shifts")
              .update({
                total_cash_expected: activeShift.total_cash_expected - difference,
              })
              .eq("id", activeShift.id);
          }
        }
      } else {
        // Insert new expense
        const { error } = await supabase
          .from("expenses")
          .insert({
            user_id: userId,
            ...payload
          });

        if (error) throw error;

        // Adjust expected shift cash if category is Operasional/Lainnya
        if (payload.category.toLowerCase() === "operasional" || payload.category.toLowerCase() === "lainnya") {
          const { data: activeShift } = await supabase
            .from("shifts")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "open")
            .maybeSingle();

          if (activeShift) {
            await supabase
              .from("shifts")
              .update({
                total_cash_expected: activeShift.total_cash_expected - payload.amount,
              })
              .eq("id", activeShift.id);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem.");
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("User tidak terautentikasi.");
      
      const { data: profile, error: profErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", authUser.email)
        .single();

      if (profErr || !profile) throw new Error("Profil pengguna tidak ditemukan.");
      const userId = profile.id;

      // Fetch old expense for shift adjustment
      const { data: oldExpense } = await supabase
        .from("expenses")
        .select("amount, category")
        .eq("id", expenseData.id)
        .single();

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseData.id);

      if (error) throw error;

      if (oldExpense) {
        if (oldExpense.category.toLowerCase() === "operasional" || oldExpense.category.toLowerCase() === "lainnya") {
          const { data: activeShift } = await supabase
            .from("shifts")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "open")
            .maybeSingle();

          if (activeShift) {
            await supabase
              .from("shifts")
              .update({
                total_cash_expected: activeShift.total_cash_expected + oldExpense.amount,
              })
              .eq("id", activeShift.id);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat menghapus.");
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Kategori
            </label>
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold text-slate-700 bg-white"
            >
              <option value="Operasional">Operasional (Mengurangi Kas Laci)</option>
              <option value="Inventaris">Inventaris (Bukan dari Kas Kasir)</option>
              <option value="Lainnya">Lainnya (Mengurangi Kas Laci)</option>
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
              className="flex-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors disabled:opacity-50 flex-grow"
            >
              {isLoading ? "MENYIMPAN..." : "SIMPAN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
