import { create } from "zustand";

interface SettingsState {
  logs: string[];
  addLog: (msg: string) => void;
  clearLogs: () => void;
  customerDisplayEnabled: boolean;
  setCustomerDisplayEnabled: (val: boolean) => void;
  printerType: "escpos" | "pcl";
  setPrinterType: (type: "escpos" | "pcl") => void;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  footerText: string;
  paperSize: "37mm" | "58mm" | "80mm";
  logoBase64: string;
  setShopName: (val: string) => void;
  setShopAddress: (val: string) => void;
  setShopPhone: (val: string) => void;
  setFooterText: (val: string) => void;
  setPaperSize: (size: "37mm" | "58mm" | "80mm") => void;
  setLogoBase64: (val: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  logs: [],
  addLog: (msg) => {
    console.log(msg);
    set((state) => ({
      logs: [...state.logs, `[${new Date().toLocaleTimeString("id-ID")}] ${msg}`],
    }));
  },
  clearLogs: () => set({ logs: [] }),
  customerDisplayEnabled: false,
  setCustomerDisplayEnabled: (val) => set({ customerDisplayEnabled: val }),
  printerType: "escpos",
  setPrinterType: (type) => set({ printerType: type }),
  shopName: "",
  shopAddress: "",
  shopPhone: "",
  footerText: "",
  paperSize: "80mm",
  logoBase64: "",
  setShopName: (val) => set({ shopName: val }),
  setShopAddress: (val) => set({ shopAddress: val }),
  setShopPhone: (val) => set({ shopPhone: val }),
  setFooterText: (val) => set({ footerText: val }),
  setPaperSize: (size) => set({ paperSize: size }),
  setLogoBase64: (val) => set({ logoBase64: val }),
}));
