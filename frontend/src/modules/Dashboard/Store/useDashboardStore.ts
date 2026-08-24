import { create } from "zustand";

interface DashboardState {
  activeTab: "hourly" | "weekly";
  lastUpdated: string;
  setActiveTab: (tab: "hourly" | "weekly") => void;
  setLastUpdated: (time: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: "hourly",
  lastUpdated: "",
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLastUpdated: (time) => set({ lastUpdated: time }),
}));
