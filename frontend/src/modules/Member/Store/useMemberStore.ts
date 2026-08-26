import { create } from "zustand";
import type { MemberDTO } from "../DTO/member.dto";

interface MemberState {
  searchQuery: string;
  copiedId: number | null;
  modalOpen: boolean;
  importModalOpen: boolean;
  selectedMember: MemberDTO | null;
  setSearchQuery: (q: string) => void;
  setCopiedId: (id: number | null) => void;
  setModalOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  setSelectedMember: (m: MemberDTO | null) => void;
}

export const useMemberStore = create<MemberState>((set) => ({
  searchQuery: "",
  copiedId: null,
  modalOpen: false,
  importModalOpen: false,
  selectedMember: null,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setCopiedId: (id) => set({ copiedId: id }),
  setModalOpen: (open) => set({ modalOpen: open }),
  setImportModalOpen: (open) => set({ importModalOpen: open }),
  setSelectedMember: (m) => set({ selectedMember: m }),
}));
