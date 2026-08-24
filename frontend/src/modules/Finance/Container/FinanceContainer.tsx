"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFinancialOverview, deleteExpenseService } from "@/service/finance.service";
import { useFinanceStore } from "../Store/useFinanceStore";
import { FinanceView } from "../Component/FinanceView";
import type { ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";

export default function FinanceContainer() {
  const queryClient = useQueryClient();

  const {
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    selectedExpense,
    setSelectedExpense,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
  } = useFinanceStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["financeOverview"],
    queryFn: fetchFinancialOverview,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpenseService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeOverview"] });
    },
    onError: (err: any) => {
      alert("Gagal menghapus pengeluaran: " + (err.message || "Error"));
    },
  });

  const transactions = data?.transactions || [];
  const expenses = data?.expenses || [];
  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;
  const netProfit = data?.netProfit || 0;
  const todayExpense = data?.todayExpense || 0;
  const monthExpense = data?.monthExpense || 0;

  const itemsPerPage = 10;
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory !== "all" && e.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.name?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: ["financeOverview"] });
    refetch();
  };

  const handleOpenAdd = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setSelectedExpense(exp);
    setIsModalOpen(true);
  };

  const handleDelete = (exp: Expense) => {
    if (confirm(`Apakah Anda yakin ingin menghapus catatan pengeluaran "${exp.name}"?`)) {
      deleteMutation.mutate(exp.id);
    }
  };

  return (
    <FinanceView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      transactions={transactions}
      expenses={expenses}
      filteredExpenses={filteredExpenses}
      paginatedExpenses={paginatedExpenses}
      isLoading={isLoading}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      netProfit={netProfit}
      todayExpense={todayExpense}
      monthExpense={monthExpense}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      selectedExpense={selectedExpense}
      setSelectedExpense={setSelectedExpense}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      totalItems={filteredExpenses.length}
      itemsPerPage={itemsPerPage}
      fetchData={fetchData}
      handleOpenAdd={handleOpenAdd}
      handleOpenEdit={handleOpenEdit}
      handleDelete={handleDelete}
    />
  );
}
