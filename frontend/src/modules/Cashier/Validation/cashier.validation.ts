import type { CheckoutPayload } from "../DTO/cashier.dto";

export function validateCheckoutPayload(payload: CheckoutPayload): { valid: boolean; error?: string } {
  if (!payload.items || payload.items.length === 0) {
    return { valid: false, error: "Keranjang belanja tidak boleh kosong." };
  }
  if (!payload.payment_method) {
    return { valid: false, error: "Pilih metode pembayaran terlebih dahulu." };
  }
  const total = payload.items.reduce((sum, item) => sum + item.unit_price * item.qty, 0) - (payload.discount_amount || 0);
  if (payload.payment_method === "cash" && payload.amount_paid < total) {
    return { valid: false, error: "Jumlah uang tunai kurang dari total pembayaran." };
  }
  return { valid: true };
}
