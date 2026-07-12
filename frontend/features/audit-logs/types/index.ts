import type { User } from "@/types/api";

export interface ActivityLog {
  id: number;
  user_id: number;
  user?: User;
  action: string;
  target_table: string;
  target_id: number;
  old_value: string;
  new_value: string;
  ip_address: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
