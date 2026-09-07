import { PaymentMethod, KasbonLogType, CsvValidationStatus } from "@/enum";
import type { CreateMemberPayloadDTO, RepayDebtPayloadDTO } from "../DTO/member.dto";

export function validateMemberInput(payload: CreateMemberPayloadDTO): {
  valid: boolean;
  error?: string;
} {
  if (!payload.name || payload.name.trim() === "") {
    return { valid: false, error: "Nama lengkap member wajib diisi." };
  }
  return { valid: true };
}

export function validateRepaymentInput(
  amount: number,
  currentDebt: number,
  paymentMethod?: PaymentMethod | string
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Nominal pembayaran harus lebih besar dari Rp 0." };
  }
  if (currentDebt <= 0) {
    return { valid: false, error: "Member ini tidak memiliki sisa utang kasbon." };
  }
  if (amount > currentDebt) {
    return {
      valid: false,
      error: `Nominal pembayaran (Rp ${amount.toLocaleString("id-ID")}) melebihi sisa utang (Rp ${currentDebt.toLocaleString("id-ID")}).`,
    };
  }
  if (
    paymentMethod &&
    !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)
  ) {
    return {
      valid: false,
      error: `Metode pembayaran "${paymentMethod}" tidak valid.`,
    };
  }
  return { valid: true };
}

export function validateRepayDebtPayload(
  payload: RepayDebtPayloadDTO,
  currentDebt: number
): { valid: boolean; error?: string } {
  return validateRepaymentInput(payload.amount, currentDebt, payload.payment_method);
}

export function validateDebtLogType(type: string): {
  valid: boolean;
  logType?: KasbonLogType;
  error?: string;
} {
  const normalized = type.toLowerCase();
  if (
    normalized === KasbonLogType.KASBON ||
    normalized === KasbonLogType.DEBT
  ) {
    return { valid: true, logType: KasbonLogType.KASBON };
  }
  if (
    normalized === KasbonLogType.REPAYMENT ||
    normalized === KasbonLogType.PELUNASAN
  ) {
    return { valid: true, logType: KasbonLogType.REPAYMENT };
  }
  return { valid: false, error: `Tipe mutasi kasbon "${type}" tidak dikenali.` };
}

export function validateMemberCsvImport(items: any[]): {
  valid: boolean;
  status: CsvValidationStatus;
  error?: string;
} {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      status: CsvValidationStatus.ERROR,
      error: "File CSV tidak memiliki data yang valid untuk diimpor.",
    };
  }
  const hasInvalidItem = items.some((item) => !item.name || item.name.trim() === "");
  if (hasInvalidItem) {
    return {
      valid: false,
      status: CsvValidationStatus.ERROR,
      error: "Terdapat baris data member tanpa nama lengkap.",
    };
  }
  return { valid: true, status: CsvValidationStatus.VALID };
}
