import { ShopSettingsDAO } from "@/modules/Settings/DAO/settings.dao";

export function loadShopSettingsFromStorage(): ShopSettingsDAO {
  if (typeof window === "undefined") {
    return {
      shopName: "",
      shopAddress: "",
      shopPhone: "",
      footerText: "",
      paperSize: "58mm",
      logoBase64: "",
    };
  }

  return {
    shopName: localStorage.getItem("gopos_shop_name") || "",
    shopAddress: localStorage.getItem("gopos_shop_address") || "",
    shopPhone: localStorage.getItem("gopos_shop_phone") || "",
    footerText: localStorage.getItem("gopos_shop_footer") || "",
    paperSize: (localStorage.getItem("gopos_paper_size") as "37mm" | "58mm" | "80mm") || "58mm",
    logoBase64: localStorage.getItem("gopos_shop_logo") || "",
  };
}

export function saveShopSettingsToStorage(settings: ShopSettingsDAO): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("gopos_shop_name", settings.shopName);
  localStorage.setItem("gopos_shop_address", settings.shopAddress);
  localStorage.setItem("gopos_shop_phone", settings.shopPhone);
  localStorage.setItem("gopos_shop_footer", settings.footerText);
  localStorage.setItem("gopos_paper_size", settings.paperSize);
  localStorage.setItem("gopos_shop_logo", settings.logoBase64);
}
