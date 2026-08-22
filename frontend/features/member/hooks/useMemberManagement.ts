import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { memberApi } from "../api";
import { useAuthStore } from "@/store/authStore";
import type { Member } from "../types";

export function useMemberManagement() {
  const router = useRouter();
  const { user: currentUser, isHydrated } = useAuthStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await memberApi.getMembers();
      if (res.success) {
        setMembers(res.data || []);
      } else {
        setErrorMsg(res.message || "Gagal mengambil daftar member.");
      }
    } catch (err: any) {
      setErrorMsg("Gagal terhubung ke server atau API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!currentUser) {
        router.push("/login");
      } else {
        fetchMembers();
      }
    }
  }, [isHydrated, currentUser, router, fetchMembers]);

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditClick = (member: Member) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedMember(null);
    setModalOpen(true);
  };

  const handleDeleteClick = async (member: Member) => {
    const debt = member.total_debt || 0;
    if (debt > 0) {
      alert(`Akses Ditolak: Member "${member.name}" masih memiliki sisa utang kasbon sebesar Rp ${debt.toLocaleString("id-ID")}.\n\nMember yang masih memiliki utang kasbon tidak dapat dihapus atau dinonaktifkan.`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus data member "${member.name}" dari database? Tindakan ini permanen.`)) {
      try {
        const res = await memberApi.deleteMember(member.id);
        if (res.success) {
          fetchMembers();
        } else {
          alert(res.message || "Gagal menghapus member.");
        }
      } catch (err) {
        alert("Terjadi kesalahan saat menghapus member.");
      }
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    fetchMembers();
  };

  const filteredMembers = members.filter(
    (mbr) =>
      mbr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mbr.phone.includes(searchQuery) ||
      mbr.member_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return {
    currentUser,
    isHydrated,
    members,
    loading,
    errorMsg,
    searchQuery,
    setSearchQuery,
    copiedId,
    modalOpen,
    setModalOpen,
    selectedMember,
    setSelectedMember,
    fetchMembers,
    handleCopyCode,
    handleEditClick,
    handleCreateClick,
    handleDeleteClick,
    handleModalSuccess,
    filteredMembers,
    formatDate,
  };
}
