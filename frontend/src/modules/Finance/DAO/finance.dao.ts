import type { TransactionDTO as Transaction, ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";

export type DetailedExpenseDAO = Expense;

export interface FinancialSummaryDAO {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  todayExpense: number;
  monthExpense: number;
  transactions: Transaction[];
  expenses: Expense[];
}
