"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cashierDAO } from "../DAO/cashier.dao";
import type { TransactionDTO as Transaction } from "../DTO/cashier.dto";
import { handleReceiptPrint } from "@/lib/printer";
import { useSettingsStore } from "@/modules/Settings/Store/useSettingsStore";

const ITEMS_PER_PAGE = 20;

export function useCashierHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchCode, setSearchCode] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");
  const [isShiftActive, setIsShiftActive] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const debounceTimer = useRef<any>(null);

  const fetchTransactions = useCallback(async (currentPage: number, search: string) => {
    setLoading(true);
    try {
      const res = await cashierDAO.getTransactions(ITEMS_PER_PAGE, currentPage, search || undefined);
      if (res.success && res.data) {
        setTransactions(res.data);
        setTotalPages((res as any).totalPages || 1);
        setTotalCount((res as any).totalCount || res.data.length);
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
    fetchTransactions(page, searchCode);
  }, [page, fetchTransactions]);

  useEffect(() => {
    fetchShift();
  }, [fetchShift]);

  // Debounced search — reset to page 1 on search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchCode(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchTransactions(1, value);
    }, 400);
  }, [fetchTransactions]);

  const openDetail = (trx: Transaction) => {
    setSelected(trx);
  };

  const handlePrint = async () => {
    if (!selected) return;
    try {
      const mappedTransaction = {
        ...selected,
        items: selected.items?.map((item: any) => ({
          ...item,
          price: item.unit_price || item.price,
        })),
        member: selected.member
          ? {
              ...selected.member,
              member_code: selected.member.phone || selected.member.member_code || `#${selected.member.id}`,
            }
          : null,
      };
      const res = await handleReceiptPrint({ transaction: mappedTransaction });
      if (res && res.success === false) {
        throw new Error(res.message || "Gagal mencetak struk.");
      }
    } catch (err: any) {
      console.error("Gagal mencetak struk dari history:", err);
      const errMsg = err.message || String(err);
      try {
        useSettingsStore.getState().addLog("Gagal cetak riwayat: " + errMsg);
      } catch (logErr) {
        console.warn("Gagal menulis log ke store:", logErr);
      }
      alert("Gagal mencetak struk: " + errMsg);
    }
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
        fetchTransactions(page, searchCode);
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
    fetchTransactions(page, searchCode);
  };

  return {
    router,
    loading,
    page,
    setPage,
    totalPages,
    totalCount,
    searchCode,
    setSearchCode: handleSearchChange,
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
    filteredTransactions: transactions,
  };
}
