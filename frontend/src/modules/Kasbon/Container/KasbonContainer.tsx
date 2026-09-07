"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { kasbonDAO } from "../DAO/kasbon.dao";
import {
  kasbonModalAtom,
  openKasbonModalAtom,
  closeKasbonModalAtom,
} from "../Store/kasbonModal.atom";
import { KasbonView } from "../Component/KasbonView";
import type { MemberDTO } from "@/modules/Member/DTO/member.dto";

export default function KasbonContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "has_debt" | "overdue">("has_debt");

  const modal = useAtomValue(kasbonModalAtom);
  const openModal = useSetAtom(openKasbonModalAtom);
  const closeModal = useSetAtom(closeKasbonModalAtom);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kasbonMembers"],
    queryFn: kasbonDAO.getKasbonMembers,
    staleTime: 30 * 1000,
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

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["kasbonMembers"] });
    queryClient.invalidateQueries({ queryKey: ["members"] });
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
      modal={modal}
      openModal={openModal}
      closeModal={closeModal}
      thirtyDaysAgo={thirtyDaysAgo}
      handleModalSuccess={handleModalSuccess}
      loadData={refetch}
    />
  );
}
