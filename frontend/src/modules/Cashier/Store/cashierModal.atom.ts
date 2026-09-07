import { atom } from "jotai";

export type CashierModalType = 
  | "NONE"
  | "PAYMENT"  
  | "RECEIPT"         
  | "HOLD_CART"        
  | "HELD_CARTS_LIST"   
  | "OPEN_SHIFT"       
  | "CLOSE_SHIFT"      
  | "EXPENSE"          
  | "REFUND"           
  | "STALE_SHIFT"      
  | "CLEAR_CART_CONFIRM" 
  | "QUICK_ADD_PRODUCT" 
  | null ;

export interface CashierModalState {
  type: CashierModalType;
  data?: any;
}

export const cashierModalAtom = atom<CashierModalState>({
  type: null,
  data: null,
});

export const openCashierModalAtom = atom(
  null,
  (_get, set, payload: { type: NonNullable<CashierModalType>; data?: any }) => {
    set(cashierModalAtom, { type: payload.type, data: payload.data || null });
  }
);

export const closeCashierModalAtom = atom(null, (_get, set) => {
  set(cashierModalAtom, { type: null, data: null });
});
