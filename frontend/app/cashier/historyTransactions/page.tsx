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
import Navbar from "@/features/cashier/components/Navbar";
import { RefundModal } from "@/features/cashier/components/RefundModal";
import { useCashierHistory } from "@/features/cashier/hooks/useCashierHistory";
import { PrintableReceipt } from "@/features/cashier/components/PrintableReceipt";

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

export default function TransactionHistoryPage() {
  const {
    router,
    loading,
    page,
    setPage,
    totalPages,
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
  } = useCashierHistory();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 print:bg-white print:h-auto print:overflow-visible">
      <Navbar
        isShiftActive={isShiftActive}
        onCloseShiftClick={() => router.push("/cashier/cashSummary")}
      />

      <main className="flex-1 overflow-y-auto p-6 print:hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Riwayat Transaksi
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Daftar seluruh transaksi penjualan
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Cari no. struk..."
                className="h-10 w-64 rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 text-xs font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <p className="text-xs font-bold text-slate-400">
                  Memuat transaksi...
                </p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-slate-400" />
                </div>
                <p className="font-black text-slate-700 text-sm">
                  Belum Ada Transaksi
                </p>
                <p className="text-xs text-slate-400 font-medium max-w-xs">
                  {searchCode
                    ? "Tidak ditemukan transaksi dengan nomor struk tersebut"
                    : "Transaksi yang sudah selesai akan muncul di sini"}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      No. Struk
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Metode
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-center px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trx: any) => (
                    <tr
                      key={trx.id}
                      onClick={() => openDetail(trx)}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {trx.transaction_code}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                          {new Date(trx.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-bold uppercase text-xs">
                        {trx.payment_method}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-blue-600">
                        Rp {trx.total_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${STATUS_STYLE[trx.status] ||
                            "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                        >
                          {STATUS_LABEL[trx.status] || trx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Receipt className="h-4 w-4 text-slate-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs font-bold text-slate-400">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p: any) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p: any) => Math.min(totalPages, p + 1))}
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
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  {selected.transaction_code}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {new Date(selected.created_at).toLocaleString("id-ID", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${STATUS_STYLE[selected.status] ||
                        "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                    >
                      {STATUS_LABEL[selected.status] || selected.status}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {selected.payment_method}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.items?.map((item: any, index: any) => (
                      <div key={`${item.id || 'print'}-${index}`} className="flex justify-between mb-1 text-xs">
                        <span>
                          {item.qty}x {item.product_name}
                        </span>
                        <span>{item.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 border border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-500">Total</span>
                      <span className="font-black text-blue-600">
                        Rp {selected.total_amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-500">Dibayar</span>
                      <span className="font-bold text-slate-700">
                        Rp {selected.amount_paid.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {selected.change_amount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-500">
                          Kembalian
                        </span>
                        <span className="font-bold text-slate-700">
                          Rp {selected.change_amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 pt-0 space-y-2 shrink-0">
              <button
                onClick={handlePrint}
                disabled={detailLoading}
                className="w-full h-11 rounded-xl border-2 border-slate-200 text-xs font-black text-blue-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Cetak Struk
              </button>
              {selected.status !== "voided" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoidTarget(selected);
                    }}
                    disabled={detailLoading}
                    className="flex-1 h-11 rounded-xl border-2 border-red-200 text-xs font-black text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" /> Batal Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(true)}
                    disabled={detailLoading}
                    className="flex-1 h-11 rounded-xl border-2 border-amber-200 text-xs font-black text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" /> Retur Barang
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
