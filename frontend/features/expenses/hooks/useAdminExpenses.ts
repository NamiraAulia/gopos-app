import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { expensesApi } from "../api";
import type { Expense } from "../types";

export function useAdminExpenses() {
  const { user: currentUser, isHydrated } = useAuthStore();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Pagination on frontend
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await expensesApi.getExpenses(100);
      const payload = res.data;
      setExpenses((payload as any)?.data || []);
    } catch (err: any) {
      console.error("Gagal memuat data pengeluaran:", err);
      setError(err.response?.data?.message || "Gagal menghubungi server untuk memuat data pengeluaran.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && currentUser && currentUser.role === "admin") {
      fetchExpenses();
    }
  }, [isHydrated, currentUser, fetchExpenses]);

  // Statistics Calculations
  const getStats = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    let todayTotal = 0;
    let monthTotal = 0;

    expenses.forEach((e) => {
      const itemDate = new Date(e.created_at);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth();
      const itemDateNum = itemDate.getDate();

      if (itemYear === todayYear && itemMonth === todayMonth && itemDateNum === todayDate) {
        todayTotal += e.amount;
      }

      if (itemYear === todayYear && itemMonth === todayMonth) {
        monthTotal += e.amount;
      }
    });

    return { todayTotal, monthTotal };
  };

  const { todayTotal, monthTotal } = getStats();

  // Pagination Logic
  const totalItems = expenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  return {
    currentUser,
    isHydrated,
    expenses,
    loading,
    error,
    isModalOpen,
    setIsModalOpen,
    selectedExpense,
    setSelectedExpense,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    todayTotal,
    monthTotal,
    totalItems,
    totalPages,
    startIndex,
    paginatedExpenses,
    fetchExpenses,
    goToPage,
    handleOpenAddModal,
    handleOpenEditModal,
  };
}
