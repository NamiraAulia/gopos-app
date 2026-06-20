import { Phone } from "lucide-react";
import { RestockItem } from "../types";

interface RestockCardProps {
  item: RestockItem;
}

export const RestockCard = ({ item }: RestockCardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
      
      <div className="flex justify-between items-start mb-4 pl-2">
        <div>
          <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{item.product_name}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Rata-rata laku: <span className="text-slate-900">{item.avg_sales_per_day.toFixed(1)} item/hari</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between items-end pl-2 mt-6 border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-0.5">Sisa di Gudang</p>
          <p className="text-2xl font-black text-red-600">{item.current_stock} <span className="text-sm font-bold text-red-400">Pcs</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500 mb-0.5">Prediksi Habis</p>
          <p className="text-lg font-black text-slate-900">
            {item.days_remaining <= 0 ? "Hari ini!" : `${item.days_remaining.toFixed(0)} Hari lagi`}
          </p>
        </div>
      </div>

      <button className="w-full mt-5 bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-md active:scale-[0.98]">
        <Phone className="h-4 w-4" /> Hubungi Supplier
      </button>
    </div>
  );
};