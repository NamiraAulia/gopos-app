"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Wallet, ArrowUpRight, ArrowDownRight, Plus, Calendar, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Transaction, Expense } from "../../features/finance/types";
import { ExpenseModal } from "../../features/finance/components/ExpenseModal";

export default function FinancialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resTrx, resExp] = await Promise.all([
        fetch(`${API_URL}/api/v1/transactions`, { headers }),
        fetch(`${API_URL}/api/v1/expenses`, { headers })
      ]);

      const dataTrx = await resTrx.json();
      const dataExp = await resExp.json();

      if (dataTrx.success && dataTrx.data && dataTrx.data.data) {
        setTransactions(dataTrx.data.data);
      }
      if (dataExp.success && dataExp.data) {
        setExpenses(dataExp.data);
      }
    } catch (error) {
      console.error("Gagal memuat data keuangan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Ikhtisar Keuangan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              Bulan April
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Ikhtisar Keuangan</h2>
            <p className="text-slate-500 text-sm mt-1">Pantau arus kas bisnis Anda secara mendetail.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Uang Masuk */}
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
              <p className="text-xs text-emerald-600/70 mt-2 font-medium">Estimasi Keuntungan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                  Daftar Uang Masuk
                </h3>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((trx) => (
                    <div key={trx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Penjualan POS #{trx.transaction_code.slice(-4)}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          {new Date(trx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {trx.payment_method}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-emerald-600">+Rp {trx.total_amount.toLocaleString("id-ID")}</span>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-red-700">Daftar Uang Keluar</h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
                >
                  + Catat Pengeluaran
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-400">Belum ada pengeluaran dicatat.</p>
                  ) : (
                    expenses.slice(0, 5).map((exp) => (
                      <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{exp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                            {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {exp.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-red-500">-Rp {exp.amount.toLocaleString("id-ID")}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
      
    </div>
  );
}