import type { CreateExpenseDTO } from "../DTO/expenses.dto";

export function validateExpenseInput(payload: CreateExpenseDTO): { valid: boolean; error?: string } {
  if (!payload.name || payload.name.trim() === "") {
    return { valid: false, error: "Catatan/nama pengeluaran wajib diisi." };
  }
  if (!payload.amount || payload.amount <= 0) {
    return { valid: false, error: "Nominal pengeluaran harus lebih dari 0." };
  }
  if (!payload.category || payload.category.trim() === "") {
    return { valid: false, error: "Kategori pengeluaran wajib dipilih." };
  }
  return { valid: true };
}
