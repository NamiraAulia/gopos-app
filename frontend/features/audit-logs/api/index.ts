import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ActivityLog, PaginationMeta } from "../types";

export const auditLogsApi = {
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) =>
    api
      .get<ApiResponse<ActivityLog[]>>("/admin/audit-logs", { params })
      .then((res) => res.data),
};
