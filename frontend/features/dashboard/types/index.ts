export interface Transaction {
  id: number;
  transaction_code: string;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
}

export interface DashboardStats {
  todayRevenue: number;
  monthRevenue: number;
  totalSales: number;
}