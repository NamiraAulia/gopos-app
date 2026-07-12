import type { User } from "@/types/api";

export interface Expense {
  id: number;
  user_id: number;
  user?: User;
  name: string;
  amount: number;
  category: string;
  created_at: string;
}
