import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { ActivityLog } from "../types";

export const auditLogsApi = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<ActivityLog[]>> => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 15;
      const startDate = params?.start_date;
      const endDate = params?.end_date;

      let query = supabase
        .from("activity_logs")
        .select(`
          *,
          user:users(id, name, role, is_active)
        `, { count: "exact" });

      if (startDate) {
        query = query.gte("created_at", startDate + "T00:00:00");
      }
      if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59");
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Map DB field `name` to frontend expected `username`
      const mappedLogs = (data || []).map((log: any) => ({
        ...log,
        user: log.user ? {
          id: log.user.id,
          username: log.user.name,
          role: log.user.role,
          is_active: log.user.is_active,
        } : undefined,
      }));

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: "Daftar log aktivitas berhasil diambil",
        data: mappedLogs as ActivityLog[],
        meta: {
          page,
          limit,
          total,
          total_pages: totalPages,
        } as any,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memuat log aktivitas",
        data: [],
        meta: null,
      };
    }
  },
};
