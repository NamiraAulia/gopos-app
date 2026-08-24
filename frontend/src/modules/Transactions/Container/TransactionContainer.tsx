"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTransactionsList } from "@/service/transactions.service";
import { useTransactionStore } from "../Store/useTransactionStore";
import { TransactionView } from "../Component/TransactionView";

export default function TransactionContainer() {
  const { search, setSearch } = useTransactionStore();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactionsList"],
    queryFn: () => fetchTransactionsList(100),
  });

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.transaction_code.toLowerCase().includes(search.toLowerCase()) ||
      tx.payment_method.toLowerCase().includes(search.toLowerCase()) ||
      (tx.member?.name && tx.member.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <TransactionView
      filteredTransactions={filteredTransactions}
      isLoading={isLoading}
      search={search}
      setSearch={setSearch}
    />
  );
}
