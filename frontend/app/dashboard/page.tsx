"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { SummaryCards } from "../../features/dashboard/components/SummaryCard";
import { RecentTransactionsTable } from "../../features/dashboard/components/RecentTransactionTable";
import { Transaction, DashboardStats } from "../../features/dashboard/types";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    monthRevenue: 0,
    totalSales: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/v1/reports/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success && result.data) {
        setStats({
          todayRevenue: result.data.today_revenue,
          monthRevenue: result.data.month_revenue,
          totalSales: result.data.total_sales,
        });
        setTransactions(result.data.recent_transactions);
      }
    } catch (error) {
      console.error("Gagal mengambil ringkasan dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <LayoutDashboard className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Dashboard Utama</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Ringkasan Bisnis</h2>
            <p className="text-slate-500 text-sm mt-1">Laporan performa tokomu secara real-time.</p>
          </div>

          {/* 👇 KOMPONEN KARTU RINGKASAN */}
          <SummaryCards stats={stats} isLoading={isLoading} />

          {/* 👇 KOMPONEN TABEL TRANSAKSI */}
          <RecentTransactionsTable transactions={transactions} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}