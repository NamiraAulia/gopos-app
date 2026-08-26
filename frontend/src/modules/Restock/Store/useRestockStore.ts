import { create } from "zustand";

interface RestockState {
  selectedSupplier: string;
  setSelectedSupplier: (supplier: string) => void;
}

export const useRestockStore = create<RestockState>((set) => ({
  selectedSupplier: "all",
  setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),
}));
