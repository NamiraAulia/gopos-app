export interface CheckoutItemPayload {
  product_id: number;
  qty: number;
  unit_price: number;
  unit_choice: "small" | "big";
}

export type CartItemDTO = CheckoutItemPayload;

export interface PaymentSplitItem {
  method: "cash" | "qris" | "transfer" | "kasbon";
  amount: number;
  bank_info?: string;
  ref_number?: string;
}

export interface CheckoutPayload {
  items: CheckoutItemPayload[];
  payment_method: "cash" | "qris" | "transfer" | "kasbon" | "split";
  amount_paid: number;
  member_id?: number;
  discount_amount?: number;
  idempotency_key?: string;
  payment_splits?: PaymentSplitItem[];
}

export interface TransactionResultDTO {
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount?: number;
  date?: string;
  payment_splits?: PaymentSplitItem[];
  items?: Array<{
    id: number;
    product_name: string;
    qty: number;
    subtotal: number;
  }>;
}

export interface ShiftDataDTO {
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

export interface TransactionDTO {
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
  payment_splits?: PaymentSplitItem[];
  member?: {
    id: number;
    name: string;
    phone?: string;
    member_code?: string;
  } | null;
}

export interface ExpenseDTO {
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

export interface PaginatedProductsResponse {
  products: import("@/interface/api").Product[];
  data: import("@/interface/api").Product[];
  totalCount: number;
  hasMore: boolean;
}

export interface PaginatedTransactionsResponse {
  data: TransactionDTO[];
  totalCount: number;
  totalPages: number;
}
