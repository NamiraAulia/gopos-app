"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  CalendarDays,
  User,
  TrendingDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { ExpenseModal } from "@/features/cashier/components/ExpenseModal";
import { useAdminExpenses } from "@/features/expenses/hooks/useAdminExpenses";

const CATEGORY_COLORS: Record<string, string> = {
  Operasional: "bg-blue-50 text-blue-700 border-blue-200",
  "Suplai / Restock": "bg-amber-50 text-amber-700 border-amber-200",
  Suplai: "bg-amber-50 text-amber-700 border-amber-200",
  Gaji: "bg-purple-50 text-purple-700 border-purple-200",
  Sewa: "bg-pink-50 text-pink-700 border-pink-200",
};

export default function AdminExpensesPage() {
  const router = useRouter();
  const {
    currentUser,
    isHydrated,
    expenses,
    loading,
    error,
    isModalOpen,
    setIsModalOpen,
    selectedExpense,
    setSelectedExpense,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    todayTotal,
    monthTotal,
    totalItems,
    totalPages,
    startIndex,
    paginatedExpenses,
    fetchExpenses,
    goToPage,
    handleOpenAddModal,
    handleOpenEditModal,
  } = useAdminExpenses();

  useEffect(() => {
    if (isHydrated) {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.role !== "admin") {
        router.push("/cashier");
      }
    }
  }, [isHydrated, currentUser, router]);

  if (!isHydrated || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Manajemen Pengeluaran</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Pengeluaran</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Pantau kas keluar, pengeluaran operasional toko, suplai barang, gaji, dan restock logistik.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-600/10 hover:shadow-lg hover:shadow-red-600/20 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Catat Pengeluaran
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* KPI Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Today's Expense */}
              <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-full w-2 bg-red-500" />
                <div className="space-y-1 pl-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pengeluaran Hari Ini</span>
                  <h3 className="text-2xl font-black text-slate-900">
                    Rp {todayTotal.toLocaleString("id-ID")}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Berdasarkan pencatatan kas keluar hari ini</p>
                </div>
                <div className="size-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>

              {/* Month's Expense */}
              <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-full w-2 bg-purple-500" />
                <div className="space-y-1 pl-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pengeluaran Bulan Ini</span>
                  <h3 className="text-2xl font-black text-slate-900">
                    Rp {monthTotal.toLocaleString("id-ID")}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Akumulasi pengeluaran pada bulan berjalan</p>
                </div>
                <div className="size-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-6 w-6" />
                </div>
              </div>

            </div>

            {/* Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  <span>Memuat data pengeluaran...</span>
                </div>
              ) : paginatedExpenses.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
                  <Wallet className="h-8 w-8 text-slate-300" />
                  <span>Belum ada catatan pengeluaran yang terdaftar.</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal & Jam</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nama Staf</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kategori</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nominal</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Catatan Pengeluaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedExpenses.map((e: any) => {
                          const dateObj = new Date(e.created_at);
                          const formattedDate = dateObj.toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          });

                          const categoryStyle = CATEGORY_COLORS[e.category] || "bg-slate-100 text-slate-700 border-slate-200";

                          return (
                            <tr
                              key={e.id}
                              onClick={() => handleOpenEditModal(e)}
                              className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                              title="Klik untuk mengubah atau menghapus"
                            >
                              <td className="px-6 py-4 text-xs text-slate-500 font-semibold">
                                {formattedDate}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <User className="size-3.5 text-slate-400" />
                                  <span>{e.user?.name || `Staf ID: ${e.user_id || "?"}`}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${categoryStyle}`}>
                                  {e.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-black text-red-600">
                                Rp {e.amount.toLocaleString("id-ID")}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-700 font-medium max-w-xs truncate">
                                {e.name}
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
                        Menampilkan <span className="font-bold text-slate-950">{startIndex + 1}</span>-{Math.min(startIndex + itemsPerPage, totalItems)} dari <span className="font-bold text-slate-950">{totalItems}</span> pengeluaran
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

      {/* Expense Modal Input / Edit */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        expenseData={selectedExpense}
      />
    </div>
  );
}
