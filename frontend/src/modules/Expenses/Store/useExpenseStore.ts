import { create } from "zustand";
import type { ExpenseDAO } from "../DAO/expenses.dao";

interface ExpenseState {
  currentPage: number;
  isModalOpen: boolean;
  selectedExpense: ExpenseDAO | null;
  setPage: (p: number) => void;
  setIsModalOpen: (open: boolean) => void;
  setSelectedExpense: (exp: ExpenseDAO | null) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  currentPage: 1,
  isModalOpen: false,
  selectedExpense: null,
  setPage: (p) => set({ currentPage: p }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setSelectedExpense: (exp) => set({ selectedExpense: exp }),
}));
