import type { RepayKasbonDTO } from "../DTO/kasbon.dto";

export function validateRepayInput(payload: RepayKasbonDTO, maxDebt: number): { valid: boolean; error?: string } {
  if (!payload.amount || payload.amount <= 0) {
    return { valid: false, error: "Nominal pembayaran harus lebih dari 0." };
  }
  if (payload.amount > maxDebt) {
    return { valid: false, error: `Nominal pembayaran tidak boleh melebihi sisa utang (Rp ${maxDebt.toLocaleString("id-ID")}).` };
  }
  if (!payload.paymentMethod || payload.paymentMethod.trim() === "") {
    return { valid: false, error: "Metode pembayaran wajib dipilih." };
  }
  return { valid: true };
}
