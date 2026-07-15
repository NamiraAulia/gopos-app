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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = useCallback(async () => {
    if (!isHydrated || !currentUser || currentUser.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/transactions", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: search,
          status: statusFilter,
          start_date: startDate,
          end_date: endDate,
        },
      });
      const payload = res.data?.data;
      setTransactions(payload?.data || []);
      setTotalItems(payload?.total || 0);
      setTotalPages(payload?.total_pages || 1);
    } catch (err: any) {
      console.error("Gagal memuat data transaksi:", err);
      setError(err.response?.data?.message || "Gagal menghubungi server untuk memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  }, [isHydrated, currentUser, currentPage, itemsPerPage, search, statusFilter, startDate, endDate]);

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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions;

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, startDate, endDate]);

  // Fetch transactions when page or filters change
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, search, statusFilter, startDate, endDate, fetchTransactions]);

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
