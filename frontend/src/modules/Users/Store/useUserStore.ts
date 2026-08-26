import { create } from "zustand";
import type { CreateUserDTO } from "../DTO/users.dto";

interface UserState {
  isAddModalOpen: boolean;
  actionLoadingId: number | null;
  name: string;
  email: string;
  password: string;
  role: "admin" | "kasir";
  setIsAddModalOpen: (open: boolean) => void;
  setActionLoadingId: (id: number | null) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setRole: (role: "admin" | "kasir") => void;
  resetForm: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isAddModalOpen: false,
  actionLoadingId: null,
  name: "",
  email: "",
  password: "",
  role: "kasir",
  setIsAddModalOpen: (open) => set({ isAddModalOpen: open }),
  setActionLoadingId: (id) => set({ actionLoadingId: id }),
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setRole: (role) => set({ role }),
  resetForm: () => set({ name: "", email: "", password: "", role: "kasir" }),
}));
