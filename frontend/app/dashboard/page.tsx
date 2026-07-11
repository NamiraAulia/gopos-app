"use client";

import { useEffect } from "react";
import { LayoutDashboard, ChevronRight, RefreshCw, Clock } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useDashboardData } from "@/features/dashboard/hooks";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { SalesChart } from "@/features/dashboard/components/SalesChart";
import { RecentTransactionsTable } from "@/features/dashboard/components/RecentTransactionTable";
import { StockAlertCard } from "@/features/dashboard/components/StockAlertCard";

export default function DashboardPage() {
  const {
    summary,
    grossProfit,
    restockItems,
    isLoading,
    refetch,
    lastUpdated,
    voidTrx,
  } = useDashboardData();

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <LayoutDashboard className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Dashboard Utama</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            {lastUpdated && (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">Terakhir diperbarui:</span>
                <span className="font-bold text-slate-600">{lastUpdated}</span>
              </div>
            )}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-1.5 font-bold text-slate-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
              Segarkan
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Title Area */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Ringkasan Bisnis</h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Laporan performa tokomu secara real-time.</p>
            </div>
            
            {/* Timestamp for small screen */}
            {lastUpdated && (
              <div className="sm:hidden flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <Clock className="h-3 w-3" />
                <span>Terakhir diperbarui: {lastUpdated}</span>
              </div>
            )}
          </div>

          {/* 1. Summary Cards (6 cards, 3x2 grid) */}
          <SummaryCards summary={summary} isLoading={isLoading} />

          {/* 2. Sales Chart (Hourly Bar & Weekly Line switcher) */}
          <SalesChart 
            recentTransactions={summary?.recent_transactions || []} 
            grossProfit={grossProfit}
            isLoading={isLoading} 
          />

          {/* 3. Bottom Grid: Transactions Table (60%) and Stock Alert Card (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pb-8">
            <div className="lg:col-span-3">
              <RecentTransactionsTable 
                transactions={summary?.recent_transactions || []} 
                isLoading={isLoading} 
                onVoid={voidTrx}
              />
            </div>
            <div className="lg:col-span-2">
              <StockAlertCard 
                restockItems={restockItems} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}