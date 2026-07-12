import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { Transaction } from "../types";

export function useAdminTransactions() {
  const { user: currentUser, isHydrated } = useAuthStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Pagination on frontend
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/transactions", {
        params: { limit: 100 },
      });
      const payload = res.data?.data;
      setTransactions(payload?.data || []);
    } catch (err: any) {
      console.error("Gagal memuat data transaksi:", err);
      setError(err.response?.data?.message || "Gagal menghubungi server untuk memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openDetail = async (trx: Transaction) => {
    setDetailLoading(true);
    setSelectedTransaction(trx);
    try {
      const res = await api.get(`/transactions/${trx.id}/receipt`);
      const full = res.data?.data;
      if (full) {
        setSelectedTransaction(full);
      }
    } catch (err) {
      console.error("Gagal memuat detail nota transaksi:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelectedTransaction(null);
    alert("Retur barang berhasil diproses!");
    fetchTransactions();
  };

  const handleResetFilters = () => {
    search && setSearch("");
    statusFilter !== "all" && setStatusFilter("all");
    startDate && setStartDate("");
    endDate && setEndDate("");
    setCurrentPage(1);
  };

  // Filtering Logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.transaction_code.toLowerCase().includes(search.toLowerCase()) ||
      (t.user?.name && t.user.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      const trxDate = new Date(t.created_at);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (trxDate < start) matchesDate = false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (trxDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, startDate, endDate]);

  return {
    currentUser,
    isHydrated,
    transactions,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedTransaction,
    setSelectedTransaction,
    detailLoading,
    showRefundModal,
    setShowRefundModal,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    totalItems,
    paginatedTransactions,
    itemsPerPage,
    fetchTransactions,
    openDetail,
    handlePrint,
    handleRefundSuccess,
    handleResetFilters,
    goToPage,
  };
}
