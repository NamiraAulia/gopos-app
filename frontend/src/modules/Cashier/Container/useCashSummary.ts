"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cashierDAO } from "../DAO/cashier.dao";
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
      const [shiftRes, txRes, expRes] = await Promise.all([
        cashierDAO.getActiveShift(),
        cashierDAO.getTransactions(100),
        cashierDAO.getExpenses(),
      ]);

      if (shiftRes.success && shiftRes.data) setActiveShift(shiftRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data);
      if (expRes.success && expRes.data) setExpenses(expRes.data);
    } catch (err) {
      console.error("Gagal memuat rekap kas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedTrx = transactions.filter((t) => t.status === "completed");
  const voidedTrx = transactions.filter((t) => t.status === "voided");

  const cashTotal = completedTrx.filter((t) => t.payment_method === "cash").reduce((sum, t) => sum + t.total_amount, 0);
  const qrisTotal = completedTrx.filter((t) => t.payment_method === "qris").reduce((sum, t) => sum + t.total_amount, 0);
  const transferTotal = completedTrx.filter((t) => t.payment_method === "transfer").reduce((sum, t) => sum + t.total_amount, 0);

  const totalIncome = completedTrx.reduce((sum, t) => sum + t.total_amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVoided = voidedTrx.reduce((sum, t) => sum + t.total_amount, 0);

  const startCash = activeShift?.start_cash || 0;
  const totalUangMasuk = totalIncome;
  const totalUangKeluar = totalExpense;
  const totalKas = activeShift?.total_cash_expected || startCash + totalUangMasuk - totalUangKeluar;

  const actualCashNum = Number(actualCashInput) || activeShift?.total_cash_actual || totalKas;
  const selisih = actualCashNum - totalKas;
  const netProfit = totalIncome - totalExpense;

  const handleCloseShift = async (actual: number) => {
    setIsClosingShift(true);
    try {
      const res = await cashierDAO.closeShift(actual);
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
    transactions,
    expenses,
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
