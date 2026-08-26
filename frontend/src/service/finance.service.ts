import { supabase } from "@/helper/supabaseClient";
import type { FinancialSummaryDAO, DetailedExpenseDAO } from "@/modules/Finance/DAO/finance.dao";
import type { TransactionDTO as Transaction, ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";

export async function fetchFinancialOverview(): Promise<FinancialSummaryDAO> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);

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

  const totalIncome = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const todayExpense = expenses
    .filter((e) => e.created_at && e.created_at.slice(0, 10) === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthExpense = expenses
    .filter((e) => e.created_at && e.created_at.slice(0, 7) === monthStr)
    .reduce((sum, e) => sum + e.amount, 0);

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
