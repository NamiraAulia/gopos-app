export function validateCashSummaryInput(actualCash: number): { valid: boolean; error?: string } {
  if (actualCash < 0) {
    return { valid: false, error: "Nominal uang fisik tidak boleh negatif." };
  }
  return { valid: true };
}
