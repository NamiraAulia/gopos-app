"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChevronRight,
  RefreshCw,
  Clock,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Calendar,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LineChart as LineIcon,
  Receipt,
  MoreHorizontal,
  Eye,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import type {
  DashboardSummaryDAO,
  GrossProfitReportDAO,
  RestockSuggestionDAO,
  TransactionDAO,
} from "../DAO/dashboard.dao";

interface DashboardViewProps {
  summary: DashboardSummaryDAO | null;
  grossProfit: GrossProfitReportDAO | null;
  restockItems: RestockSuggestionDAO[];
  isLoading: boolean;
  refetch: () => void;
  lastUpdated: string;
  onVoid: (id: number) => Promise<void>;
  activeTab: "hourly" | "weekly";
  setActiveTab: (tab: "hourly" | "weekly") => void;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  voided: "bg-red-50 text-red-500 border-red-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Selesai",
  voided: "Batal",
  pending: "Pending",
};

const PAYMENT_STYLE: Record<string, string> = {
  cash: "bg-slate-100 text-slate-700 border-slate-200",
  qris: "bg-indigo-50 text-indigo-600 border-indigo-150",
  transfer: "bg-blue-50 text-blue-600 border-blue-150",
};

export function DashboardView({
  summary,
  grossProfit,
  restockItems,
  isLoading,
  refetch,
  lastUpdated,
  onVoid,
  activeTab,
  setActiveTab,
}: DashboardViewProps) {
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const formatRp = (n: number = 0) => "Rp " + n.toLocaleString("id-ID");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleVoid = async (id: number, code: string) => {
    setActiveMenuId(null);
    if (confirm(`Apakah Anda yakin ingin membatalkan transaksi ${code}?`)) {
      try {
        setVoidingId(id);
        await onVoid(id);
        alert("Transaksi berhasil dibatalkan");
      } catch (err) {
        alert("Gagal membatalkan transaksi");
      } finally {
        setVoidingId(null);
      }
    }
  };

  const isProfitPositive = (summary?.today_profit || 0) >= 0;
  const recentTransactions = summary?.recent_transactions || [];

  // 1. Process Hourly Data (06:00 - 22:00)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    "Penjualan": 0,
  }));

  recentTransactions.forEach((trx) => {
    if (trx.status === "completed") {
      const date = new Date(trx.created_at);
      const hour = date.getHours();
      if (hour >= 0 && hour < 24) {
        hourlyData[hour]["Penjualan"] += trx.total_amount;
      }
    }
  });

  const activeHoursData = hourlyData.filter((d) => {
    const hourNum = parseInt(d.hour.split(":")[0], 10);
    return hourNum >= 6 && hourNum <= 22;
  });

  // 2. Process Weekly Data (7 Hari Terakhir)
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[date.getDay()];
  };

  const weeklyData = (grossProfit?.daily_profits || []).map((dp) => ({
    name: getDayName(dp.date),
    "Omzet": dp.revenue,
    "Laba": dp.gross_profit,
    date: dp.date,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs font-bold">
          <p className="mb-1 text-slate-400">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color || p.fill }}>
              {p.name}: {formatRp(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
              className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-1.5 font-bold text-slate-600 disabled:opacity-50 cursor-pointer"
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
              <p className="text-slate-400 text-xs font-semibold mt-0.5">
                Laporan performa tokomu secara real-time.
              </p>
            </div>

            {lastUpdated && (
              <div className="sm:hidden flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <Clock className="h-3 w-3" />
                <span>Terakhir diperbarui: {lastUpdated}</span>
              </div>
            )}
          </div>

          {/* 1. Summary Cards (6 Cards 3x2 Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Omzet Hari Ini */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-12 w-12 text-emerald-600" />
              </div>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">Omzet Hari Ini</p>
              <h3 className="text-2xl font-black text-slate-900">
                {formatRp(summary?.today_revenue)}
              </h3>
              <div className="flex items-center gap-1 mt-3 text-emerald-600 font-bold text-[10px] uppercase">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Terupdate Otomatis</span>
              </div>
            </div>

            {/* Transaksi Hari Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShoppingCart className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Transaksi Hari Ini</p>
              <h3 className="text-3xl font-black text-slate-900">
                {summary?.today_transaction_count || 0}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2.5 uppercase">Pesanan Selesai</p>
            </div>

            {/* Laba Estimasi Hari Ini */}
            <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
              isProfitPositive ? "bg-blue-50/30 border-blue-100" : "bg-red-50/30 border-red-100"
            }`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className={`h-12 w-12 ${isProfitPositive ? "text-blue-600" : "text-red-600"}`} />
              </div>
              <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
                isProfitPositive ? "text-blue-600" : "text-red-600"
              }`}>Laba Estimasi Hari Ini</p>
              <h3 className={`text-2xl font-black ${isProfitPositive ? "text-slate-900" : "text-red-700"}`}>
                {formatRp(summary?.today_profit)}
              </h3>
              <div className="flex items-center gap-1 mt-3 text-[10px] font-bold uppercase">
                {isProfitPositive ? (
                  <>
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Surplus</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-red-500">Defisit</span>
                  </>
                )}
              </div>
            </div>

            {/* Total Bulan Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calendar className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Total Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900">
                {formatRp(summary?.month_revenue)}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase">Bulan Berjalan</p>
            </div>

            {/* Total Pengeluaran Hari Ini */}
            <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-2">Total Pengeluaran Hari Ini</p>
              <h3 className="text-2xl font-black text-slate-900">
                {formatRp(summary?.today_expense)}
              </h3>
              <p className="text-[10px] text-red-400/80 font-bold mt-3 uppercase">Kas Keluar</p>
            </div>

            {/* Stok Kritis */}
            <button
              onClick={() => router.push("/products")}
              className={`text-left p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md focus:outline-none cursor-pointer ${
                (summary?.critical_stock_count || 0) > 0
                  ? "bg-amber-50/50 border-amber-100 hover:border-amber-300"
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-300"
              }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className={`h-12 w-12 ${(summary?.critical_stock_count || 0) > 0 ? "text-amber-600" : "text-slate-400"}`} />
              </div>
              <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
                (summary?.critical_stock_count || 0) > 0 ? "text-amber-600" : "text-slate-400"
              }`}>Stok Kritis</p>
              <h3 className="text-3xl font-black text-slate-900">
                {summary?.critical_stock_count || 0}
              </h3>
              <p className={`text-[10px] font-bold mt-2.5 uppercase ${
                (summary?.critical_stock_count || 0) > 0 ? "text-amber-700" : "text-slate-400"
              }`}>
                {(summary?.critical_stock_count || 0) > 0 ? "⚠️ Butuh Restock Segera" : "Stok Aman"}
              </p>
            </button>
          </div>

          {/* 2. Sales Chart (Hourly / Weekly Switcher) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {activeTab === "hourly" ? "Grafik Penjualan Hari Ini" : "Tren Penjualan 7 Hari Terakhir"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {activeTab === "hourly"
                    ? "Statistik penjualan toko dikelompokkan per jam kerja"
                    : "Laporan performa omzet dan laba kotor toko seminggu terakhir"}
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
                <button
                  onClick={() => setActiveTab("hourly")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "hourly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Hari Ini (Per Jam)
                </button>
                <button
                  onClick={() => setActiveTab("weekly")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "weekly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <LineIcon className="h-3.5 w-3.5" />
                  7 Hari Terakhir
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === "hourly" ? (
                  <BarChart data={activeHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} tickFormatter={(value: any) => `Rp ${value.toLocaleString("id-ID", { notation: "compact" })}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="Penjualan" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                ) : (
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} tickFormatter={(value: any) => `Rp ${value.toLocaleString("id-ID", { notation: "compact" })}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Omzet" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOmzet)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Bottom Grid: Recent Transactions Table (60%) & Stock Alert Card (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pb-8">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Receipt className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-black text-sm text-slate-800">Transaksi Terakhir</h3>
                </div>
                <Link href="/cashier/historyTransactions" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  Lihat Semua
                </Link>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3">No. Struk</th>
                      <th className="px-5 py-3">Waktu</th>
                      <th className="px-5 py-3">Metode</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold animate-pulse">
                          Memuat data transaksi...
                        </td>
                      </tr>
                    ) : recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold">
                          Belum ada transaksi hari ini.
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.slice(0, 5).map((trx: TransactionDAO) => (
                        <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                            {trx.transaction_code}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                            {new Date(trx.created_at).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                              PAYMENT_STYLE[trx.payment_method?.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              {trx.payment_method}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-blue-600 whitespace-nowrap">
                            {formatRp(trx.total_amount)}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                              STATUS_STYLE[trx.status?.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              {STATUS_LABEL[trx.status?.toLowerCase()] || trx.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right relative whitespace-nowrap">
                            {voidingId === trx.id ? (
                              <span className="text-[10px] text-slate-400 font-bold animate-pulse">Memproses...</span>
                            ) : (
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === trx.id ? null : trx.id)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            )}

                            {activeMenuId === trx.id && (
                              <div
                                ref={dropdownRef}
                                className="absolute right-5 mt-1 w-36 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-20 p-1 border border-slate-100 text-left"
                              >
                                <Link
                                  href="/cashier/historyTransactions"
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Lihat Detail
                                </Link>
                                {trx.status !== "voided" && (
                                  <button
                                    onClick={() => handleVoid(trx.id, trx.transaction_code)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Batalkan
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-800">Rekomendasi Restock</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peringatan Stok & Penjualan</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1">
                {restockItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="font-black text-slate-700 text-xs">Stok aman terkendali 🎉</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 max-w-[200px]">
                      Semua produk memiliki tingkat stok yang cukup untuk beberapa hari ke depan.
                    </p>
                  </div>
                ) : (
                  restockItems.map((item) => {
                    const isCritical = item.current_stock <= 2;
                    const daysRemainingText = item.days_remaining >= 999
                      ? "Tidak ada penjualan"
                      : `${item.days_remaining.toFixed(1)} hari lagi`;

                    return (
                      <div
                        key={item.product_id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100 flex items-center justify-between transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-800 truncate">
                            {item.product_name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Stok: <span className="font-bold text-slate-600">{item.current_stock}</span> • Rata-rata: <span className="font-semibold text-slate-600">{item.avg_sales_per_day.toFixed(1)}/hari</span>
                          </p>
                          <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                            ⏳ Habis dalam ~{daysRemainingText}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          isCritical
                            ? "bg-red-50 text-red-500 border-red-150"
                            : "bg-amber-50 text-amber-600 border-amber-150"
                        }`}>
                          {isCritical ? "Kritis" : "Hampir Habis"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => router.push("/restock")}
                className="w-full h-10 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restock Semua
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
