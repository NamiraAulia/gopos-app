import { PaymentMethod } from "@/enum";
import type { RepayKasbonDTO } from "../DTO/kasbon.dto";

export function validateRepayInput(
  payload: RepayKasbonDTO,
  maxDebt: number
): { valid: boolean; error?: string } {
  if (!payload.amount || payload.amount <= 0) {
    return { valid: false, error: "Nominal pembayaran harus lebih dari Rp 0." };
  }
  if (payload.amount > maxDebt) {
    return {
      valid: false,
      error: `Nominal pembayaran tidak boleh melebihi sisa utang (Rp ${maxDebt.toLocaleString("id-ID")}).`,
    };
  }
  if (
    !payload.paymentMethod ||
    !Object.values(PaymentMethod).includes(payload.paymentMethod as PaymentMethod)
  ) {
    return { valid: false, error: "Metode pembayaran wajib dipilih dan harus valid." };
  }
  return { valid: true };
}
