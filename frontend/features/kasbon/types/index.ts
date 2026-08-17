import type { Member } from "@/features/member/types";

export interface DebtLog {
  id: number;
  member_id: number;
  member?: Member;
  transaction_id?: number;
  transaction?: any;
  type: "kasbon" | "repayment";
  amount: number;
  down_payment?: number;
  remaining_debt: number;
  payment_method: "cash" | "qris" | "transfer" | "kasbon";
  notes?: string;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  due_date?: string;
}

export interface KasbonSummary {
  total_receivables: number;
  total_debtors: number;
  overdue_debtors: number;
}

export interface RepayPayload {
  amount_paid: number;
  payment_method: "cash" | "qris" | "transfer";
  notes?: string;
}

export interface MemberKasbonDetail {
  member: Member;
  is_overdue: boolean;
  logs: DebtLog[];
}
