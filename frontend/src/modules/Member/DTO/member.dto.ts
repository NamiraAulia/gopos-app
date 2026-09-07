import { PaymentMethod, KasbonLogType } from "@/enum";

export interface MemberDTO {
  id: number;
  member_code: string;
  name: string;
  phone?: string;
  is_active: boolean;
  total_debt?: number;
  last_debt_at?: string;
  created_at?: string;
}

export interface CreateMemberPayloadDTO {
  name: string;
  phone?: string;
}

export interface DebtLogDTO {
  id: number;
  member_id: number;
  type: KasbonLogType | "kasbon" | "repayment" | string;
  amount: number;
  remaining_debt: number;
  payment_method?: PaymentMethod | string;
  notes?: string;
  created_at: string;
}

export interface RepayDebtPayloadDTO {
  amount: number;
  payment_method?: PaymentMethod | string;
  notes?: string;
}

export interface MemberCsvItemDTO {
  name: string;
  phone?: string;
}
