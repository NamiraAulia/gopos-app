"use client";

import {
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp,
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  User,
  TrendingDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Receipt,
  PieChart,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { TransactionDTO as Transaction, ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";
import { ExpenseModal } from "@/modules/Cashier/Component/ExpenseModal";

interface FinanceViewProps {
  activeTab: "overview" | "expenses";
  setActiveTab: (tab: "overview" | "expenses") => void;
  transactions: Transaction[];
  expenses: Expense[];
  filteredExpenses: Expense[];
  paginatedExpenses: Expense[];
  isLoading: boolean;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  todayExpense: number;
  monthExpense: number;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedExpense: Expense | null;
  setSelectedExpense: (exp: Expense | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  fetchData: () => void;
  handleOpenAdd: () => void;
  handleOpenEdit: (exp: Expense) => void;
  handleDelete: (exp: Expense) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Operasional: "bg-blue-50 text-blue-700 border-blue-200",
  "Suplai / Restock": "bg-amber-50 text-amber-700 border-amber-200",
  Suplai: "bg-amber-50 text-amber-700 border-amber-200",
  Gaji: "bg-purple-50 text-purple-700 border-purple-200",
  Sewa: "bg-pink-50 text-pink-700 border-pink-200",
};

export function FinanceView({
  activeTab,
  setActiveTab,
  transactions,
  expenses,
  filteredExpenses,
  paginatedExpenses,
  isLoading,
  totalIncome,
  totalExpense,
  netProfit,
  todayExpense,
  monthExpense,
  isModalOpen,
  setIsModalOpen,
  selectedExpense,
  setSelectedExpense,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  fetchData,
  handleOpenAdd,
  handleOpenEdit,
  handleDelete,
}: FinanceViewProps) {
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
              <span className="text-base sm:text-lg font-black text-slate-900">Keuangan & Pengeluaran Toko</span>
            </div>
          </div>

          {/* Tab Switcher in Header */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PieChart className="h-4 w-4 stroke-[2.5]" />
              Ikhtisar Laba Rugi
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wallet className="h-4 w-4 stroke-[2.5]" />
              Detail Pengeluaran ({expenses.length})
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          {activeTab === "overview" ? (
            /* TAB 1: IKHTISAR LABA RUGI */
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Ikhtisar Laba Rugi & Arus Kas</h2>
                <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">Pantau total omzet pemasukan vs pengeluaran operasional toko.</p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-3">
                    <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider">Total Uang Masuk</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-emerald-600">Rp {totalIncome.toLocaleString("id-ID")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 font-bold">Bulan Berjalan</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-red-500 mb-3">
                    <ArrowDownRight className="h-5 w-5 stroke-[2.5]" />
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider">Total Uang Keluar</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-red-500">Rp {totalExpense.toLocaleString("id-ID")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 font-bold">Bulan Berjalan</p>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-500 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 mb-3">
                    <TrendingUp className="h-5 w-5 stroke-[2.5]" />
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider">Laba Bersih</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-emerald-700">Rp {netProfit.toLocaleString("id-ID")}</h3>
                  <p className="text-xs sm:text-sm text-emerald-700/80 mt-2 font-bold">Estimasi Keuntungan Toko</p>
                </div>
              </div>

              {/* 2 Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Uang Masuk */}
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-black text-emerald-800 flex items-center gap-2">
                    Daftar Transaksi Uang Masuk
                  </h3>
                  <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {isLoading ? (
                        <p className="p-10 text-center text-sm font-bold text-slate-400">Memuat data...</p>
                      ) : transactions.length === 0 ? (
                        <p className="p-10 text-center text-sm font-bold text-slate-400">Belum ada transaksi masuk.</p>
                      ) : (
                        transactions.slice(0, 5).map((trx) => (
                          <div key={trx.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-base font-black text-slate-900">Penjualan POS #{trx.transaction_code.slice(-4)}</p>
                              <p className="text-xs text-slate-500 font-bold uppercase mt-1">
                                {new Date(trx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {trx.payment_method}
                              </p>
                            </div>
                            <span className="text-base sm:text-lg font-black text-emerald-600">+Rp {trx.total_amount.toLocaleString("id-ID")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Uang Keluar */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-black text-red-800">Daftar Pengeluaran Terakhir</h3>
                    <button
                      onClick={handleOpenAdd}
                      className="bg-red-600 text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl uppercase tracking-wider hover:bg-red-700 transition-all shadow-md shadow-red-600/20 cursor-pointer"
                    >
                      + Catat Pengeluaran
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {isLoading ? (
                        <p className="p-10 text-center text-sm font-bold text-slate-400">Memuat data...</p>
                      ) : expenses.length === 0 ? (
                        <p className="p-10 text-center text-sm font-bold text-slate-400">Belum ada pengeluaran dicatat.</p>
                      ) : (
                        expenses.slice(0, 5).map((exp) => (
                          <div key={exp.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-base font-black text-slate-900">{exp.name}</p>
                              <p className="text-xs text-slate-500 font-bold uppercase mt-1">
                                {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {exp.category}
                              </p>
                            </div>
                            <span className="text-base sm:text-lg font-black text-red-500">-Rp {exp.amount.toLocaleString("id-ID")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DETAIL & KELOLA PENGELUARAN */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengeluaran Toko</h2>
                  <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">Catat dan audit seluruh biaya operasional & belanja stok toko.</p>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-500 tracking-wider">Pengeluaran Hari Ini</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">Rp {todayExpense.toLocaleString("id-ID")}</h3>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                    <TrendingDown className="h-7 w-7 stroke-[2.5]" />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-500 tracking-wider">Pengeluaran Bulan Ini</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">Rp {monthExpense.toLocaleString("id-ID")}</h3>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Wallet className="h-7 w-7 stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {["all", "Operasional", "Suplai", "Gaji", "Sewa"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat === "all" ? "Semua Kategori" : cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 stroke-[2.5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari pengeluaran..."
                    className="h-12 w-full rounded-xl border-2 border-slate-200 pl-12 pr-4 text-sm sm:text-base font-bold outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Table Expenses */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                  <div className="py-20 text-center text-slate-400 font-black text-sm">Memuat data pengeluaran...</div>
                ) : paginatedExpenses.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-black text-sm">Tidak ada data pengeluaran ditemukan.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-800 uppercase tracking-wider text-xs sm:text-sm font-black">
                          <th className="py-4 px-6">Nama Pengeluaran</th>
                          <th className="py-4 px-6">Kategori</th>
                          <th className="py-4 px-6">Dicatat Oleh</th>
                          <th className="py-4 px-6">Waktu & Tanggal</th>
                          <th className="py-4 px-6 text-right">Nominal Biaya</th>
                          <th className="py-4 px-6 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6 font-black text-slate-900 text-base">{exp.name}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-black border ${CATEGORY_COLORS[exp.category] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 font-bold text-sm sm:text-base">
                              <span className="flex items-center gap-1.5 font-bold">
                                <User className="h-4 w-4 text-slate-400 stroke-[2.5]" /> {exp.user?.name || "Kasir Toko"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-600 font-mono text-xs sm:text-sm font-bold">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4 text-slate-400 stroke-[2.5]" />
                                {exp.created_at
                                  ? new Date(exp.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                                  : "Hari ini (Tanpa Tanggal)"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-red-600 text-base sm:text-lg">
                              -Rp {exp.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleOpenEdit(exp)} className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200" title="Edit Pengeluaran">
                                  <Pencil className="h-4.5 w-4.5 stroke-[2.5]" />
                                </button>
                                <button onClick={() => handleDelete(exp)} className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200" title="Hapus Pengeluaran">
                                  <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Bar */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>Halaman {currentPage} dari {totalPages} • Total {totalItems} catatan</span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={fetchData}
        expenseData={selectedExpense || undefined}
      />
    </div>
  );
}
