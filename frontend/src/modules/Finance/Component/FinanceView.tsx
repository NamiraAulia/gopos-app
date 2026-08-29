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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Keuangan & Pengeluaran Toko</span>
          </div>

          {/* Tab Switcher in Header */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              Ikhtisar Laba Rugi
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              Detail Pengeluaran ({expenses.length})
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "overview" ? (
            /* TAB 1: IKHTISAR LABA RUGI */
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Ikhtisar Laba Rugi & Arus Kas</h2>
                <p className="text-slate-500 text-sm mt-1">Pantau total omzet pemasukan vs pengeluaran operasional toko.</p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-3">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Uang Masuk</span>
                  </div>
                  <h3 className="text-3xl font-black text-emerald-600">Rp {totalIncome.toLocaleString("id-ID")}</h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Bulan Berjalan</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-red-500 mb-3">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Uang Keluar</span>
                  </div>
                  <h3 className="text-3xl font-black text-red-500">Rp {totalExpense.toLocaleString("id-ID")}</h3>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Bulan Berjalan</p>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-500 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 mb-3">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Laba Bersih</span>
                  </div>
                  <h3 className="text-3xl font-black text-emerald-700">Rp {netProfit.toLocaleString("id-ID")}</h3>
                  <p className="text-xs text-emerald-600/70 mt-2 font-medium">Estimasi Keuntungan Toko</p>
                </div>
              </div>

              {/* 2 Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Uang Masuk */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                    Daftar Transaksi Uang Masuk
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {isLoading ? (
                        <p className="p-10 text-center text-sm text-slate-400">Memuat data...</p>
                      ) : transactions.length === 0 ? (
                        <p className="p-10 text-center text-sm text-slate-400">Belum ada transaksi masuk.</p>
                      ) : (
                        transactions.slice(0, 5).map((trx) => (
                          <div key={trx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-slate-900">Penjualan POS #{trx.transaction_code.slice(-4)}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                {new Date(trx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {trx.payment_method}
                              </p>
                            </div>
                            <span className="text-sm font-black text-emerald-600">+Rp {trx.total_amount.toLocaleString("id-ID")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Uang Keluar */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-red-700">Daftar Pengeluaran Terakhir</h3>
                    <button
                      onClick={handleOpenAdd}
                      className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-red-700 transition-all shadow-md shadow-red-600/20 cursor-pointer"
                    >
                      + Catat Pengeluaran
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {isLoading ? (
                        <p className="p-10 text-center text-sm text-slate-400">Memuat data...</p>
                      ) : expenses.length === 0 ? (
                        <p className="p-10 text-center text-sm text-slate-400">Belum ada pengeluaran dicatat.</p>
                      ) : (
                        expenses.slice(0, 5).map((exp) => (
                          <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{exp.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {exp.category}
                              </p>
                            </div>
                            <span className="text-sm font-black text-red-500">-Rp {exp.amount.toLocaleString("id-ID")}</span>
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
                  <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengeluaran Toko</h2>
                  <p className="text-slate-500 text-sm mt-1">Catat dan audit seluruh biaya operasional & belanja stok toko.</p>
                </div>
                {/* <button
                  onClick={handleOpenAdd}
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" /> Catat Pengeluaran Baru
                </button> */}
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Pengeluaran Hari Ini</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Rp {todayExpense.toLocaleString("id-ID")}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Pengeluaran Bulan Ini</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Rp {monthExpense.toLocaleString("id-ID")}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                  {["all", "Operasional", "Suplai", "Gaji", "Sewa"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat === "all" ? "Semua Kategori" : cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari pengeluaran..."
                    className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-xs font-bold outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Table Expenses */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                  <div className="py-16 text-center text-slate-400 font-bold text-xs">Memuat data pengeluaran...</div>
                ) : paginatedExpenses.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-bold text-xs">Tidak ada data pengeluaran ditemukan.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                          <th className="py-3.5 px-4">Nama Pengeluaran</th>
                          <th className="py-3.5 px-4">Kategori</th>
                          <th className="py-3.5 px-4">Dicatat Oleh</th>
                          <th className="py-3.5 px-4">Waktu & Tanggal</th>
                          <th className="py-3.5 px-4 text-right">Nominal Biaya</th>
                          <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {paginatedExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{exp.name}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${CATEGORY_COLORS[exp.category] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="flex items-center gap-1 font-semibold">
                                <User className="h-3 w-3 text-slate-400" /> {exp.user?.name || "Kasir Toko"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3 text-slate-400" />
                                {exp.created_at
                                  ? new Date(exp.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                                  : "Hari ini (Tanpa Tanggal)"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-red-600 text-sm">
                              -Rp {exp.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleOpenEdit(exp)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" title="Edit Pengeluaran">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(exp)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" title="Hapus Pengeluaran">
                                  <Trash2 className="h-4 w-4" />
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
