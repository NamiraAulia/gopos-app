import type { CustomerDisplayCartItemDAO } from "../DAO/customerDisplay.dao";

export function validateCustomerDisplayCart(cart: CustomerDisplayCartItemDAO[]): { valid: boolean } {
  return { valid: Array.isArray(cart) };
}
