import { create } from "zustand";
import type { CustomerDisplayCartItemDAO, CustomerDisplayPayloadDAO } from "../DAO/customerDisplay.dao";

interface CustomerDisplayState {
  cart: CustomerDisplayCartItemDAO[];
  totalNormal: number;
  discountAmount: number;
  grandTotal: number;
  selectedMember: any;
  lastTransaction: any;
  isPaying: boolean;
  setCartData: (data: CustomerDisplayPayloadDAO) => void;
  clearLastTransaction: () => void;
}

export const useCustomerDisplayStore = create<CustomerDisplayState>((set) => ({
  cart: [],
  totalNormal: 0,
  discountAmount: 0,
  grandTotal: 0,
  selectedMember: null,
  lastTransaction: null,
  isPaying: false,
  setCartData: (data) =>
    set({
      cart: data.cart || [],
      totalNormal: data.totalNormal || 0,
      discountAmount: data.discountAmount || 0,
      grandTotal: data.grandTotal || 0,
      selectedMember: data.selectedMember || null,
      lastTransaction: data.lastTransaction || null,
      isPaying: !!data.isPaying,
    }),
  clearLastTransaction: () => set({ lastTransaction: null }),
}));

