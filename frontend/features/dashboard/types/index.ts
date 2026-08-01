export interface Transaction {
  id: number;
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  todayRevenue: number;
  monthRevenue: number;
  totalSales: number;
}

export interface DashboardSummary {
  today_revenue: number;
  month_revenue: number;
  total_sales: number;
  today_transaction_count: number;
  today_expense: number;
  today_profit: number;
  critical_stock_count: number;
  recent_transactions: Transaction[];
}

export interface DailyProfit {
  date: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
}

export interface GrossProfitReport {
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  products: Array<{
    product_id: number;
    product_name: string;
    qty_sold: number;
    revenue: number;
    cogs: number;
    profit: number;
  }>;
  daily_profits: DailyProfit[];
}

export interface RestockSuggestion {
  product_id: number;
  product_name: string;
  current_stock: number;
  avg_sales_per_day: number;
  days_remaining: number;
  supplier_name?: string;
  conversion: number;
  unit?: string;
  unit_big?: string;
  shelf_life_days?: number;
  expiry_date?: string;
  daily_demand: number;
  weekly_demand: number;
  recommend_qty: number;
  recommend_big_qty: number;
  max_safe_qty: number;
  max_safe_big_qty: number;
  risk_tier: "high" | "medium" | "low";
}