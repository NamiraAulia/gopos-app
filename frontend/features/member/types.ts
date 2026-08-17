export interface Member {
  id: number;
  member_code: string;
  name: string;
  phone: string;
  total_debt?: number;
  last_debt_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateMemberPayload {
  name: string;
  phone: string;
}
