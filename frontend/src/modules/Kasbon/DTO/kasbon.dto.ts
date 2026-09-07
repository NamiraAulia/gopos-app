import { PaymentMethod, KasbonLogType } from "@/enum";
export interface KasbonSummaryDTO {
  total_receivables: number;
  total_debtors: number;
  overdue_debtors: number;
}

export interface RepayKasbonDTO {
  memberId: number;
  amount: number;
  paymentMethod: PaymentMethod | string;
  notes?: string;
}

export interface DebtLogDTO {
  id: number;
  member_id: number;
  type: KasbonLogType | "debt" | "repayment" | string;
  amount: number;
  remaining_debt: number;
  payment_method?: PaymentMethod | string;
  notes?: string;
  created_at: string;
}
