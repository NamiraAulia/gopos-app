import { supabase } from "@/helper/supabaseClient";
import type { AuditLogDAO } from "@/modules/AuditLogs/DAO/auditLogs.dao";
import type { AuditLogFilterDTO } from "@/modules/AuditLogs/DTO/auditLogs.dto";

export async function fetchAuditLogs(filter: AuditLogFilterDTO): Promise<{ data: AuditLogDAO[]; total: number }> {
  let query = supabase.from("activity_logs").select("*, user:users(id, name, email)", { count: "exact" });
  if (filter.startDate) query = query.gte("created_at", filter.startDate);
  if (filter.endDate) query = query.lte("created_at", filter.endDate + "T23:59:59");

  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: (data as AuditLogDAO[]) || [], total: count || 0 };
}
