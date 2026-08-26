import { create } from "zustand";
import type { SupplierDAO } from "../DAO/suppliers.dao";

interface SupplierState {
  searchQuery: string;
  activeDayTab: string;
  isModalOpen: boolean;
  selectedSupplierForEdit: SupplierDAO | null;
  setSearchQuery: (q: string) => void;
  setActiveDayTab: (tab: string) => void;
  setIsModalOpen: (open: boolean) => void;
  setSelectedSupplierForEdit: (sup: SupplierDAO | null) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  searchQuery: "",
  activeDayTab: "all",
  isModalOpen: false,
  selectedSupplierForEdit: null,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveDayTab: (tab) => set({ activeDayTab: tab }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setSelectedSupplierForEdit: (sup) => set({ selectedSupplierForEdit: sup }),
}));
