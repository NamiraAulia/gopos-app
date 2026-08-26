import { create } from "zustand";
import type { CustomerDisplayCartItemDAO } from "../DAO/customerDisplay.dao";

interface CustomerDisplayState {
  cart: CustomerDisplayCartItemDAO[];
  totalNormal: number;
  discountAmount: number;
  grandTotal: number;
  selectedMember: any;
  lastTransaction: any;
  setCartData: (data: {
    cart: CustomerDisplayCartItemDAO[];
    totalNormal: number;
    discountAmount: number;
    grandTotal: number;
    selectedMember: any;
    lastTransaction: any;
  }) => void;
  clearLastTransaction: () => void;
}

export const useCustomerDisplayStore = create<CustomerDisplayState>((set) => ({
  cart: [],
  totalNormal: 0,
  discountAmount: 0,
  grandTotal: 0,
  selectedMember: null,
  lastTransaction: null,
  setCartData: (data) =>
    set({
      cart: data.cart,
      totalNormal: data.totalNormal,
      discountAmount: data.discountAmount,
      grandTotal: data.grandTotal,
      selectedMember: data.selectedMember,
      lastTransaction: data.lastTransaction,
    }),
  clearLastTransaction: () => set({ lastTransaction: null }),
}));
