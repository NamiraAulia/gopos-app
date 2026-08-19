import { useState } from "react";
import { Calendar, Copy, Check, Package, Receipt, Sparkles, PhoneCall } from "lucide-react";
import type { TodayScheduleData } from "../types";

type TodayScheduleWidgetProps = {
  scheduleData: TodayScheduleData;
  selectedDayLabel: string;
  onRefresh?: () => void;
};

export const TodayScheduleWidget = ({
  scheduleData,
  selectedDayLabel,
}: TodayScheduleWidgetProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummaryForOwner = () => {
    const day = scheduleData.day || selectedDayLabel;
    const takingOrder = scheduleData.taking_order || [];
    const billing = scheduleData.billing || [];

    let text = `*JADWAL KUNJUNGAN SALES & SUPPLIER (${day.toUpperCase()})*\n`;
    text += `Total Sales Berkunjung: ${scheduleData.total_sales || 0} Salesman\n\n`;

    if (takingOrder.length > 0) {
      text += `*PENAWARAN / ORDER STOK BARANG (${takingOrder.length}):*\n`;
      takingOrder.forEach((s, idx) => {
        text += `${idx + 1}. *${s.supplier_name}* - ${s.sales_name}`;
        if (s.category) text += ` (${s.category})`;
        if (s.phone_number) text += ` - No HP: ${s.phone_number}`;
        text += `\n`;
      });
      text += `\n`;
    }

    if (billing.length > 0) {
      text += `*PENAGIHAN / TUKAR FAKTUR JATUH TEMPO (${billing.length}):*\n`;
      billing.forEach((s, idx) => {
        text += `${idx + 1}. *${s.supplier_name}* - ${s.sales_name}`;
        if (s.category) text += ` (${s.category})`;
        if (s.phone_number) text += ` - No HP: ${s.phone_number}`;
        text += `\n`;
      });
      text += `\n`;
    }

    if (takingOrder.length === 0 && billing.length === 0) {
      text += `Tidak ada jadwal kunjungan salesman pada hari ${day}.\n`;
    }

    text += `\n_Dikirim otomatis dari Sistem Kasir GoPOS_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const takingOrderList = scheduleData.taking_order || [];
  const billingList = scheduleData.billing || [];
  const totalCount = scheduleData.total_sales || 0;

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                Jadwal Kunjungan ({selectedDayLabel})
              </h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                {totalCount} Sales
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Ringkasan salesmen yang datang untuk order barang & penagihan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopySummaryForOwner}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
            copied
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-white" />
              <span>Teks Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-blue-600" />
              <span>Salin Ringkasan WA Owner</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Taking Order List */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-blue-600" /> Order Stok Barang ({takingOrderList.length})
            </span>
          </div>

          {takingOrderList.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium py-3 text-center italic">
              Tidak ada sales order stok untuk hari ini
            </p>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {takingOrderList.map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.supplier_name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.sales_name} {item.category ? `• ${item.category}` : ""}
                    </p>
                  </div>
                  {item.phone_number && (
                    <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                      <PhoneCall className="h-3 w-3 text-emerald-600" /> {item.phone_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Billing List */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-amber-600" /> Penagihan / Tukar Faktur ({billingList.length})
            </span>
          </div>

          {billingList.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium py-3 text-center italic">
              Tidak ada penagihan jatuh tempo untuk hari ini
            </p>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {billingList.map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-amber-100 bg-amber-50/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.supplier_name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.sales_name} {item.category ? `• ${item.category}` : ""}
                    </p>
                  </div>
                  {item.phone_number && (
                    <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-1 rounded border border-amber-200 flex items-center gap-1">
                      <PhoneCall className="h-3 w-3 text-amber-600" /> {item.phone_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
