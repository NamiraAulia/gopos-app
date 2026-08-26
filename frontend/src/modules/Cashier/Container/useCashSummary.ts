"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cashierDAO } from "../DAO/cashier.dao";
import { fetchCashSummaryData } from "@/service/cashSummary.service";
import type { ShiftDataDTO as ShiftData, TransactionDTO as Transaction, ExpenseDTO as Expense } from "../DTO/cashier.dto";

export function useCashSummary() {
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [actualCashInput, setActualCashInput] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const summaryData = await fetchCashSummaryData();
      setActiveShift(summaryData.activeShift as any);
      setTransactions(summaryData.transactions as any);
      setExpenses(summaryData.expenses as any);
    } catch (err) {
      console.error("Gagal memuat rekap kas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentShiftStartTime = activeShift?.start_time ? new Date(activeShift.start_time).getTime() : 0;

  const filteredTransactions = currentShiftStartTime > 0
    ? transactions.filter((t) => new Date(t.created_at).getTime() >= currentShiftStartTime)
    : transactions;

  const filteredExpenses = currentShiftStartTime > 0
    ? expenses.filter((e) => new Date(e.created_at).getTime() >= currentShiftStartTime)
    : expenses;

  const completedTrx = filteredTransactions.filter((t) => t.status === "completed");
  const voidedTrx = filteredTransactions.filter((t) => t.status === "voided");

  const cashTotal = completedTrx.filter((t) => t.payment_method === "cash").reduce((sum, t) => sum + t.total_amount, 0);
  const qrisTotal = completedTrx.filter((t) => t.payment_method === "qris").reduce((sum, t) => sum + t.total_amount, 0);
  const transferTotal = completedTrx.filter((t) => t.payment_method === "transfer").reduce((sum, t) => sum + t.total_amount, 0);

  const totalIncome = completedTrx.reduce((sum, t) => sum + t.total_amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVoided = voidedTrx.reduce((sum, t) => sum + t.total_amount, 0);

  const startCash = activeShift?.start_cash || 0;
  const totalUangMasuk = totalIncome;
  const totalUangKeluar = totalExpense;
  const totalKas = activeShift?.total_cash_expected ?? (startCash + cashTotal - totalExpense);

  const actualCashNum = Number(actualCashInput) || activeShift?.total_cash_actual || totalKas;
  const selisih = actualCashNum - totalKas;
  const netProfit = totalIncome - totalExpense;

  const handleCloseShift = async (actual: number, discrepancyNote?: string) => {
    setIsClosingShift(true);
    try {
      const res = await cashierDAO.closeShift(actual, discrepancyNote);
      if (res.success) {
        setIsCloseShiftModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Gagal menutup shift.");
    } finally {
      setIsClosingShift(false);
    }
  };

  return {
    router,
    activeShift,
    transactions: filteredTransactions,
    expenses: filteredExpenses,
    loading,
    isLoading: loading,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    isCloseShiftModalOpen,
    setIsCloseShiftModalOpen,
    isModalOpen: isCloseShiftModalOpen,
    setIsModalOpen: setIsCloseShiftModalOpen,
    actualCashInput,
    setActualCashInput,
    completedTrx,
    cashTotal,
    qrisTotal,
    transferTotal,
    totalIncome,
    totalExpense,
    voidedTrx,
    totalVoided,
    startCash,
    totalUangMasuk,
    totalUangKeluar,
    totalKas,
    actualCashNum,
    selisih,
    netProfit,
    fetchData: loadData,
    isClosingShift,
    handleCloseShift,
    refetch: loadData,
  };
}
