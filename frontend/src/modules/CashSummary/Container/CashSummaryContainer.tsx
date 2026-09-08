"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCashSummary } from "@/modules/Cashier/Container/useCashSummary";
import { useAuthStore } from "@/store/authStore";
import { useCashSummaryStore } from "../Store/useCashSummaryStore";
import { CashSummaryView } from "../Component/CashSummaryView";

export default function CashSummaryContainer() {
  const router = useRouter();
  const { user: currentUser, isHydrated } = useAuthStore();
  const { isCloseModalOpen, setIsCloseModalOpen } = useCashSummaryStore();

  const {
    transactions,
    expenses,
    activeShift,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    completedTrx,
    cashTotal,
    qrisTotal,
    transferTotal,
    totalIncome,
    totalExpense,
    voidedTrx,
    totalVoided,
    startCash,
    totalUangMasuk,
    totalUangKeluar,
    totalKas,
    selisih,
    netProfit,
    fetchData,
  } = useCashSummary();

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
      expenses={expenses}
      voidedTrx={voidedTrx}
      totalVoided={totalVoided}
      startCash={startCash}
      totalUangMasuk={totalUangMasuk}
      totalUangKeluar={totalUangKeluar}
      totalKas={totalKas}
      selisih={selisih}
      netProfit={netProfit}
      fetchData={fetchData}
    />
  );
}
