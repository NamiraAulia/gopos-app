import { create } from "zustand";

interface CashierUIState {
  showHoldModal: boolean;
  setShowHoldModal: (val: boolean) => void;
  showHeldCartsModal: boolean;
  setShowHeldCartsModal: (val: boolean) => void;
}

export const useCashierStore = create<CashierUIState>((set) => ({
  showHoldModal: false,
  setShowHoldModal: (val) => set({ showHoldModal: val }),
  showHeldCartsModal: false,
  setShowHeldCartsModal: (val) => set({ showHeldCartsModal: val }),
}));
