"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchCashSummaryData } from "@/service/cashSummary.service";
import { cashierDAO } from "@/modules/Cashier/DAO/cashier.dao";
import { useAuthStore } from "@/store/authStore";
import { TransactionStatus, PaymentMethod } from "@/enum";
import type { ShiftDataDTO as ShiftData, TransactionDTO as Transaction, ExpenseDTO as Expense } from "@/modules/Cashier/DTO/cashier.dto";
import { CashSummaryView } from "../Component/CashSummaryView";

export default function CashSummaryContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, isHydrated } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cashSummaryData"],
    queryFn: async () => {
      const res = await fetchCashSummaryData();
      return {
        activeShift: (res.activeShift as any) as ShiftData | null,
        transactions: (res.transactions as any) as Transaction[],
        expenses: (res.expenses as any) as Expense[],
      };
    },
    staleTime: 15 * 1000,
  });

  const activeShift = data?.activeShift || null;
  const transactions = data?.transactions || [];
  const expenses = data?.expenses || [];

  const currentShiftStartTime = activeShift?.start_time
    ? new Date(activeShift.start_time).getTime()
    : 0;

  const filteredTransactions =
    currentShiftStartTime > 0
      ? transactions.filter(
          (t) => new Date(t.created_at).getTime() >= currentShiftStartTime
        )
      : transactions;

  const filteredExpenses =
    currentShiftStartTime > 0
      ? expenses.filter(
          (e) => new Date(e.created_at).getTime() >= currentShiftStartTime
        )
      : expenses;

  const completedTrx = filteredTransactions.filter(
    (t) => t.status === TransactionStatus.COMPLETED
  );
  const voidedTrx = filteredTransactions.filter(
    (t) => t.status === TransactionStatus.VOIDED
  );

  const cashTotal = completedTrx
    .filter((t) => t.payment_method === PaymentMethod.CASH)
    .reduce((sum, t) => sum + t.total_amount, 0);
  const qrisTotal = completedTrx
    .filter((t) => t.payment_method === PaymentMethod.QRIS)
    .reduce((sum, t) => sum + t.total_amount, 0);
  const transferTotal = completedTrx
    .filter((t) => t.payment_method === PaymentMethod.TRANSFER)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const totalIncome = completedTrx.reduce((sum, t) => sum + t.total_amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVoided = voidedTrx.reduce((sum, t) => sum + t.total_amount, 0);

  const startCash = activeShift?.start_cash || 0;
  const totalUangMasuk = totalIncome;
  const totalUangKeluar = totalExpense;
  const totalKas =
    activeShift?.total_cash_expected ?? startCash + cashTotal - totalExpense;

  const actualCashNum = activeShift?.total_cash_actual || totalKas;
  const selisih = actualCashNum - totalKas;
  const netProfit = totalIncome - totalExpense;

  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.push("/login");
    }
  }, [isHydrated, currentUser, router]);

  if (!isHydrated || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <CashSummaryView
      router={router}
      activeShift={activeShift}
      isLoading={isLoading}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      isCloseModalOpen={isCloseModalOpen}
      setIsCloseModalOpen={setIsCloseModalOpen}
      completedTrx={completedTrx}
      cashTotal={cashTotal}
      qrisTotal={qrisTotal}
      transferTotal={transferTotal}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      expenses={filteredExpenses}
      voidedTrx={voidedTrx}
      totalVoided={totalVoided}
      startCash={startCash}
      totalUangMasuk={totalUangMasuk}
      totalUangKeluar={totalUangKeluar}
      totalKas={totalKas}
      selisih={selisih}
      netProfit={netProfit}
      fetchData={refetch}
    />
  );
}
