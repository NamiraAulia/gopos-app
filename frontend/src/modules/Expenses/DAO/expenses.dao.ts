export interface ExpenseUserDAO {
  id: number;
  name: string;
  email: string;
}

export interface ExpenseDAO {
  id: number;
  user_id?: number;
  user?: ExpenseUserDAO;
  name: string;
  amount: number;
  category: string;
  created_at: string;
}
