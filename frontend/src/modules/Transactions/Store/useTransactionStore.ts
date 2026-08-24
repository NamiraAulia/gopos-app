import { create } from "zustand";

interface TransactionState {
  search: string;
  setSearch: (q: string) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  search: "",
  setSearch: (q) => set({ search: q }),
}));
