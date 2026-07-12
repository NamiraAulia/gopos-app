import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import type { Transaction } from "../api";

export function useCashierHistory() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchCode, setSearchCode] = useState("");

  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");

  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    alert("Retur barang berhasil diproses!");
    fetchTransactions(page);
    setSelected(null);
  };

  const fetchTransactions = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      const res = await api.get("/transactions", {
        params: { page: targetPage, limit: 15 },
      });
      const payload = res.data?.data;
      setTransactions(payload?.data || []);
      setTotalPages(payload?.total_pages || 1);
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTransactions(page);
  }, [page, fetchTransactions, router]);

  const openDetail = async (trx: Transaction) => {
    setDetailLoading(true);
    setSelected(trx);
    try {
      const res = await api.get(`/transactions/${trx.id}/receipt`);
      const full = res.data?.data;
      if (full) setSelected(full);
    } catch (err) {
      console.error("Gagal memuat detail transaksi:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    try {
      setVoidLoading(true);
      setVoidError("");
      await api.post(`/transactions/${voidTarget.id}/void`);
      setVoidTarget(null);
      setSelected(null);
      fetchTransactions(page);
    } catch (err: any) {
      setVoidError(
        err.response?.data?.message || "Gagal membatalkan transaksi.",
      );
    } finally {
      setVoidLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin mengakhiri sesi kasir?")) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const filteredTransactions = searchCode
    ? transactions.filter((t) =>
      t.transaction_code.toLowerCase().includes(searchCode.toLowerCase()),
    )
    : transactions;

  return {
    router,
    transactions,
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
    showOpenShiftModal,
    setShowOpenShiftModal,
    isShiftActive,
    showRefundModal,
    setShowRefundModal,
    handleRefundSuccess,
    fetchTransactions,
    openDetail,
    handlePrint,
    confirmVoid,
    handleLogout,
    filteredTransactions,
  };
}
