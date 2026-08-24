import type {
  CheckoutPayload,
  ShiftDataDTO,
  TransactionDTO,
  ExpenseDTO,
  CartItemDTO,
} from "../DTO/cashier.dto";
import { cashierDAO as cashierServiceObj } from "@/service/cashier.service";

export type ShiftDataDAO = ShiftDataDTO;
export type TransactionDAO = TransactionDTO;
export type ExpenseDAO = ExpenseDTO;
export type CheckoutPayloadDAO = CheckoutPayload;
export type CartItemDAO = CartItemDTO;

// Export cashierDAO alias pointing to service for full backwards compatibility
export const cashierDAO = cashierServiceObj;
