import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ShoppingCart, 
  Wallet, 
  Calendar, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { DashboardSummary } from "../types";

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

export const SummaryCards = ({ summary, isLoading }: SummaryCardsProps) => {
  const router = useRouter();
  const formatRp = (n: number = 0) => "Rp " + n.toLocaleString("id-ID");

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-32 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const isProfitPositive = summary.today_profit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. Omzet Hari Ini */}
      <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp className="h-12 w-12 text-emerald-600" />
        </div>
        <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">Omzet Hari Ini</p>
        <h3 className="text-2xl font-black text-slate-900">
          {formatRp(summary.today_revenue)}
        </h3>
        <div className="flex items-center gap-1 mt-3 text-emerald-600 font-bold text-[10px] uppercase">
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Terupdate Otomatis</span>
        </div>
      </div>

      {/* 2. Transaksi Hari Ini */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShoppingCart className="h-12 w-12 text-blue-600" />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Transaksi Hari Ini</p>
        <h3 className="text-3xl font-black text-slate-900">
          {summary.today_transaction_count}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-2.5 uppercase">Pesanan Selesai</p>
      </div>

      {/* 3. Laba Estimasi Hari Ini */}
      <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
        isProfitPositive 
          ? "bg-blue-50/30 border-blue-100" 
          : "bg-red-50/30 border-red-100"
      }`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign className={`h-12 w-12 ${isProfitPositive ? "text-blue-600" : "text-red-600"}`} />
        </div>
        <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
          isProfitPositive ? "text-blue-600" : "text-red-600"
        }`}>Laba Estimasi Hari Ini</p>
        <h3 className={`text-2xl font-black ${isProfitPositive ? "text-slate-900" : "text-red-700"}`}>
          {formatRp(summary.today_profit)}
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

      {/* 4. Total Bulan Ini */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Calendar className="h-12 w-12 text-slate-400" />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Total Bulan Ini</p>
        <h3 className="text-2xl font-black text-slate-900">
          {formatRp(summary.month_revenue)}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase">Bulan Berjalan</p>
      </div>

      {/* 5. Total Pengeluaran Hari Ini */}
      <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="h-12 w-12 text-red-500" />
        </div>
        <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-2">Total Pengeluaran Hari Ini</p>
        <h3 className="text-2xl font-black text-slate-900">
          {formatRp(summary.today_expense)}
        </h3>
        <p className="text-[10px] text-red-400/80 font-bold mt-3 uppercase">Kas Keluar</p>
      </div>

      {/* 6. Stok Kritis */}
      <button
        onClick={() => router.push("/products?filter=critical")}
        className={`text-left p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md focus:outline-none ${
          summary.critical_stock_count > 0
            ? "bg-amber-50/50 border-amber-100 hover:border-amber-300"
            : "bg-slate-50/50 border-slate-100 hover:border-slate-300"
        }`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <AlertTriangle className={`h-12 w-12 ${summary.critical_stock_count > 0 ? "text-amber-600" : "text-slate-400"}`} />
        </div>
        <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
          summary.critical_stock_count > 0 ? "text-amber-600" : "text-slate-400"
        }`}>Stok Kritis</p>
        <h3 className="text-3xl font-black text-slate-900">
          {summary.critical_stock_count}
        </h3>
        <p className={`text-[10px] font-bold mt-2.5 uppercase ${
          summary.critical_stock_count > 0 ? "text-amber-700" : "text-slate-400"
        }`}>
          {summary.critical_stock_count > 0 ? "⚠️ Butuh Restock Segera" : "Stok Aman"}
        </p>
      </button>
    </div>
  );
};
