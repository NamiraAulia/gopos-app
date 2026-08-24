export interface TransactionItemDAO {
  id?: number;
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface TransactionDAO {
  id: number;
  transaction_code: string;
  user_id: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  items?: TransactionItemDAO[];
}

export interface RestockSuggestionDAO {
  product_id: number;
  product_name: string;
  current_stock: number;
  avg_sales_per_day: number;
  days_remaining: number;
}

export interface DailyProfitDAO {
  date: string;
  revenue: number;
  gross_profit: number;
}

export interface GrossProfitReportDAO {
  daily_profits: DailyProfitDAO[];
}

export interface DashboardSummaryDAO {
  today_revenue: number;
  today_transaction_count: number;
  today_profit: number;
  month_revenue: number;
  today_expense: number;
  critical_stock_count: number;
  recent_transactions: TransactionDAO[];
}
