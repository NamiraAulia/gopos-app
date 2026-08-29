import { supabase } from "@/helper/supabaseClient";
import type { FinancialSummaryDAO, DetailedExpenseDAO } from "@/modules/Finance/DAO/finance.dao";
import type { TransactionDTO as Transaction, ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";

export async function fetchFinancialOverview(): Promise<FinancialSummaryDAO> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayLocalStr = now.toLocaleDateString("en-CA");

  const [resTrx, resExp] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select(`*, user:users(id, name, email)`)
      .order("created_at", { ascending: false }),
  ]);

  if (resTrx.error) throw resTrx.error;
  if (resExp.error) throw resExp.error;

  const transactions = (resTrx.data as Transaction[]) || [];
  const expenses = (resExp.data as Expense[]) || [];

  // Helper untuk membersihkan angka dari string bertitik/berkoma (misal "50.000" atau "Rp 50.000")
  const parseAmount = (val: any): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = String(val).replace(/\D/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  const totalIncome = transactions.reduce((sum, t) => sum + parseAmount(t.total_amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const netProfit = totalIncome - totalExpense;

  const todayExpense = expenses
    .filter((e) => {
      if (!e.created_at) return true;
      const d = new Date(e.created_at);
      if (isNaN(d.getTime())) return true;
      return d.toLocaleDateString("en-CA") === todayLocalStr;
    })
    .reduce((sum, e) => sum + parseAmount(e.amount), 0);

  const monthExpense = expenses
    .filter((e) => {
      if (!e.created_at) return true;
      const d = new Date(e.created_at);
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, e) => sum + parseAmount(e.amount), 0);

  return {
    totalIncome,
    totalExpense,
    netProfit,
    todayExpense,
    monthExpense,
    transactions,
    expenses,
  };
}

export async function deleteExpenseService(id: number): Promise<{ success: boolean }> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
