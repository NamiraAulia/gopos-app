import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Member, CreateMemberPayload } from "./types";

export const memberApi = {
  getMembers: () =>
    api.get<ApiResponse<Member[]>>("/members").then((res) => res.data),

  createMember: (payload: CreateMemberPayload) =>
    api.post<ApiResponse<Member>>("/members", payload).then((res) => res.data),

  editMember: (id: number, payload: CreateMemberPayload) =>
    api.put<ApiResponse<Member>>(`/members/${id}`, payload).then((res) => res.data),

  deleteMember: (id: number) =>
    api.delete<ApiResponse<any>>(`/members/${id}`).then((res) => res.data),
};
