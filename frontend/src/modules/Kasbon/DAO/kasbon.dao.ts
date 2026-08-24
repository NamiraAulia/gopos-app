export interface KasbonSummaryDAO {
  total_receivables: number;
  total_debtors: number;
  overdue_debtors: number;
}

export interface DebtLogDAO {
  id: number;
  member_id: number;
  type: "debt" | "repayment";
  amount: number;
  remaining_debt: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
}
