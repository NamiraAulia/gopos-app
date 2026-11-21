"use client";

import { ChevronRight, Search, Receipt } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { TransactionDTO as Transaction } from "../DTO/transactions.dto";

interface TransactionViewProps {
  filteredTransactions: Transaction[];
  isLoading: boolean;
  search: string;
  setSearch: (q: string) => void;
}

export function TransactionView({
  filteredTransactions,
  isLoading,
  search,
  setSearch,
}: TransactionViewProps) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 sm:h-18 bg-white border-b-2 border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Receipt className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-bold text-slate-700 text-base">Manajemen</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              <span className="font-black text-slate-900 text-base sm:text-lg">Riwayat Transaksi</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Riwayat Transaksi</h1>
                <p className="text-sm sm:text-base font-bold text-slate-600 mt-1">Daftar semua transaksi penjualan di GoPOS.</p>
              </div>

              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 stroke-[2.5]" />
                <input
                  type="text"
                  placeholder="Cari kode / metode / member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 text-base font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-16 text-center text-slate-500 text-base font-bold">Memuat transaksi...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-base font-bold">Tidak ada transaksi ditemukan.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-200 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">
                        <th className="py-4 px-6">Kode Transaksi</th>
                        <th className="py-4 px-6">Tanggal</th>
                        <th className="py-4 px-6">Member</th>
                        <th className="py-4 px-6">Metode</th>
                        <th className="py-4 px-6 text-right">Total</th>
                        <th className="py-4 px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-base">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4.5 px-6 font-mono font-black text-blue-700 text-base sm:text-lg">{tx.transaction_code}</td>
                          <td className="py-4.5 px-6 text-slate-600 font-bold text-sm sm:text-base">{new Date(tx.created_at).toLocaleString("id-ID")}</td>
                          <td className="py-4.5 px-6 text-slate-900 font-black text-base">{tx.member?.name || "-"}</td>
                          <td className="py-4.5 px-6 text-slate-700 font-extrabold uppercase text-sm sm:text-base">{tx.payment_method}</td>
                          <td className="py-4.5 px-6 text-right font-black text-slate-900 text-lg">
                            Rp {tx.total_amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-4.5 px-6 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-xl text-xs sm:text-sm font-black border ${
                                tx.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : tx.status === "voided"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
