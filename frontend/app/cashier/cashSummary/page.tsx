"use client";

import {
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Loader2,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  BadgeCheck,
  Clock,
  MonitorSmartphone,
  LogOut,
} from "lucide-react";
import { ExpenseModal } from "../../../features/cashier/components/ExpenseModal"
import Navbar from "@/features/cashier/components/Navbar";
import { useCashSummary } from "@/features/cashier/hooks";

const formatRp = (n: number) => "Rp " + Math.abs(n).toLocaleString("id-ID");

const formatTime = (s: string) =>
  new Date(s).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDuration = (start: string, end: string | null) => {
  if (!end) return "Sedang berjalan";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}j ${m}m`;
};

const PaymentRow = ({
  icon,
  label,
  amount,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  color: string;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-2.5">
      <div
        className={`h-7 w-7 rounded-lg flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </div>
    <span className="text-sm font-black text-slate-800">
      {formatRp(amount)}
    </span>
  </div>
);

export default function FinancialPage() {
  const {
    transactions,
    expenses,
    activeShift,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    actualCashInput,
    setActualCashInput,
    completedTrx,
    cashTotal,
    qrisTotal,
    transferTotal,
    totalIncome,
    totalExpense,
    voidedTrx,
    totalVoided,
    startCash,
    totalUangMasuk,
    totalUangKeluar,
    totalKas,
    actualCashNum,
    selisih,
    netProfit,
    handleVoidTransaction,
    fetchData,
    isClosingShift,
    handleCloseShift,
  } = useCashSummary();

  return (


    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 print:bg-white print:h-auto print:overflow-visible">
      <Navbar isShiftActive={activeShift?.status === "open"} />
      <main className="flex-1 overflow-y-auto p-6 print:hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Total Pemasukan
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600">
                    {formatRp(totalIncome)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {completedTrx.length} transaksi selesai
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-red-500 mb-2">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Total Pengeluaran
                    </span>
                  </div>
                  <p className="text-2xl font-black text-red-500">
                    {formatRp(totalExpense)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {expenses.length} item tercatat
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-5 border-2 shadow-sm ${netProfit >= 0
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-red-50 border-red-300"
                    }`}
                >
                  <div
                    className={`flex items-center gap-2 mb-2 ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {netProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Laba Bersih
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-black ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {netProfit < 0 ? "−" : ""}
                    {formatRp(netProfit)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Omzet − pengeluaran operasional
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <X className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Total Void
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-500">
                    {formatRp(totalVoided)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {voidedTrx.length} transaksi dibatalkan
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4">
                      Total Transaksi Penjualan
                    </h3>
                    <PaymentRow
                      icon={<Banknote className="h-3.5 w-3.5" />}
                      label="Total Transaksi CASH"
                      amount={cashTotal}
                      color="bg-emerald-100 text-emerald-600"
                    />
                    <PaymentRow
                      icon={<QrCode className="h-3.5 w-3.5" />}
                      label="Total Transaksi QRIS"
                      amount={qrisTotal}
                      color="bg-blue-100 text-blue-600"
                    />
                    <PaymentRow
                      icon={<CreditCard className="h-3.5 w-3.5" />}
                      label="Total Transaksi TRANSFER"
                      amount={transferTotal}
                      color="bg-purple-100 text-purple-600"
                    />

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Detail Item Void
                      </p>
                      {voidedTrx.length === 0 ? (
                        <p className="text-xs text-slate-300 font-medium">
                          Tidak ada item void
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {voidedTrx.slice(0, 3).map((t) => (
                            <div
                              key={t.id}
                              className="flex justify-between text-xs"
                            >
                              <span className="font-medium text-slate-500">
                                {t.transaction_code}
                              </span>
                              <span className="font-bold text-red-400">
                                −{formatRp(t.total_amount)}
                              </span>
                            </div>
                          ))}
                          {voidedTrx.length > 3 && (
                            <p className="text-[10px] text-slate-400">
                              +{voidedTrx.length - 3} lainnya
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4">
                      Detail Transaksi Kas
                    </h3>

                    <div className="space-y-0">
                      <div className="flex justify-between py-2.5 border-b border-slate-50">
                        <span className="text-xs font-bold text-emerald-600">
                          Modal Awal
                        </span>
                        <span className="text-sm font-black text-emerald-600">
                          +{formatRp(startCash)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-slate-50">
                        <span className="text-xs font-bold text-slate-600">
                          Total Uang Masuk (Kas)
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatRp(totalUangMasuk)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-slate-50">
                        <span className="text-xs font-bold text-slate-600">
                          Total Uang Keluar
                        </span>
                        <span className="text-sm font-bold text-red-500">
                          −{formatRp(totalUangKeluar)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-slate-100 bg-slate-50 px-2 rounded-lg mt-1">
                        <span className="text-xs font-black text-slate-700">
                          Total Kas (Estimasi)
                        </span>
                        <span className="text-base font-black text-slate-900">
                          {formatRp(totalKas)}
                        </span>
                      </div>

                      <div className="pt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Total Aktual Kas (opsional — hitung manual)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                              Rp
                            </span>
                            <input
                              type="text"
                              placeholder="0"
                              disabled={!activeShift || activeShift.status !== "open"}
                              value={
                                actualCashNum
                                  ? actualCashNum.toLocaleString("id-ID")
                                  : ""
                              }
                              onChange={(e) =>
                                setActualCashInput(
                                  e.target.value.replace(/\D/g, ""),
                                )
                              }
                              className="w-full h-10 rounded-xl border-2 border-slate-200 pl-8 pr-3 text-sm font-black text-slate-900 focus:border-blue-600 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {selisih !== null && (
                          <div
                            className={`flex justify-between items-center px-4 py-3 rounded-xl border-2 ${selisih === 0
                                ? "bg-slate-50 border-slate-200"
                                : selisih > 0
                                  ? "bg-emerald-50 border-emerald-300"
                                  : "bg-red-50 border-red-300"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {selisih === 0 ? (
                                <BadgeCheck className="h-4 w-4 text-slate-400" />
                              ) : selisih > 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              <span
                                className={`text-xs font-black ${selisih === 0
                                    ? "text-slate-600"
                                    : selisih > 0
                                      ? "text-emerald-700"
                                      : "text-red-700"
                                  }`}
                              >
                                {selisih === 0
                                  ? "Kas Balance"
                                  : selisih > 0
                                    ? "Kas Lebih"
                                    : "Kas Kurang"}
                              </span>
                            </div>
                            <span
                              className={`text-base font-black ${selisih === 0
                                  ? "text-slate-600"
                                  : selisih > 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                            >
                              {selisih >= 0 ? "+" : "−"}
                              {formatRp(selisih)}
                            </span>
                          </div>
                        )}

                        {activeShift && activeShift.status === "open" && (
                          <button
                            type="button"
                            onClick={handleCloseShift}
                            disabled={isClosingShift || actualCashNum <= 0}
                            className="w-full mt-3 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border-2 border-red-600 hover:border-red-700 disabled:shadow-none text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isClosingShift ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Menutup Shift...
                              </>
                            ) : (
                              <>
                                <LogOut className="h-4 w-4" /> Tutup Shift Kasir (Selesai)
                              </>
                            )}
                          </button>
                        )}

                        {!activeShift && (
                          <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-600 text-center flex items-center justify-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> Shift kasir belum dibuka / tidak aktif
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800">
                        Pengeluaran
                      </h3>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                      >
                        <Plus className="h-3 w-3" /> Catat
                      </button>
                    </div>

                    <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                      {expenses.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-xs font-bold text-slate-400">
                            Belum ada pengeluaran
                          </p>
                          <p className="text-[10px] text-slate-300 mt-1">
                            Klik "+ Catat" untuk menambahkan
                          </p>
                        </div>
                      ) : (
                        expenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="p-3.5 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-2">
                                <p className="text-xs font-bold text-slate-800 leading-snug">
                                  {exp.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {formatTime(exp.created_at)} ·{" "}
                                  {exp.category}
                                </p>
                              </div>
                              <span className="text-xs font-black text-red-500 shrink-0">
                                −{formatRp(exp.amount)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {expenses.length > 0 && (
                      <div className="p-4 bg-red-50 border-t border-red-100 flex justify-between items-center">
                        <span className="text-xs font-black text-red-700">
                          Total Pengeluaran
                        </span>
                        <span className="text-base font-black text-red-600">
                          {formatRp(totalExpense)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-800">
                        Transaksi Terakhir
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {completedTrx.slice(0, 5).map((trx) => (
                        <div
                          key={trx.id}
                          className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              #{trx.transaction_code.slice(-6)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                              {formatTime(trx.created_at)} ·{" "}
                              {trx.payment_method}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-emerald-600">
                              +{formatRp(trx.total_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {completedTrx.length === 0 && (
                        <p className="p-6 text-center text-xs text-slate-300 font-medium">
                          Belum ada transaksi
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
