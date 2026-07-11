import { useRouter } from "next/navigation";
import { AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { RestockSuggestion } from "../types";

interface StockAlertCardProps {
  restockItems: RestockSuggestion[];
  isLoading: boolean;
}

export const StockAlertCard = ({ restockItems, isLoading }: StockAlertCardProps) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full animate-pulse flex flex-col justify-between">
        <div className="h-6 bg-slate-100 rounded w-1/3"></div>
        <div className="space-y-3 my-4 flex-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-55 rounded-xl"></div>
          ))}
        </div>
        <div className="h-10 bg-slate-100 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full overflow-hidden">
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
        onClick={() => router.push("/products")}
        className="w-full h-10 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Restock Semua
      </button>
    </div>
  );
};
