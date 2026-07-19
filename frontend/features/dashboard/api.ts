import { supabase } from "@/utils/supabaseClient";
import { DashboardSummary, GrossProfitReport, RestockSuggestion } from "./types";

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    // 1. Define start/end dates for today and this month
    const now = new Date();
    
    // Set to local day bounds (00:00:00 to 23:59:59)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0).toISOString();

    // Query today's completed transactions
    const { data: todayTxs, error: err1 } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (err1) throw err1;
    const todayRevenue = todayTxs?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0;
    const todayTransactionCount = todayTxs?.length || 0;

    // Query this month's completed transactions
    const { data: monthTxs, error: err2 } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd);

    if (err2) throw err2;
    const monthRevenue = monthTxs?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0;

    // Query total completed sales count
    const { count: totalSales, error: err3 } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    if (err3) throw err3;

    // Query 5 most recent completed transactions
    const { data: recentTransactions, error: err4 } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5);

    if (err4) throw err4;

    // Query today's expenses
    const { data: expenses, error: err5 } = await supabase
      .from("expenses")
      .select("amount")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (err5) throw err5;
    const todayExpense = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

    // Query critical stock count (stock <= 5 and active)
    const { count: criticalStockCount, error: err6 } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("stock", 5);

    if (err6) throw err6;

    return {
      today_revenue: todayRevenue,
      month_revenue: monthRevenue,
      total_sales: totalSales || 0,
      today_transaction_count: todayTransactionCount,
      today_expense: todayExpense,
      today_profit: todayRevenue - todayExpense,
      critical_stock_count: criticalStockCount || 0,
      recent_transactions: (recentTransactions as any[]) || [],
    };
  },

  getGrossProfit: async (startDate?: string, endDate?: string): Promise<GrossProfitReport> => {
    const todayStr = new Date().toISOString().split("T")[0];
    const sDate = startDate || todayStr;
    const eDate = endDate || todayStr;

    const startT = sDate + "T00:00:00";
    const endT = eDate + "T23:59:59";

    // Query transaction items for completed transactions in range
    const { data, error } = await supabase
      .from("transaction_items")
      .select(`
        product_id,
        product_name,
        qty,
        subtotal,
        product:products(best_price),
        transaction:transactions!inner(status, created_at)
      `)
      .eq("transaction.status", "completed")
      .gte("transaction.created_at", startT)
      .lte("transaction.created_at", endT);

    if (error) throw error;

    const productMap: Record<number, {
      product_id: number;
      product_name: string;
      qty_sold: number;
      revenue: number;
      cogs: number;
      profit: number;
    }> = {};

    let totalRevenue = 0;
    let totalCogs = 0;

    const dailyMap: Record<string, {
      date: string;
      revenue: number;
      cogs: number;
      gross_profit: number;
    }> = {};

    (data || []).forEach((item: any) => {
      const qty = item.qty || 0;
      const subtotal = item.subtotal || 0;
      const bestPrice = item.product?.best_price || 0;
      const cogs = bestPrice * qty;
      const profit = subtotal - cogs;

      totalRevenue += subtotal;
      totalCogs += cogs;

      // Product breakdown
      const pid = item.product_id;
      if (!productMap[pid]) {
        productMap[pid] = {
          product_id: pid,
          product_name: item.product_name || "Produk",
          qty_sold: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
      }
      productMap[pid].qty_sold += qty;
      productMap[pid].revenue += subtotal;
      productMap[pid].cogs += cogs;
      productMap[pid].profit += profit;

      // Daily mapping
      const txDate = item.transaction?.created_at ? item.transaction.created_at.split("T")[0] : "";
      if (txDate) {
        if (!dailyMap[txDate]) {
          dailyMap[txDate] = {
            date: txDate,
            revenue: 0,
            cogs: 0,
            gross_profit: 0,
          };
        }
        dailyMap[txDate].revenue += subtotal;
        dailyMap[txDate].cogs += cogs;
        dailyMap[txDate].gross_profit += profit;
      }
    });

    const productsBreakdown = Object.values(productMap).sort((a, b) => b.profit - a.profit);
    const dailyProfits = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      start_date: sDate,
      end_date: eDate,
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      gross_profit: totalRevenue - totalCogs,
      products: productsBreakdown,
      daily_profits: dailyProfits,
    };
  },

  getRestock: async (): Promise<RestockSuggestion[]> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Fetch active products
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (prodErr) throw prodErr;

    // Fetch transaction items for completed transactions in the last 7 days
    const { data: txItems, error: txErr } = await supabase
      .from("transaction_items")
      .select(`
        product_id,
        qty,
        transaction:transactions!inner(status, created_at)
      `)
      .eq("transaction.status", "completed")
      .gte("transaction.created_at", sevenDaysAgoStr);

    if (txErr) throw txErr;

    // Map of sales per product_id
    const salesMap: Record<number, number> = {};
    (txItems || []).forEach((item: any) => {
      const pid = item.product_id;
      salesMap[pid] = (salesMap[pid] || 0) + (item.qty || 0);
    });

    const suggestions: RestockSuggestion[] = [];

    (products || []).forEach((p: any) => {
      const totalQtySold = salesMap[p.id] || 0;
      const avgSalesPerDay = totalQtySold / 7.0;
      const currentStock = p.stock || 0;
      
      const daysRemaining = totalQtySold > 0 ? (currentStock / avgSalesPerDay) : 999.0;

      // Dead Stock filtering
      if (!(daysRemaining <= 3.0 || (currentStock <= 5 && avgSalesPerDay > 0))) {
        return;
      }

      const shelfLife = p.shelf_life_days || 30;
      let riskTier: "low" | "medium" | "high" = "low";
      let targetCoverage = 14;

      if (shelfLife <= 14) {
        riskTier = "high";
        targetCoverage = 3;
      } else if (shelfLife <= 90) {
        riskTier = "medium";
        targetCoverage = 7;
      }

      const dailyDemand = avgSalesPerDay;
      const weeklyDemand = avgSalesPerDay * 7.0;

      let recPcs = Math.ceil((avgSalesPerDay * targetCoverage) - currentStock);
      if (recPcs < 0) recPcs = 0;

      let maxPcs = Math.ceil((avgSalesPerDay * shelfLife) - currentStock);
      if (maxPcs < 0) maxPcs = 0;

      let recBig = 0;
      let maxBig = 0;
      if (p.conversion > 0) {
        recBig = Math.ceil(recPcs / p.conversion);
        maxBig = Math.ceil(maxPcs / p.conversion);
      }

      suggestions.push({
        product_id: p.id,
        product_name: p.name,
        current_stock: currentStock,
        avg_sales_per_day: avgSalesPerDay,
        days_remaining: daysRemaining,
        supplier_name: p.supplier_name || "",
        conversion: p.conversion || 1,
        unit: p.unit || "pcs",
        unit_big: p.unit_big || "box",
        shelf_life_days: shelfLife,
        expiry_date: p.expiry_date,
        daily_demand: dailyDemand,
        weekly_demand: weeklyDemand,
        recommend_qty: recPcs,
        recommend_big_qty: recBig,
        max_safe_qty: maxPcs,
        max_safe_big_qty: maxBig,
        risk_tier: riskTier,
      });
    });

    return suggestions.sort((a, b) => a.days_remaining - b.days_remaining);
  },

  voidTransaction: async (id: number): Promise<void> => {
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (txErr || !tx) throw new Error("Transaksi tidak ditemukan.");
    if (tx.status !== "completed") throw new Error("Hanya transaksi berstatus completed yang bisa dibatalkan.");

    const { data: items } = await supabase
      .from("transaction_items")
      .select("*")
      .eq("transaction_id", id);

    if (items) {
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const qtyRestored = item.conversion_used * item.qty;
          await supabase
            .from("products")
            .update({ stock: product.stock + qtyRestored })
            .eq("id", item.product_id);
        }
      }
    }

    const { error } = await supabase
      .from("transactions")
      .update({ status: "voided" })
      .eq("id", id);

    if (error) throw error;

    if (tx.payment_method === "cash") {
      const { data: activeShift } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", tx.user_id)
        .eq("status", "open")
        .maybeSingle();

      if (activeShift) {
        await supabase
          .from("shifts")
          .update({
            total_cash_expected: activeShift.total_cash_expected - tx.total_amount,
          })
          .eq("id", activeShift.id);
      }
    }
  },
};
