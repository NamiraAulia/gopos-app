import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { RestockItem } from "./types";

export const restockApi = {
  getRestockSuggestions: () =>
    api.get<ApiResponse<RestockItem[]>>("/restock-suggestions").then((res) => res.data),
};
