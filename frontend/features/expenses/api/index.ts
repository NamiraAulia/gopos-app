import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { Expense } from "../types";

export const expensesApi = {
  getExpenses: async (limit = 100): Promise<ApiResponse<Expense[]>> => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          user:users(id, name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        message: "Pengeluaran berhasil diambil",
        data: (data as Expense[]) || [],
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal mengambil data pengeluaran",
        data: [],
        meta: null,
      };
    }
  },
};
