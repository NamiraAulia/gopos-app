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
