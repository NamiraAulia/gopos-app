export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: ApiMeta | null;
}

export interface ApiErrorResponse {
  success: false;
  message: string;       
  error: {
    code: ErrorCode;     
    detail: string;      
  };
  data: null;
  meta: null;
}



export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'SHIFT_NOT_OPEN'
  | 'SHIFT_ALREADY_OPEN'
  | 'PROMO_INVALID'
  | 'REFUND_QTY_EXCEEDED'
  | 'REFUND_NOT_OWN_TRANSACTION'
  | 'DUPLICATE_BARCODE'
  | 'ACCOUNT_INACTIVE'
  | 'INTERNAL_ERROR';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'kasir';
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  best_price: number;       
  price: number;            
  price_big: number;        
  stock: number; 
  min_stock: number;           
  unit: string;            
  unit_big: string;        
  conversion: number;       
  supplier_name: string;
  is_active: boolean;
  discount_amount: number;
  is_promo: boolean;
  price_member: number;
}

export type UnitChoice = 'small' | 'big';

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  unit_choice: UnitChoice;
  conversion_used: number;  
  qty: number;
  discount_amount: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'qris';
export type TransactionStatus = 'completed' | 'voided' | 'partially_refunded';

export interface Transaction {
  id: number;
  transaction_code: string;
  user_id: number;
  cashier_name: string;
  subtotal: number;
  discount_total: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  status: TransactionStatus;
  items: TransactionItem[];
  created_at: string; 
}

export type ShiftStatus = 'open' | 'closed';

export interface Shift {
  id: number;
  user_id: number;
  cashier_name: string;
  start_time: string;
  end_time: string | null;
  start_cash: number;
  total_cash_expected: number;   
  total_refunded_cash: number;   
  total_cash_actual: number | null;
  cash_difference: number | null;
  difference_status: 'lebih' | 'kurang' | 'pas' | null;
  duration_hours: number | null;
  total_transactions: number;
  status: ShiftStatus;
}

export interface RefundItem {
  product_id: number;
  product_name: string;
  qty_refunded: number;
  refund_amount: number; 
}

export interface Refund {
  id: number;
  transaction_id: number;
  user_id: number;
  reason: string;
  total_refunded: number;
  items: RefundItem[];
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  target_table: string;
  target_id: number;
  old_value: string | null;
  new_value: string | null;
  ip_address: string;
  created_at: string;
}

export interface CheckoutItemPayload {
  product_id: number;
  qty: number;
  unit_choice: UnitChoice;
}

export interface CheckoutPayload {
  items: CheckoutItemPayload[];
  payment_method: PaymentMethod;
  amount_paid: number;
}

export interface RefundItemPayload {
  transaction_item_id: number;
  qty: number;
}

export interface RefundPayload {
  items: RefundItemPayload[];
  reason: string;
}

export interface OpenShiftPayload {
  start_cash: number;
}

export interface CloseShiftPayload {
  total_cash_actual: number;
  notes?: string;
}