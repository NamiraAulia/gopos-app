"use client";

import {
  Receipt,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Printer,
  X,
  Loader2,
  CalendarDays,
  AlertTriangle,
  RotateCcw,
  Search
} from "lucide-react";
import Navbar from "@/modules/Cashier/Component/Navbar";
import { RefundModal } from "@/modules/Cashier/Component/RefundModal";
import { PrintableReceipt } from "@/modules/Cashier/Component/PrintableReceipt";

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  voided: "bg-red-50 text-red-500 border-red-200",
  partially_refunded: "bg-amber-50 text-amber-600 border-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Selesai",
  voided: "Dibatalkan",
  partially_refunded: "Diretur Sebagian",
};

interface CashierHistoryViewProps {
  router: any;
  loading: boolean;
  page: number;
  setPage: (p: any) => void;
  totalPages: number;
  totalCount: number;
  searchCode: string;
  setSearchCode: (s: string) => void;
  selected: any;
  setSelected: (s: any) => void;
  detailLoading: boolean;
  voidTarget: any;
  setVoidTarget: (v: any) => void;
  voidLoading: boolean;
  voidError: string;
  isShiftActive: boolean;
  showRefundModal: boolean;
  setShowRefundModal: (b: boolean) => void;
  handleRefundSuccess: () => void;
  openDetail: (trx: any) => void;
  handlePrint: () => void;
  confirmVoid: () => void;
  filteredTransactions: any[];
}

export function CashierHistoryView({
  router,
  loading,
  page,
  setPage,
  totalPages,
  totalCount,
  searchCode,
  setSearchCode,
  selected,
  setSelected,
  detailLoading,
  voidTarget,
  setVoidTarget,
  voidLoading,
  voidError,
  isShiftActive,
  showRefundModal,
  setShowRefundModal,
  handleRefundSuccess,
  openDetail,
  handlePrint,
  confirmVoid,
  filteredTransactions,
}: CashierHistoryViewProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 print:bg-white print:h-auto print:overflow-visible">
      <Navbar
        isShiftActive={isShiftActive}
        onCloseShiftClick={() => router.push("/cashier/cashSummary")}
      />

      <main className="flex-1 overflow-y-auto p-6 sm:p-8 print:hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Riwayat Transaksi Kasir
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                Daftar seluruh transaksi penjualan toko
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 stroke-[2.5]" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Cari no. struk..."
                className="h-12 w-full sm:w-80 rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm sm:text-base font-bold focus:border-blue-600 outline-none text-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-black text-slate-400">
                  Memuat transaksi...
                </p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Receipt className="h-7 w-7 stroke-[2.5]" />
                </div>
                <p className="font-black text-slate-800 text-base">
                  Belum Ada Transaksi
                </p>
                <p className="text-sm text-slate-500 font-bold max-w-xs">
                  {searchCode
                    ? "Tidak ditemukan transaksi dengan nomor struk tersebut"
                    : "Transaksi yang sudah selesai akan muncul di sini"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-100">
                      <th className="text-left px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                        No. Struk
                      </th>
                      <th className="text-left px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                        Waktu
                      </th>
                      <th className="text-left px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                        Metode
                      </th>
                      <th className="text-right px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-center px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((trx: any) => (
                      <tr
                        key={trx.id}
                        onClick={() => openDetail(trx)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-black text-base text-slate-900 font-mono">
                          {trx.transaction_code}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-bold text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-slate-400 stroke-[2.5]" />
                            {new Date(trx.created_at).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-black uppercase text-xs sm:text-sm">
                          {trx.payment_method}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-blue-700 text-base sm:text-lg">
                          Rp {trx.total_amount.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase border ${STATUS_STYLE[trx.status] ||
                              "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                          >
                            {STATUS_LABEL[trx.status] || trx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Receipt className="h-5 w-5 text-slate-400 stroke-[2.5]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs font-bold text-slate-400">
                Menampilkan {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} dari {totalCount} transaksi
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-black text-slate-600 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden print:bg-white print:p-0">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  {selected.transaction_code}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-bold">
                  {new Date(selected.created_at).toLocaleString("id-ID", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {detailLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-xs sm:text-sm font-black uppercase border-2 ${
                        STATUS_STYLE[selected.status] ||
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {STATUS_LABEL[selected.status] || selected.status}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-700 uppercase">
                      {selected.payment_method}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selected.items?.map((item: any, index: any) => (
                      <div
                        key={`${item.id || 'print'}-${index}`}
                        className="flex justify-between items-center text-sm sm:text-base font-bold text-slate-800"
                      >
                        <span className="flex-1 pr-2 truncate">
                          {item.qty}x {item.product_name}
                        </span>
                        <span className="font-black font-mono shrink-0">
                          {item.subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 border-2 border-slate-200">
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="font-black text-slate-700">Total</span>
                      <span className="font-black text-base sm:text-lg text-blue-700 font-mono">
                        Rp {selected.total_amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-bold text-slate-600">Dibayar</span>
                      <span className="font-bold text-slate-900 font-mono">
                        Rp {selected.amount_paid.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {selected.change_amount > 0 && (
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">
                          Kembalian
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          Rp {selected.change_amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 pt-0 space-y-2.5 shrink-0">
              <button
                onClick={handlePrint}
                disabled={detailLoading}
                className="w-full h-12 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-sm font-black text-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Printer className="h-4.5 w-4.5 stroke-[2.5]" /> Cetak Struk
              </button>
              {selected.status !== "voided" && (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVoidTarget(selected);
                    }}
                    disabled={detailLoading}
                    className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-xs sm:text-sm font-black text-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <XCircle className="h-4.5 w-4.5 stroke-[2.5]" /> Batal Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(true)}
                    disabled={detailLoading}
                    className="flex-1 h-12 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs sm:text-sm font-black text-amber-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="h-4.5 w-4.5 stroke-[2.5]" /> Retur Barang
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <PrintableReceipt
          transaction={{
            transaction_code: selected.transaction_code,
            created_at: selected.created_at,
            payment_method: selected.payment_method,
            amount_paid: selected.amount_paid,
            total_amount: selected.total_amount,
            change_amount: selected.change_amount,
            discount_amount: selected.discount_amount,
            items: selected.items?.map((item: any) => ({
              id: item.id,
              product_name: item.product_name,
              qty: item.qty,
              price: item.unit_price,
              subtotal: item.subtotal,
            })),
            member: selected.member
              ? {
                  name: selected.member.name,
                  member_code: selected.member.phone || `#${selected.member.id}`,
                }
              : null,
          }}
        />
      )}

      {voidTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              Batalkan Transaksi Ini?
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5">
              Stok produk untuk transaksi{" "}
              <span className="font-bold text-slate-600">
                {voidTarget.transaction_code}
              </span>{" "}
              akan dikembalikan otomatis. Tindakan ini tidak dapat diurungkan.
            </p>

            {voidError && (
              <p className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-600 text-left">
                {voidError}
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setVoidTarget(null)}
                disabled={voidLoading}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tidak
              </button>
              <button
                onClick={confirmVoid}
                disabled={voidLoading}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {voidLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ya, Batalkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSuccess={handleRefundSuccess}
        transaction={selected}
      />
    </div>
  );
}
