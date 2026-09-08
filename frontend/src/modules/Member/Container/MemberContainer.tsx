"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMembers, deleteMember } from "@/service/member.service";
import { useMemberStore } from "../Store/useMemberStore";
import { MemberView } from "../Component/MemberView";
import type { MemberDTO } from "../DTO/member.dto";

export default function MemberContainer() {
  const queryClient = useQueryClient();

  const {
    searchQuery,
    setSearchQuery,
    copiedId,
    setCopiedId,
    modalOpen,
    setModalOpen,
    importModalOpen,
    setImportModalOpen,
    selectedMember,
    setSelectedMember,
  } = useMemberStore();

  const { data: members = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
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
    setSelectedMember(null);
    setModalOpen(true);
  };

  const handleEditClick = (member: MemberDTO) => {
    setSelectedMember(member);
    setModalOpen(true);
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
      modalOpen={modalOpen}
      setModalOpen={setModalOpen}
      importModalOpen={importModalOpen}
      setImportModalOpen={setImportModalOpen}
      selectedMember={selectedMember}
      filteredMembers={filteredMembers}
      handleCopyCode={handleCopyCode}
      handleEditClick={handleEditClick}
      handleCreateClick={handleCreateClick}
      handleDeleteClick={handleDeleteClick}
      handleModalSuccess={handleModalSuccess}
      formatDate={formatDate}
    />
  );
}
