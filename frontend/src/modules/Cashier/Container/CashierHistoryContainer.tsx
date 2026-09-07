"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cashierDAO } from "../DAO/cashier.dao";
import type { TransactionDTO as Transaction } from "../DTO/cashier.dto";
import { handleReceiptPrint } from "@/lib/printer";
import { useSettingsStore } from "@/modules/Settings/Store/useSettingsStore";
import { CashierHistoryView } from "../Component/CashierHistoryView";

const ITEMS_PER_PAGE = 20;

export default function CashierHistoryContainer() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchCode, setSearchCode] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);

  const debounceTimer = useRef<any>(null);

  // 1. TanStack Query: Active Shift Status
  const { data: isShiftActive = true } = useQuery({
    queryKey: ["activeShiftCheck"],
    queryFn: async () => {
      const res = await cashierDAO.getActiveShift();
      return !!(res.success && res.data);
    },
    staleTime: 30 * 1000,
  });

  // 2. TanStack Query: Transactions History
  const {
    data: historyData,
    isLoading: loading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["cashierHistoryTransactions", page, searchCode],
    queryFn: async () => {
      const res = await cashierDAO.getTransactions(
        ITEMS_PER_PAGE,
        page,
        searchCode || undefined
      );
      return {
        transactions: (res.success && res.data ? res.data : []) as Transaction[],
        totalPages: (res as any)?.totalPages || 1,
        totalCount: (res as any)?.totalCount || (res.data ? res.data.length : 0),
      };
    },
    staleTime: 30 * 1000,
  });

  const transactions = historyData?.transactions || [];
  const totalPages = historyData?.totalPages || 1;
  const totalCount = historyData?.totalCount || 0;

  const handleSearchChange = useCallback((value: string) => {
    setSearchCode(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
    }, 400);
  }, []);

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
              member_code:
                selected.member.phone ||
                selected.member.member_code ||
                `#${selected.member.id}`,
            }
          : null,
      };
      const res = await handleReceiptPrint({
        transaction: mappedTransaction,
        isCopy: true,
      });
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
        refetchTransactions();
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
    refetchTransactions();
  };

  return (
    <CashierHistoryView
      router={router}
      loading={loading}
      page={page}
      setPage={setPage}
      totalPages={totalPages}
      totalCount={totalCount}
      searchCode={searchCode}
      setSearchCode={handleSearchChange}
      selected={selected}
      setSelected={setSelected}
      detailLoading={false}
      voidTarget={voidTarget}
      setVoidTarget={setVoidTarget}
      voidLoading={voidLoading}
      voidError={voidError}
      isShiftActive={isShiftActive}
      showRefundModal={showRefundModal}
      setShowRefundModal={setShowRefundModal}
      handleRefundSuccess={handleRefundSuccess}
      openDetail={openDetail}
      handlePrint={handlePrint}
      confirmVoid={confirmVoid}
      filteredTransactions={transactions}
    />
  );
}
