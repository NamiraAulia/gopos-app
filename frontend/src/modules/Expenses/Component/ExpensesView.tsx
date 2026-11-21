"use client";

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
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { ExpenseModal } from "@/modules/Cashier/Component/ExpenseModal";
import type { ExpenseDAO } from "../DAO/expenses.dao";

const CATEGORY_COLORS: Record<string, string> = {
  Operasional: "bg-blue-50 text-blue-700 border-blue-200",
  "Suplai / Restock": "bg-amber-50 text-amber-700 border-amber-200",
  Suplai: "bg-amber-50 text-amber-700 border-amber-200",
  Gaji: "bg-purple-50 text-purple-700 border-purple-200",
  Sewa: "bg-pink-50 text-pink-700 border-pink-200",
};

interface ExpensesViewProps {
  currentUser: any;
  expenses: ExpenseDAO[];
  paginatedExpenses: ExpenseDAO[];
  loading: boolean;
  error: string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedExpense: ExpenseDAO | null;
  currentPage: number;
  itemsPerPage: number;
  todayTotal: number;
  monthTotal: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  goToPage: (p: number) => void;
  handleOpenAddModal: () => void;
  handleOpenEditModal: (exp: ExpenseDAO) => void;
  fetchExpenses: () => void;
}

export function ExpensesView({
  expenses,
  paginatedExpenses,
  loading,
  error,
  isModalOpen,
  setIsModalOpen,
  selectedExpense,
  currentPage,
  itemsPerPage,
  todayTotal,
  monthTotal,
  totalItems,
  totalPages,
  startIndex,
  goToPage,
  handleOpenAddModal,
  handleOpenEditModal,
  fetchExpenses,
}: ExpensesViewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 sm:h-18 bg-white border-b-2 border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Wallet className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              <span className="text-base sm:text-lg font-black text-slate-900">Manajemen Pengeluaran</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengeluaran</h2>
                <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                  Pantau kas keluar, pengeluaran operasional toko, suplai barang, gaji, dan restock logistik.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* KPI Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Today's Expense */}
              <div className="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-full w-2.5 bg-red-500" />
                <div className="space-y-1 pl-3">
                  <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest block">Pengeluaran Hari Ini</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                    Rp {todayTotal.toLocaleString("id-ID")}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">Berdasarkan pencatatan kas keluar hari ini</p>
                </div>
                <div className="size-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown className="h-7 w-7 stroke-[2.5]" />
                </div>
              </div>

              {/* Month's Expense */}
              <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-full w-2.5 bg-purple-500" />
                <div className="space-y-1 pl-3">
                  <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest block">Pengeluaran Bulan Ini</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                    Rp {monthTotal.toLocaleString("id-ID")}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">Akumulasi pengeluaran pada bulan berjalan</p>
                </div>
                <div className="size-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-7 w-7 stroke-[2.5]" />
                </div>
              </div>

            </div>

            {/* Table Card */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-base font-bold gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span>Memuat data pengeluaran...</span>
                </div>
              ) : paginatedExpenses.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-base font-bold flex flex-col items-center gap-2">
                  <Wallet className="h-10 w-10 text-slate-300 stroke-[2.5]" />
                  <span>Belum ada catatan pengeluaran yang terdaftar.</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Tanggal & Jam</th>
                          <th className="px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Nama Staf</th>
                          <th className="px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Kategori</th>
                          <th className="px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Nominal</th>
                          <th className="px-6 py-4 text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Catatan Pengeluaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedExpenses.map((e: ExpenseDAO) => {
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
                              className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                              title="Klik untuk mengubah atau menghapus"
                            >
                              <td className="px-6 py-4 text-xs sm:text-sm text-slate-600 font-bold">
                                {formattedDate}
                              </td>
                              <td className="px-6 py-4 text-sm sm:text-base font-black text-slate-900">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-slate-400 stroke-[2.5]" />
                                  <span>{e.user?.name || `Staf ID: ${e.user_id || "?"}`}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${categoryStyle}`}>
                                  {e.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-base sm:text-lg font-black text-red-600">
                                Rp {e.amount.toLocaleString("id-ID")}
                              </td>
                              <td className="px-6 py-4 text-sm sm:text-base text-slate-800 font-bold max-w-xs truncate">
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

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        expenseData={selectedExpense as any}
      />
    </div>
  );
}
