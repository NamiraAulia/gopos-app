"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Receipt, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Transaction } from "../../features/transactions/types";
import { TransactionTable } from "../../features/transactions/components/TransactionTable";
import { supabase } from "@/utils/supabaseClient";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          user:users(id, name, email, role),
          member:members(id, name, phone),
          items:transaction_items(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setTransactions(data as Transaction[]);
      }
    } catch (error) {
      console.error("Gagal ambil data transaksi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = transactions.filter(
    (t) =>
      t.transaction_code?.toLowerCase().includes(search.toLowerCase()) ||
      t.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Receipt className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Riwayat Sales</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Transaksi</h2>
            <p className="text-slate-500 text-sm mt-1">Semua riwayat penjualan tercatat di sini.</p>
          </div>

          {/* Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
                placeholder="Cari kode transaksi atau status..."
              />
            </div>
          </div>

          <TransactionTable transactions={filtered} isLoading={isLoading} />
          
        </div>
      </main>
    </div>
  );
}