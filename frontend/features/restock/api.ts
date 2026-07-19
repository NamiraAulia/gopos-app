import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { RestockItem } from "./types";

export const restockApi = {
  getRestockSuggestions: async (): Promise<ApiResponse<RestockItem[]>> => {
    try {
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

      const suggestions: RestockItem[] = [];

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

      const sortedSuggestions = suggestions.sort((a, b) => a.days_remaining - b.days_remaining);

      return {
        success: true,
        message: "Rekomendasi restok berhasil dihitung",
        data: sortedSuggestions,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal menghitung rekomendasi restok",
        data: [],
        meta: null,
      };
    }
  },
};
