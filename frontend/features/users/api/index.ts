import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { DBUser } from "../types";

export const usersApi = {
  getUsers: () =>
    api.get<ApiResponse<DBUser[]>>("/admin/users").then((res) => res.data),

  toggleStatus: (id: number, action: "activate" | "deactivate") =>
    api.put<ApiResponse<unknown>>(`/admin/users/${id}/${action}`).then((res) => res.data),

  createUser: (data: Partial<DBUser> & { password?: string }) =>
    api.post<ApiResponse<unknown>>("/admin/users", data).then((res) => res.data),
};
