import { create } from "zustand";

interface CashSummaryState {
  isCloseModalOpen: boolean;
  setIsCloseModalOpen: (open: boolean) => void;
}

export const useCashSummaryStore = create<CashSummaryState>((set) => ({
  isCloseModalOpen: false,
  setIsCloseModalOpen: (open) => set({ isCloseModalOpen: open }),
}));
