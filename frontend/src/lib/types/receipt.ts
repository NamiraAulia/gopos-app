export interface ReceiptItemData {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  transactionCode?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  items: ReceiptItemData[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashierName: string;
  transactionDate: string;
  footerText?: string;
  amountPaid?: number;
  changeAmount?: number;
  member?: { name: string; memberCode: string } | null;
  logoBytes?: Uint8Array;
}
