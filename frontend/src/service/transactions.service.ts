import { cashierDAO } from "@/modules/Cashier/DAO/cashier.dao";
import type { TransactionDTO } from "@/modules/Transactions/DTO/transactions.dto";

export async function fetchTransactionsList(limit: number = 100): Promise<TransactionDTO[]> {
  const res = await cashierDAO.getTransactions(limit);
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}
