export interface Transaction {
  id: number;
  transaction_code: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  created_at: string;
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}