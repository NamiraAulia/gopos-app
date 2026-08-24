import type { SalesContactDAO, SupplierDAO, TodayScheduleDataDAO } from "../DAO/suppliers.dao";

export type SalesContactDTO = SalesContactDAO;
export type SupplierDTO = SupplierDAO;
export type TodayScheduleDataDTO = TodayScheduleDataDAO;

export interface CreateSupplierDTO {
  name: string;
  address?: string;
  notes?: string;
  sales_contacts: Array<Omit<SalesContactDAO, "id" | "supplier_id">>;
}

export type CreateSupplierPayloadDTO = CreateSupplierDTO;
