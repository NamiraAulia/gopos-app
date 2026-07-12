import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Expense } from "../types";

export const expensesApi = {
  getExpenses: (limit = 100) =>
    api.get<ApiResponse<Expense[]>>("/expenses", { params: { limit } }).then((res) => res.data),
};
