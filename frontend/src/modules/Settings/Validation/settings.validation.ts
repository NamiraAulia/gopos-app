import type { ShopSettingsDTO } from "../DTO/settings.dto";

export function validateShopSettings(settings: ShopSettingsDTO): { valid: boolean; error?: string } {
  if (!settings.shopName || settings.shopName.trim() === "") {
    return { valid: false, error: "Nama toko tidak boleh kosong." };
  }
  return { valid: true };
}
