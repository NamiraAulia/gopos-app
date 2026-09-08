"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchKasbonMembers } from "@/service/kasbon.service";
import { useKasbonStore } from "../Store/useKasbonStore";
import { KasbonView } from "../Component/KasbonView";

export default function KasbonContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedMemberForRepay,
    setSelectedMemberForRepay,
    selectedMemberForHistory,
    setSelectedMemberForHistory,
  } = useKasbonStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kasbonMembers"],
    queryFn: fetchKasbonMembers,
  });

  const members = data?.members || [];
  const summary = data?.summary || { total_receivables: 0, total_debtors: 0, overdue_debtors: 0 };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filteredMembers = members.filter((m) => {
    const debt = m.total_debt || 0;
    const isOverdue = debt > 0 && m.last_debt_at && new Date(m.last_debt_at) < thirtyDaysAgo;

    if (activeTab === "has_debt" && debt <= 0) return false;
    if (activeTab === "overdue" && !isOverdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = m.name?.toLowerCase().includes(q);
      const codeMatch = m.member_code?.toLowerCase().includes(q);
      const phoneMatch = m.phone?.toLowerCase().includes(q);
      return nameMatch || codeMatch || phoneMatch;
    }
    return true;
  });

  const loadData = () => {
    queryClient.invalidateQueries({ queryKey: ["kasbonMembers"] });
    refetch();
  };

  return (
    <KasbonView
      router={router}
      members={members}
      filteredMembers={filteredMembers}
      summary={summary}
      loading={isLoading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedMemberForRepay={selectedMemberForRepay}
      setSelectedMemberForRepay={setSelectedMemberForRepay}
      selectedMemberForHistory={selectedMemberForHistory}
      setSelectedMemberForHistory={setSelectedMemberForHistory}
      thirtyDaysAgo={thirtyDaysAgo}
      loadData={loadData}
    />
  );
}
