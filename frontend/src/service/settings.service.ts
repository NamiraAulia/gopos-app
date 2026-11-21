import { ShopSettingsDAO } from "@/modules/Settings/DAO/settings.dao";

export const DEFAULT_SHOP_NAME = "KURNIA TELUR";
export const DEFAULT_SHOP_ADDRESS =
  "Jl. Perumnas Raya No.7 4, RT.4/RW.2, Malaka Sari, Kec. Duren Sawit, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta";
export const DEFAULT_SHOP_PHONE = "08128303200";
export const DEFAULT_SHOP_FOOTER = "Terima Kasih";
export const DEFAULT_SHOP_LOGO = "/logos.png";

export function loadShopSettingsFromStorage(): ShopSettingsDAO {
  if (typeof window === "undefined") {
    return {
      shopName: DEFAULT_SHOP_NAME,
      shopAddress: DEFAULT_SHOP_ADDRESS,
      shopPhone: DEFAULT_SHOP_PHONE,
      footerText: DEFAULT_SHOP_FOOTER,
      paperSize: "58mm",
      logoBase64: DEFAULT_SHOP_LOGO,
    };
  }

  return {
    shopName: localStorage.getItem("gopos_shop_name") || DEFAULT_SHOP_NAME,
    shopAddress:
      localStorage.getItem("gopos_shop_address") || DEFAULT_SHOP_ADDRESS,
    shopPhone: localStorage.getItem("gopos_shop_phone") || DEFAULT_SHOP_PHONE,
    footerText:
      localStorage.getItem("gopos_shop_footer") || DEFAULT_SHOP_FOOTER,
    paperSize:
      (localStorage.getItem("gopos_paper_size") as
        | "37mm"
        | "58mm"
        | "80mm") || "58mm",
    logoBase64: localStorage.getItem("gopos_shop_logo") || DEFAULT_SHOP_LOGO,
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
