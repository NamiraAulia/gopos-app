import { create } from "zustand";
import type { ProductDTO } from "../DTO/products.dto";

interface ProductState {
  searchQuery: string;
  showProductModal: boolean;
  showDeleteModal: boolean;
  showCsvModal: boolean;
  selectedProduct: ProductDTO | null;
  selectedIds: number[];
  sortOrder: "asc" | "desc";
  filterStokKritis: boolean;
  filterDataIncomplete: boolean;
  page: number;
  setSearchQuery: (q: string) => void;
  setShowProductModal: (val: boolean) => void;
  setShowDeleteModal: (val: boolean) => void;
  setShowCsvModal: (val: boolean) => void;
  setSelectedProduct: (p: ProductDTO | null) => void;
  setSelectedIds: (ids: number[]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setFilterStokKritis: (val: boolean) => void;
  setFilterDataIncomplete: (val: boolean) => void;
  setPage: (p: number) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  searchQuery: "",
  showProductModal: false,
  showDeleteModal: false,
  showCsvModal: false,
  selectedProduct: null,
  selectedIds: [],
  sortOrder: "asc",
  filterStokKritis: false,
  filterDataIncomplete: false,
  page: 1,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowProductModal: (val) => set({ showProductModal: val }),
  setShowDeleteModal: (val) => set({ showDeleteModal: val }),
  setShowCsvModal: (val) => set({ showCsvModal: val }),
  setSelectedProduct: (p) => set({ selectedProduct: p }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setFilterStokKritis: (val) => set({ filterStokKritis: val }),
  setFilterDataIncomplete: (val) => set({ filterDataIncomplete: val }),
  setPage: (p) => set({ page: p }),
}));
