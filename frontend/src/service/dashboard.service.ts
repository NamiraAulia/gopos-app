import { supabase } from "@/helper/supabaseClient";
import type {
  DashboardSummaryDAO,
  GrossProfitReportDAO,
  RestockSuggestionDAO,
  TransactionDAO,
} from "@/modules/Dashboard/DAO/dashboard.dao";

export async function fetchDashboardSummary(): Promise<DashboardSummaryDAO> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);

  // 1. Transactions Today
  const { data: todayTrx } = await supabase
    .from("transactions")
    .select("total_amount, status")
    .gte("created_at", todayStr + "T00:00:00")
    .eq("status", "completed");

  const today_revenue = (todayTrx || []).reduce((sum, t) => sum + t.total_amount, 0);
  const today_transaction_count = (todayTrx || []).length;

  // 2. Transactions Month
  const { data: monthTrx } = await supabase
    .from("transactions")
    .select("total_amount")
    .gte("created_at", monthStr + "-01T00:00:00")
    .eq("status", "completed");

  const month_revenue = (monthTrx || []).reduce((sum, t) => sum + t.total_amount, 0);

  // 3. Expenses Today
  const { data: todayExp } = await supabase
    .from("expenses")
    .select("amount")
    .gte("created_at", todayStr + "T00:00:00");

  const today_expense = (todayExp || []).reduce((sum, e) => sum + e.amount, 0);

  // 4. Critical Stock Count
  const { count: criticalCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .lte("stock", 5);

  // 5. Recent 5 Transactions
  const { data: recentTrx } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Estimated profit (simplified: 25% margin estimation or revenue - expense)
  const today_profit = Math.round(today_revenue * 0.25) - today_expense;

  return {
    today_revenue,
    today_transaction_count,
    today_profit,
    month_revenue,
    today_expense,
    critical_stock_count: criticalCount || 0,
    recent_transactions: (recentTrx as TransactionDAO[]) || [],
  };
}

export async function fetchGrossProfitReport(): Promise<GrossProfitReportDAO> {
  const daily_profits = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const { data: trx } = await supabase
      .from("transactions")
      .select("total_amount")
      .gte("created_at", dateStr + "T00:00:00")
      .lte("created_at", dateStr + "T23:59:59")
      .eq("status", "completed");

    const revenue = (trx || []).reduce((sum, t) => sum + t.total_amount, 0);
    const gross_profit = Math.round(revenue * 0.25);

    daily_profits.push({
      date: dateStr,
      revenue,
      gross_profit,
    });
  }

  return { daily_profits };
}

export async function fetchDashboardRestockSuggestions(): Promise<RestockSuggestionDAO[]> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("is_active", true)
    .lte("stock", 5)
    .limit(5);

  return (products || []).map((p) => ({
    product_id: p.id,
    product_name: p.name,
    current_stock: p.stock,
    avg_sales_per_day: 1.5,
    days_remaining: p.stock / 1.5,
  }));
}

export async function voidTransaction(id: number): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("transactions")
    .update({ status: "voided" })
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}
