"use client";

import { ChevronRight, Search } from "lucide-react";
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
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <span className="font-medium text-slate-800">Manajemen</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold text-blue-600">Riwayat Transaksi</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
                <p className="text-sm text-slate-500 mt-1">Daftar semua transaksi penjualan di GoPOS.</p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode / metode / member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-slate-400">Memuat transaksi...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Tidak ada transaksi ditemukan.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Kode Transaksi</th>
                      <th className="py-3.5 px-6">Tanggal</th>
                      <th className="py-3.5 px-6">Member</th>
                      <th className="py-3.5 px-6">Metode</th>
                      <th className="py-3.5 px-6 text-right">Total</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-mono font-medium text-blue-600">{tx.transaction_code}</td>
                        <td className="py-4 px-6 text-slate-600">{new Date(tx.created_at).toLocaleString("id-ID")}</td>
                        <td className="py-4 px-6 text-slate-800 font-medium">{tx.member?.name || "-"}</td>
                        <td className="py-4 px-6 text-slate-600 capitalize">{tx.payment_method}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                          Rp {tx.total_amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              tx.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : tx.status === "voided"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
