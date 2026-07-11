import { useState, useEffect, useCallback } from "react";
import { dashboardApi } from "./api";
import { DashboardSummary, GrossProfitReport, RestockSuggestion } from "./types";

export const useDashboardData = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [grossProfit, setGrossProfit] = useState<GrossProfitReport | null>(null);
  const [restockItems, setRestockItems] = useState<RestockSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // Last 7 days including today

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    try {
      const results = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getGrossProfit(startDateStr, endDateStr),
        dashboardApi.getRestock(),
      ]);

      if (results[0].status === "fulfilled") {
        setSummary(results[0].value);
      } else {
        console.error("Gagal mengambil data summary:", results[0].reason);
      }

      if (results[1].status === "fulfilled") {
        setGrossProfit(results[1].value);
      } else {
        console.error("Gagal mengambil data gross profit:", results[1].reason);
      }

      if (results[2].status === "fulfilled") {
        setRestockItems(results[2].value);
      } else {
        console.error("Gagal mengambil data restock suggestions:", results[2].reason);
      }

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.error("Gagal mengambil data dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const voidTrx = useCallback(async (id: number) => {
    try {
      await dashboardApi.voidTransaction(id);
      await fetchData();
    } catch (err) {
      console.error("Gagal membatalkan transaksi:", err);
      throw err;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    grossProfit,
    restockItems,
    isLoading,
    refetch: fetchData,
    lastUpdated,
    voidTrx,
  };
};
