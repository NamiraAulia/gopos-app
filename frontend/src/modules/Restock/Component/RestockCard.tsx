import { AlertTriangle, ShieldCheck, Phone } from "lucide-react";
import type { RestockItemDTO as RestockItem } from "../DTO/restock.dto";

interface RestockCardProps {
  item: RestockItem;
}

export const RestockCard = ({ item }: RestockCardProps) => {
  // Safe extraction with default fallbacks
  const riskTier = item.risk_tier || "low";
  const dailyDemand = item.daily_demand ?? 0;
  const weeklyDemand = item.weekly_demand ?? 0;
  const recommendQty = item.recommend_qty ?? 0;
  const recommendBigQty = item.recommend_big_qty ?? 0;
  const maxSafeQty = item.max_safe_qty ?? 0;
  const maxSafeBigQty = item.max_safe_big_qty ?? 0;
  const currentStock = item.current_stock ?? 0;
  const daysRemaining = item.days_remaining ?? 999;
  const conversion = item.conversion ?? 1;

  // Determine risk styles
  let riskColor = "bg-emerald-500";
  let riskBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let riskLabel = "Risiko Rendah (Tahan Lama)";
  
  if (riskTier === "high") {
    riskColor = "bg-rose-500";
    riskBg = "bg-rose-50 text-rose-700 border-rose-200";
    riskLabel = "Risiko Tinggi (Cepat Basi)";
  } else if (riskTier === "medium") {
    riskColor = "bg-amber-500";
    riskBg = "bg-amber-50 text-amber-700 border-amber-200";
    riskLabel = "Risiko Sedang";
  }

  const unit = item.unit || "Pcs";
  const unitBig = item.unit_big || "Dus";

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${riskColor}`}></div>
      
      <div>
        <div className="flex justify-between items-start mb-3 pl-2">
          <div>
            <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{item.product_name}</h3>
            {item.supplier_name && (
              <p className="text-xs text-slate-400">
                Supplier: <span className="font-semibold text-slate-600">{item.supplier_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Risk Badge */}
        <div className="pl-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${riskBg}`}>
            {riskTier === "high" ? (
              <AlertTriangle className="size-3" />
            ) : (
              <ShieldCheck className="size-3" />
            )}
            {riskLabel}
          </span>
        </div>

        {/* Stock Status Grid */}
        <div className="grid grid-cols-2 gap-4 pl-2 mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Sisa Stok</p>
            <p className="text-xl font-black text-rose-600">
              {currentStock} <span className="text-xs font-bold text-rose-400">{unit}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Prediksi Habis</p>
            <p className="text-sm font-black text-slate-800 mt-1">
              {daysRemaining <= 0 ? "Hari ini!" : `${daysRemaining.toFixed(0)} Hari lagi`}
            </p>
          </div>
        </div>

        {/* Demand Projections */}
        <div className="pl-2 mt-4 space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold text-slate-700">Proyeksi Kebutuhan:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100/60">
              <p className="text-[10px] font-medium text-slate-400">Harian (Rata-rata)</p>
              <p className="font-bold text-slate-800 mt-0.5">~{dailyDemand.toFixed(1)} {unit}/hari</p>
            </div>
            <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100/60">
              <p className="text-[10px] font-medium text-slate-400">Mingguan (7 Hari)</p>
              <p className="font-bold text-slate-800 mt-0.5">~{weeklyDemand.toFixed(0)} {unit}/minggu</p>
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="pl-2 mt-4 space-y-2 border-t border-slate-100 pt-3">
          <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/60">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Saran Jumlah Order:</p>
            <p className="text-lg font-black text-blue-700 mt-1">
              {recommendQty} {unit}
              {conversion > 1 && recommendBigQty > 0 && (
                <span className="text-xs font-medium text-blue-500 block sm:inline sm:ml-1">
                  (setara {recommendBigQty} {unitBig})
                </span>
              )}
            </p>
          </div>

          <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100/60 text-xs">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Batas Maksimum Aman:</p>
            <p className="font-extrabold text-orange-700 mt-0.5">
              {maxSafeQty} {unit}
              {conversion > 1 && maxSafeBigQty > 0 && (
                <span className="font-normal text-orange-600"> (atau {maxSafeBigQty} {unitBig})</span>
              )}
            </p>
            <p className="text-[10px] text-orange-500 mt-1 leading-normal">
              Jangan memesan melebihi batas aman ini untuk mencegah kerugian barang kedaluwarsa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};