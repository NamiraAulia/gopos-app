import api from "@/lib/axios";
import type { ApiResponse, Product } from "@/types/api";

export interface CheckoutItemPayload {
  product_id: number;
  qty: number;
  unit_price: number;
  unit_choice: "small" | "big";
}

export interface CheckoutPayload {
  items: CheckoutItemPayload[];
  payment_method: "cash" | "qris" | "transfer";
  amount_paid: number;
  member_id?: number;
  discount_amount?: number;
}

export interface TransactionResult {
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount?: number;
  date?: string;
  items?: Array<{
    id: number;
    product_name: string;
    qty: number;
    subtotal: number;
  }>;
}

export interface ShiftData {
  id: number;
  start_cash: number;
  total_cash_expected: number;
  total_refunded_cash: number;
  start_time: string;
  end_time: string | null;
  status: "open" | "closed";
  total_cash_actual?: number;
  cash_difference?: number;
}

export interface Transaction {
  id: number;
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  status: string;
  created_at: string;
  items?: any[];
  discount_amount?: number;
  member?: {
    id: number;
    name: string;
    phone?: string;
    member_code?: string;
  } | null;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  created_at: string;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export const cashierApi = {
  getMembers: () =>
    api.get<ApiResponse<any[]>>("/members").then((res) => res.data),

  getProducts: (search?: string) =>
    api
      .get<
        ApiResponse<{ data: Product[] }>
      >(search ? `/products?name=${encodeURIComponent(search)}` : "/products")
      .then((res) => res.data),

  checkout: (payload: CheckoutPayload) =>
    api
      .post<ApiResponse<TransactionResult>>("/checkout", payload)
      .then((res) => res.data),

  getActiveShift: () =>
    api.get<ApiResponse<ShiftData>>(`/shifts/active`).then((res) => res.data),

  openShift: (startCash: number) =>
    api
      .post<ApiResponse<ShiftData>>(`/shifts/open`, { start_cash: startCash })
      .then((res) => res.data),

  closeShift: (totalCashActual: number) =>
    api
      .post<ApiResponse<ShiftData>>(`/shifts/close`, {
        total_cash_actual: totalCashActual,
      })
      .then((res) => res.data),

  getTransactions: (limit: number = 100) =>
    api
      .get<ApiResponse<Transaction[]>>(`/transactions?limit=${limit}`)
      .then((res) => res.data),

  getExpenses: () =>
    api
      .get<ApiResponse<Expense[]>>("/expenses")
      .then((res) => res.data),

  voidTransaction: (id: number) =>
    api
      .post<ApiResponse<any>>(`/transactions/${id}/void`)
      .then((res) => res.data),

  refundTransaction: (id: number, payload: { reason: string; items: Array<{ product_id: number; qty_refunded: number }> }) =>
    api
      .post<ApiResponse<any>>(`/transactions/${id}/refund`, payload)
      .then((res) => res.data),

  createExpense: (payload: { name: string; amount: number; category: string }) =>
    api
      .post<ApiResponse<Expense>>("/expenses", payload)
      .then((res) => res.data),
};

