"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/service/auditLogs.service";
import { useAuditLogStore } from "../Store/useAuditLogStore";
import { validateAuditFilter } from "../Validation/auditLogs.validation";
import { AuditLogsView } from "../Component/AuditLogsView";

export default function AuditLogsContainer() {
  const { startDate, endDate, page, setStartDate, setEndDate, setPage, resetFilters } = useAuditLogStore();

  const filter = { startDate, endDate, page, limit: 20 };
  const validation = validateAuditFilter(filter);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["auditLogs", startDate, endDate, page],
    queryFn: () => fetchAuditLogs(filter),
    enabled: validation.valid,
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getActionBadgeStyle = (action: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("create") || act.includes("insert")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (act.includes("update") || act.includes("edit")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (act.includes("delete") || act.includes("void")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getFriendlyActionName = (action: string) => action || "Aktivitas";

  const parseLogValue = (val: any) => {
    if (!val) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <AuditLogsView
      logs={logs}
      total={total}
      totalPages={totalPages}
      page={page}
      setPage={setPage}
      loading={isLoading}
      error={!validation.valid ? validation.error || "" : isError ? (error as any)?.message || "Gagal memuat log" : ""}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      handleResetFilters={resetFilters}
      formatDate={formatDate}
      getActionBadgeStyle={getActionBadgeStyle}
      getFriendlyActionName={getFriendlyActionName}
      parseLogValue={parseLogValue}
    />
  );
}
