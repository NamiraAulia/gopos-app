import type { CreateSupplierDTO } from "../DTO/suppliers.dto";

export function validateSupplierInput(payload: CreateSupplierDTO): { valid: boolean; error?: string } {
  if (!payload.name || payload.name.trim() === "") {
    return { valid: false, error: "Nama distributor / PT wajib diisi." };
  }
  return { valid: true };
}
