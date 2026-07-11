import api from "@/lib/axios";
import { DashboardSummary, GrossProfitReport, RestockSuggestion } from "./types";

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get("/reports/summary");
    return res.data?.data;
  },

  getGrossProfit: async (startDate?: string, endDate?: string): Promise<GrossProfitReport> => {
    const res = await api.get("/reports/gross-profit", {
      params: { start_date: startDate, end_date: endDate },
    });
    return res.data?.data;
  },

  getRestock: async (): Promise<RestockSuggestion[]> => {
    const res = await api.get("/restock-suggestions");
    return res.data?.data || [];
  },

  voidTransaction: async (id: number): Promise<void> => {
    await api.post(`/transactions/${id}/void`);
  },
};
