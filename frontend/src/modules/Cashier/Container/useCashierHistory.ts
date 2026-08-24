"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cashierDAO } from "../DAO/cashier.dao";
import type { TransactionDTO as Transaction } from "../DTO/cashier.dto";

export function useCashierHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchCode, setSearchCode] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");
  const [isShiftActive, setIsShiftActive] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cashierDAO.getTransactions(100);
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat history transaksi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShift = useCallback(async () => {
    try {
      const res = await cashierDAO.getActiveShift();
      setIsShiftActive(!!(res.success && res.data));
    } catch (err) {
      setIsShiftActive(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchShift();
  }, [fetchTransactions, fetchShift]);

  const openDetail = (trx: Transaction) => {
    setSelected(trx);
  };

  const handlePrint = () => {
    window.print();
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    setVoidLoading(true);
    setVoidError("");
    try {
      const res = await cashierDAO.voidTransaction(voidTarget.id);
      if (res.success) {
        setVoidTarget(null);
        setSelected(null);
        fetchTransactions();
      }
    } catch (err: any) {
      setVoidError(err.message || "Gagal membatalakan transaksi.");
    } finally {
      setVoidLoading(false);
    }
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelected(null);
    fetchTransactions();
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.transaction_code.toLowerCase().includes(searchCode.toLowerCase()) ||
    tx.payment_method.toLowerCase().includes(searchCode.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / 20) || 1;

  return {
    router,
    loading,
    page,
    setPage,
    totalPages,
    searchCode,
    setSearchCode,
    selected,
    setSelected,
    detailLoading,
    voidTarget,
    setVoidTarget,
    voidLoading,
    voidError,
    isShiftActive,
    showRefundModal,
    setShowRefundModal,
    handleRefundSuccess,
    openDetail,
    handlePrint,
    confirmVoid,
    filteredTransactions,
  };
}
