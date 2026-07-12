"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Receipt,
  ChevronRight, 
  Search, 
  CalendarDays,
  Filter,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Printer,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Tag
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { RefundModal } from "@/features/cashier/components/RefundModal";
import { useAdminTransactions } from "../hooks/useAdminTransactions";

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  voided: "bg-red-50 text-red-600 border-red-200",
  partially_refunded: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Success",
  voided: "Void",
  partially_refunded: "Refund / Retur",
};

export function TransactionHistoryView() {
  const router = useRouter();
  const {
    currentUser,
    isHydrated,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedTransaction,
    setSelectedTransaction,
    detailLoading,
    showRefundModal,
    setShowRefundModal,
    currentPage,
    totalPages,
    startIndex,
    totalItems,
    paginatedTransactions,
    itemsPerPage,
    fetchTransactions,
    openDetail,
    handlePrint,
    handleRefundSuccess,
    handleResetFilters,
    goToPage,
  } = useAdminTransactions();

  useEffect(() => {
    if (isHydrated) {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.role !== "admin") {
        router.push("/cashier");
      } else {
        fetchTransactions();
      }
    }
  }, [isHydrated, currentUser, router, fetchTransactions]);

  if (!isHydrated || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 print:bg-white print:h-auto print:overflow-visible">
      {/* Sidebar - Hidden on print */}
      <div className="print:hidden flex h-full">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden print:hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <Receipt className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Riwayat Transaksi Admin</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Transaksi</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Tinjau kembali seluruh log transaksi penjualan, status pembayaran, dan lakukan cetak ulang struk atau retur barang.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Filters Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Filter Transaksi</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Search */}
                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Cari Transaksi
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="No. struk atau kasir..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/30 pl-10 pr-4 text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="completed">Success</option>
                    <option value="voided">Void</option>
                    <option value="partially_refunded">Refund (Retur)</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Mulai Tanggal
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 pr-10 text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Sampai Tanggal
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 pr-10 text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

              </div>

              {/* Reset Button */}
              {(search || statusFilter !== "all" || startDate || endDate) && (
                <div className="flex justify-end pt-2 border-t border-slate-50">
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="h-3 w-3" /> Bersihkan Filter
                  </button>
                </div>
              )}
            </div>

            {/* Table Area */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  <span>Memuat daftar transaksi...</span>
                </div>
              ) : paginatedTransactions.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
                  <Receipt className="h-8 w-8 text-slate-300" />
                  <span>Tidak ada transaksi yang cocok dengan filter saat ini.</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">ID Transaksi</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Waktu</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nama Kasir</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Metode</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Total Belanja</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedTransactions.map((t: any) => {
                          const statusStyle = STATUS_STYLE[t.status] || "bg-slate-50 text-slate-600 border-slate-200";
                          const statusText = STATUS_LABEL[t.status] || t.status;
                          const createdDate = new Date(t.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          });

                          return (
                            <tr 
                              key={t.id} 
                              onClick={() => openDetail(t)}
                              className="hover:bg-blue-50/10 cursor-pointer transition-colors"
                            >
                              <td className="px-6 py-4 font-mono text-xs font-black text-slate-700">
                                {t.transaction_code}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                {createdDate}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-900">
                                {t.user?.name || "Kasir"}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {t.payment_method}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-black text-slate-900">
                                Rp {t.total_amount.toLocaleString("id-ID")}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusStyle}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                      <p className="text-xs text-slate-500 font-semibold">
                        Menampilkan <span className="font-bold text-slate-950">{startIndex + 1}</span>-{Math.min(startIndex + itemsPerPage, totalItems)} dari <span className="font-bold text-slate-950">{totalItems}</span> transaksi
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="size-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          const isCurrent = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`size-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                                isCurrent 
                                  ? "bg-blue-600 text-white font-black" 
                                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="size-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronRightIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-blue-50 rounded-lg text-blue-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Detail Transaksi</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider">{selectedTransaction.transaction_code}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Summary Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs font-semibold text-slate-500">
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5"><Clock className="size-3.5 text-slate-400" /> Waktu: <span className="font-bold text-slate-950">{new Date(selectedTransaction.created_at).toLocaleString("id-ID")}</span></p>
                  <p className="flex items-center gap-1.5"><User className="size-3.5 text-slate-400" /> Kasir: <span className="font-bold text-slate-950">{selectedTransaction.user?.name || "Kasir"}</span></p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p>Metode Pembayaran: <span className="font-bold text-slate-950 uppercase">{selectedTransaction.payment_method}</span></p>
                  <p>
                    Status: <span className={`inline-block ml-1 font-bold ${
                      selectedTransaction.status === 'completed' ? 'text-emerald-600' :
                      selectedTransaction.status === 'voided' ? 'text-red-500' : 'text-amber-600'
                    }`}>{STATUS_LABEL[selectedTransaction.status] || selectedTransaction.status}</span>
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Barang Belanja</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {detailLoading ? (
                    <div className="py-8 flex justify-center text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                    selectedTransaction.items.map((item: any) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-medium hover:bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-950">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.qty} {item.unit_choice === "big" ? "Grosir" : "Pcs"} · Rp {item.unit_price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-slate-400 text-xs">Belum ada item belanja.</p>
                  )}
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-500 space-y-2.5">
                <div className="flex justify-between">
                  <span>Subtotal Belanja</span>
                  <span className="text-slate-950 font-bold">
                    Rp {((selectedTransaction.total_amount || 0) + (selectedTransaction.discount_amount || 0)).toLocaleString("id-ID")}
                  </span>
                </div>
                {selectedTransaction.discount_amount > 0 && (
                  <div className="flex justify-between text-red-500 font-bold">
                    <span className="flex items-center gap-1"><Tag className="size-3" /> Diskon Member</span>
                    <span>-Rp {selectedTransaction.discount_amount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="border-t border-slate-200/60 my-2 pt-2 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Total Akhir</span>
                  <span className="font-black text-slate-950 text-base">
                    Rp {(selectedTransaction.total_amount || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Uang Dibayar</span>
                  <span className="text-slate-950">Rp {(selectedTransaction.amount_paid || 0).toLocaleString("id-ID")}</span>
                </div>
                {selectedTransaction.change_amount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Kembalian</span>
                    <span className="text-slate-950">Rp {(selectedTransaction.change_amount || 0).toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="size-4 text-slate-400" /> Cetak Ulang Struk
              </button>
              
              {selectedTransaction.status === "completed" && (
                <button
                  type="button"
                  onClick={() => setShowRefundModal(true)}
                  className="flex-1 h-10 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-4" /> Retur Barang
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="sm:w-20 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Reprint Receipt Layout - Rendered only on physical print */}
      {selectedTransaction && (
        <div className="hidden print:block text-black font-mono text-xs p-6 w-[80mm] mx-auto">
          <h1 className="text-center font-bold text-base mb-1">GoPOS Store</h1>
          <p className="text-center text-[10px] mb-2">Riwayat Transaksi Admin (Salinan)</p>
          <div className="border-b border-dashed border-black mb-2" />
          <div className="space-y-0.5 mb-2">
            <p>Nota: {selectedTransaction.transaction_code}</p>
            <p>Tanggal: {new Date(selectedTransaction.created_at).toLocaleString("id-ID")}</p>
            <p>Kasir: {selectedTransaction.user?.name || "Kasir"}</p>
            <p>Metode: {selectedTransaction.payment_method.toUpperCase()}</p>
            {selectedTransaction.member && <p>Member: {selectedTransaction.member.name}</p>}
          </div>
          <div className="border-b border-dashed border-black mb-2" />
          
          <div className="space-y-1 mb-2">
            {selectedTransaction.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p>{item.product_name}</p>
                  <p className="text-[10px] text-slate-600 pl-2">
                    {item.qty}x Rp {item.unit_price.toLocaleString("id-ID")}
                  </p>
                </div>
                <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
          
          <div className="border-b border-dashed border-black my-2" />
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {((selectedTransaction.total_amount || 0) + (selectedTransaction.discount_amount || 0)).toLocaleString("id-ID")}</span>
            </div>
            {selectedTransaction.discount_amount > 0 && (
              <div className="flex justify-between font-bold">
                <span>Diskon Member:</span>
                <span>-Rp {selectedTransaction.discount_amount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1">
              <span>TOTAL:</span>
              <span>Rp {selectedTransaction.total_amount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-[10px] pt-1">
              <span>Dibayar:</span>
              <span>Rp {selectedTransaction.amount_paid.toLocaleString("id-ID")}</span>
            </div>
            {selectedTransaction.change_amount > 0 && (
              <div className="flex justify-between text-[10px]">
                <span>Kembalian:</span>
                <span>Rp {selectedTransaction.change_amount.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>
          
          <div className="border-b border-dashed border-black my-2" />
          <p className="text-center text-[10px] mt-4 font-bold">Terima Kasih Atas Kunjungan Anda</p>
          
          {selectedTransaction.status === "voided" && (
            <div className="text-center font-bold text-red-600 mt-2 border border-red-500 p-1 uppercase">
              *** TRANSAKSI DIBATALKAN (VOID) ***
            </div>
          )}
          {selectedTransaction.status === "partially_refunded" && (
            <div className="text-center font-bold text-amber-600 mt-2 border border-amber-500 p-1 uppercase">
              *** TRANSAKSI DIRETER (REFUNDED) ***
            </div>
          )}
        </div>
      )}

      {/* Return/Refund Modal */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSuccess={handleRefundSuccess}
        transaction={selectedTransaction}
      />
    </div>
  );
}
