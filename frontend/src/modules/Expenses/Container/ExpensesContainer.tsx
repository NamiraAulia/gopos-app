"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExpenses } from "@/service/expenses.service";
import { useExpenseStore } from "../Store/useExpenseStore";
import { ExpensesView } from "../Component/ExpensesView";
import { useAuthStore } from "@/store/authStore";
import type { ExpenseDAO } from "../DAO/expenses.dao";

export default function ExpensesContainer() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const {
    currentPage,
    isModalOpen,
    selectedExpense,
    setPage,
    setIsModalOpen,
    setSelectedExpense,
  } = useExpenseStore();

  const itemsPerPage = 10;

  const { data: expenses = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);

  const todayTotal = expenses
    .filter((e) => (e.created_at || "").startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthTotal = expenses
    .filter((e) => (e.created_at || "").startsWith(monthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalItems = expenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(totalPages, p)));
  };

  const handleOpenAddModal = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: ExpenseDAO) => {
    setSelectedExpense(exp);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    refetch();
  };

  return (
    <ExpensesView
      currentUser={currentUser}
      expenses={expenses}
      paginatedExpenses={paginatedExpenses}
      loading={isLoading}
      error={isError ? (error as any)?.message || "Gagal memuat pengeluaran" : ""}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      selectedExpense={selectedExpense}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      todayTotal={todayTotal}
      monthTotal={monthTotal}
      totalItems={totalItems}
      totalPages={totalPages}
      startIndex={startIndex}
      goToPage={goToPage}
      handleOpenAddModal={handleOpenAddModal}
      handleOpenEditModal={handleOpenEditModal}
      fetchExpenses={handleModalSuccess}
    />
  );
}
