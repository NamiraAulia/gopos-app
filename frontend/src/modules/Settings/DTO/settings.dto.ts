import type { ShopSettingsDAO, PrinterStatusDAO } from "../DAO/settings.dao";

export type ShopSettingsDTO = ShopSettingsDAO;
export type PrinterStatusDTO = PrinterStatusDAO;

export interface PrinterConfigDTO {
  printerType: "escpos" | "pcl";
  paperSize: "37mm" | "58mm" | "80mm";
  preferredVidPid: string;
  customerDisplayEnabled: boolean;
}
