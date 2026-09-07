"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { fetchMembers, deleteMember } from "@/service/member.service";
import {
  memberModalAtom,
  openMemberModalAtom,
  closeMemberModalAtom,
} from "../Store/memberModal.atom";
import { MemberView } from "../Component/MemberView";
import type { MemberDTO } from "../DTO/member.dto";

export default function MemberContainer() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const modal = useAtomValue(memberModalAtom);
  const openModal = useSetAtom(openMemberModalAtom);
  const closeModal = useSetAtom(closeMemberModalAtom);

  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: any) => {
      alert(err.message || "Gagal menghapus member.");
    },
  });

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.member_code?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q)
    );
  });

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateClick = () => {
    openModal({ type: "MEMBER_FORM", data: null });
  };

  const handleEditClick = (member: MemberDTO) => {
    openModal({ type: "MEMBER_FORM", data: member });
  };

  const handleImportClick = () => {
    openModal({ type: "IMPORT_CSV" });
  };

  const handleHistoryClick = (member: MemberDTO) => {
    openModal({ type: "HISTORY", data: member });
  };

  const handleRepaymentClick = (member: MemberDTO) => {
    openModal({ type: "REPAYMENT", data: member });
  };

  const handleDeleteClick = (member: MemberDTO) => {
    if (confirm(`Apakah Anda yakin ingin menonaktifkan member "${member.name}"?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["members"] });
    refetch();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <MemberView
      loading={isLoading}
      errorMsg={isError ? (error as any)?.message || "Gagal memuat data member" : ""}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      copiedId={copiedId}
      modal={modal}
      openModal={openModal}
      closeModal={closeModal}
      filteredMembers={filteredMembers}
      handleCopyCode={handleCopyCode}
      handleEditClick={handleEditClick}
      handleCreateClick={handleCreateClick}
      handleImportClick={handleImportClick}
      handleHistoryClick={handleHistoryClick}
      handleRepaymentClick={handleRepaymentClick}
      handleDeleteClick={handleDeleteClick}
      handleModalSuccess={handleModalSuccess}
      formatDate={formatDate}
    />
  );
}
