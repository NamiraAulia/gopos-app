import { useState } from "react";
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
import { BarChart3, LineChart as LineIcon } from "lucide-react";
import { Transaction, GrossProfitReport } from "../types";

interface SalesChartProps {
  recentTransactions: Transaction[];
  grossProfit: GrossProfitReport | null;
  isLoading: boolean;
}

export const SalesChart = ({ recentTransactions, grossProfit, isLoading }: SalesChartProps) => {
  const [activeTab, setActiveTab] = useState<"hourly" | "weekly">("hourly");
  const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

  // 1. Process Hourly Data (00:00 - 23:00)
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

  // Filter hourlyData to only show hours that fall between active store times (e.g. 06:00 - 22:00)
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

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 h-96 animate-pulse flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-100 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 rounded w-48"></div>
        </div>
        <div className="h-64 bg-slate-50 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
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

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setActiveTab("hourly")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              <XAxis 
                dataKey="hour" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
                tickFormatter={(value: any) => `Rp ${value.toLocaleString("id-ID", { notation: "compact" })}`}
              />
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
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
                tickFormatter={(value: any) => `Rp ${value.toLocaleString("id-ID", { notation: "compact" })}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="Omzet" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorOmzet)" 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
