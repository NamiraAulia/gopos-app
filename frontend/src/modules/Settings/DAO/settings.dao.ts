export interface PrinterDeviceDAO {
  vendorId: number;
  productId: number;
  productName?: string;
  deviceName?: string;
}

export interface PrinterStatusDAO {
  connected: boolean;
  hasPermission: boolean;
  printerType?: string;
  message?: string;
  vendorId?: number;
  productId?: number;
}

export interface ShopSettingsDAO {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  footerText: string;
  paperSize: "37mm" | "58mm" | "80mm";
  logoBase64: string;
}

export interface PrintStatusDAO {
  success: boolean;
  message: string;
  timestamp: string;
}
