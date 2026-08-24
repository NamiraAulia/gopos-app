import { create } from "zustand";
import type { ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";

interface FinanceState {
  activeTab: "overview" | "expenses";
  setActiveTab: (tab: "overview" | "expenses") => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedExpense: Expense | null;
  setSelectedExpense: (exp: Expense | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isModalOpen: false,
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  selectedExpense: null,
  setSelectedExpense: (exp) => set({ selectedExpense: exp }),
  selectedCategory: "all",
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  currentPage: 1,
  setCurrentPage: (p) => set({ currentPage: p }),
}));
