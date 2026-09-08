export enum TransactionStatus {
  COMPLETED = "completed",
  VOIDED = "voided",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  QRIS = "qris",
  TRANSFER = "transfer",
  KASBON = "kasbon",
}

export enum UserRole {
  ADMIN = "admin",
  KASIR = "kasir",
}

export enum ExpenseCategory {
  OPERATIONAL = "Operasional",
  SUPPLY = "Suplai",
  SALARY = "Gaji",
  DEBT = "Hutang",
  }
