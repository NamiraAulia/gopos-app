"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/helper/supabaseClient";
import { useAuthStore } from "@/store/authStore";

export function useAuditLogs() {
  const { user: currentUser, isHydrated } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let query = supabase.from("activity_logs").select("*, user:users(id, name, email)", { count: "exact" });
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate + "T23:59:59");

      const from = (page - 1) * 20;
      const to = from + 19;

      const { data, count, error: err } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (err) throw err;

      setLogs(data || []);
      const total = count || 0;
      const totalPages = Math.ceil(total / 20) || 1;
      setMeta({ page, limit: 20, total, total_pages: totalPages });
    } catch (err: any) {
      setError(err.message || "Gagal memuat log audit.");
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

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

  const getFriendlyActionName = (action: string) => {
    return action || "Aktivitas";
  };

  const parseLogValue = (val: any) => {
    if (!val) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return {
    currentUser,
    isHydrated,
    logs,
    meta,
    page,
    setPage,
    loading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetFilters,
    formatDate,
    getActionBadgeStyle,
    getFriendlyActionName,
    parseLogValue,
  };
}
