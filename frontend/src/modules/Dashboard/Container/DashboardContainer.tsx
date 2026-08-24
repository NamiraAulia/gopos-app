"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDashboardSummary,
  fetchGrossProfitReport,
  fetchDashboardRestockSuggestions,
  voidTransaction,
} from "@/service/dashboard.service";
import { useDashboardStore } from "../Store/useDashboardStore";
import { DashboardView } from "../Component/DashboardView";

export default function DashboardContainer() {
  const queryClient = useQueryClient();
  const { activeTab, setActiveTab, lastUpdated, setLastUpdated } = useDashboardStore();

  // Dashboard Summary
  const {
    data: summary = null,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
  });

  // Gross Profit Report (7 Days)
  const {
    data: grossProfit = null,
    isLoading: isProfitLoading,
    refetch: refetchProfit,
  } = useQuery({
    queryKey: ["grossProfitReport"],
    queryFn: fetchGrossProfitReport,
  });

  // Restock Suggestions
  const {
    data: restockItems = [],
    isLoading: isRestockLoading,
    refetch: refetchRestock,
  } = useQuery({
    queryKey: ["dashboardRestock"],
    queryFn: fetchDashboardRestockSuggestions,
  });

  const isLoading = isSummaryLoading || isProfitLoading || isRestockLoading;

  const voidMutation = useMutation({
    mutationFn: voidTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      queryClient.invalidateQueries({ queryKey: ["grossProfitReport"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardRestock"] });
    },
    onError: (err: any) => {
      alert("Gagal membatalkan transaksi: " + (err.message || "Error"));
    },
  });

  const handleRefetch = () => {
    refetchSummary();
    refetchProfit();
    refetchRestock();
    setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
  };

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    const interval = setInterval(() => {
      handleRefetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVoid = async (id: number) => {
    await voidMutation.mutateAsync(id);
  };

  return (
    <DashboardView
      summary={summary}
      grossProfit={grossProfit}
      restockItems={restockItems}
      isLoading={isLoading}
      refetch={handleRefetch}
      lastUpdated={lastUpdated}
      onVoid={handleVoid}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}
