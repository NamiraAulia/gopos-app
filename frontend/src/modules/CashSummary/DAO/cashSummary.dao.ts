import type { TransactionDTO as Transaction, ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";

export interface CashSummaryDAO {
  transactions: Transaction[];
  expenses: Expense[];
  activeShift: any;
  completedTrx: Transaction[];
  cashTotal: number;
  qrisTotal: number;
  transferTotal: number;
  totalIncome: number;
  totalExpense: number;
  voidedTrx: Transaction[];
  totalVoided: number;
  startCash: number;
  totalUangMasuk: number;
  totalUangKeluar: number;
  totalKas: number;
  actualCashNum: number;
  selisih: number | null;
  netProfit: number;
}
