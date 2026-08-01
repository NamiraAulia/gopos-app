import { TrendingUp, ArrowUpRight } from "lucide-react";
import { DashboardStats } from "../types";

interface SummaryCardsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export const SummaryCards = ({ stats, isLoading }: SummaryCardsProps) => {
  const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
           <TrendingUp className="h-12 w-12 text-blue-600" />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pendapatan Hari Ini</p>
        <h3 className="text-2xl font-black text-slate-900">
          {isLoading ? "..." : formatRp(stats.todayRevenue)}
        </h3>
        <div className="flex items-center gap-1 mt-3 text-emerald-600 font-bold text-xs">
          <ArrowUpRight className="h-3 w-3" />
          <span>Update otomatis</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Bulan Ini</p>
        <h3 className="text-2xl font-black text-slate-900">
          {isLoading ? "..." : formatRp(stats.monthRevenue)}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase">Bulan Berjalan</p>
      </div>

      <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
        <p className="text-xs font-black text-blue-200 uppercase tracking-widest mb-2">Total Pesanan</p>
        <h3 className="text-3xl font-black">{isLoading ? "..." : stats.totalSales}</h3>
        <p className="text-xs text-blue-100/70 mt-3 font-medium">Transaksi terekam di sistem</p>
      </div>
    </div>
  );
};