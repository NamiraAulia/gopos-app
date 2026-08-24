import { create } from "zustand";
import type { MemberDTO } from "@/modules/Member/DTO/member.dto";

interface KasbonState {
  searchQuery: string;
  activeTab: "all" | "has_debt" | "overdue";
  selectedMemberForRepay: MemberDTO | null;
  selectedMemberForHistory: MemberDTO | null;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: "all" | "has_debt" | "overdue") => void;
  setSelectedMemberForRepay: (m: MemberDTO | null) => void;
  setSelectedMemberForHistory: (m: MemberDTO | null) => void;
}

export const useKasbonStore = create<KasbonState>((set) => ({
  searchQuery: "",
  activeTab: "has_debt",
  selectedMemberForRepay: null,
  selectedMemberForHistory: null,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedMemberForRepay: (m) => set({ selectedMemberForRepay: m }),
  setSelectedMemberForHistory: (m) => set({ selectedMemberForHistory: m }),
}));
