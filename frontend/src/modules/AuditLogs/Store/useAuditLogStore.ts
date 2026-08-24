import { create } from "zustand";

interface AuditLogState {
  startDate: string;
  endDate: string;
  page: number;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  setPage: (p: number | ((prev: number) => number)) => void;
  resetFilters: () => void;
}

export const useAuditLogStore = create<AuditLogState>((set) => ({
  startDate: "",
  endDate: "",
  page: 1,
  setStartDate: (d) => set({ startDate: d, page: 1 }),
  setEndDate: (d) => set({ endDate: d, page: 1 }),
  setPage: (p) =>
    set((state) => ({
      page: typeof p === "function" ? p(state.page) : p,
    })),
  resetFilters: () => set({ startDate: "", endDate: "", page: 1 }),
}));
