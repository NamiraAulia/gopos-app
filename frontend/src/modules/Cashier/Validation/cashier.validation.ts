import { PaymentMethod, ExpenseCategory } from "@/enum";
import type { CheckoutPayload } from "../DTO/cashier.dto";

export function validateCheckoutPayload(payload: CheckoutPayload): { valid: boolean; error?: string } {
  if (!payload.items || payload.items.length === 0) {
    return { valid: false, error: "Keranjang belanja tidak boleh kosong." };
  }
  if (!payload.payment_method) {
    return { valid: false, error: "Pilih metode pembayaran terlebih dahulu." };
  }
  const total =
    payload.items.reduce((sum, item) => sum + item.unit_price * item.qty, 0) -
    (payload.discount_amount || 0);

  if (payload.payment_method === PaymentMethod.CASH && payload.amount_paid < total) {
    return { valid: false, error: "Jumlah uang tunai kurang dari total pembayaran." };
  }
  return { valid: true };
}

export function validateOpenShift(startCash: number): { valid: boolean; error?: string } {
  if (startCash <= 0) {
    return { valid: false, error: "Modal laci kasir harus lebih besar dari Rp 0." };
  }
  return { valid: true };
}

export function validateCloseShift(actualCash: number): { valid: boolean; error?: string } {
  if (actualCash < 0) {
    return { valid: false, error: "Uang fisik di laci tidak boleh bernilai negatif." };
  }
  return { valid: true };
}

export function validateExpense(payload: { name: string; amount: number; category: string }): {
  valid: boolean;
  error?: string;
} {
  if (!payload.name || payload.name.trim().length === 0) {
    return { valid: false, error: "Nama pengeluaran harus diisi." };
  }
  if (payload.amount <= 0) {
    return { valid: false, error: "Jumlah pengeluaran harus lebih besar dari Rp 0." };
  }
  if (!payload.category) {
    return { valid: false, error: "Kategori pengeluaran wajib dipilih." };
  }
  return { valid: true };
}

