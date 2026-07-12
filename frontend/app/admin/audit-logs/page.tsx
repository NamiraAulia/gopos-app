"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Clock
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";

export default function AuditLogsPage() {
  const router = useRouter();
  const {
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
  } = useAuditLogs();

  useEffect(() => {
    if (isHydrated) {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.role !== "admin") {
        router.push("/cashier");
      }
    }
  }, [isHydrated, currentUser, router]);

  if (!isHydrated || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <Shield className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Log Aktivitas (Audit Trail)</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Title Bar & Date Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Audit Trail Aktivitas</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Lacak seluruh tindakan sensitif dan penyesuaian data penting yang dilakukan oleh kasir & admin.
                </p>
              </div>

              {/* Date Filter Panel */}
              <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold px-1">
                  <span>Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 px-2 rounded-lg border border-slate-200 outline-none text-slate-700 focus:border-blue-600 transition-all font-semibold bg-white cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold px-1">
                  <span>Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 px-2 rounded-lg border border-slate-200 outline-none text-slate-700 focus:border-blue-600 transition-all font-semibold bg-white cursor-pointer"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={handleResetFilters}
                    className="h-9 px-3 text-xs font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span>Memuat log aktivitas...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-sm font-medium">
                  Belum ada log aktivitas yang tercatat di database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="w-44 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Waktu</th>
                        <th className="w-48 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Pengguna</th>
                        <th className="w-44 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Aktivitas</th>
                        <th className="w-36 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Target</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nilai Perubahan</th>
                        <th className="w-32 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log: any) => {
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Waktu */}
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                <Clock className="size-3.5 text-slate-400 shrink-0" />
                                <span>{formatDate(log.created_at)}</span>
                              </div>
                            </td>

                            {/* Pengguna */}
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800 truncate">
                                  {log.user?.name || "Sistem"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                  {log.user?.email || "—"}
                                </span>
                              </div>
                            </td>

                            {/* Aktivitas */}
                            <td className="px-6 py-4 align-top text-center">
                              <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                                {getFriendlyActionName(log.action)}
                              </span>
                            </td>

                            {/* Target */}
                            <td className="px-6 py-4 align-top text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {log.target_table}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold mt-1">
                                  ID: {log.target_id}
                                </span>
                              </div>
                            </td>

                            {/* Nilai Perubahan */}
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] leading-relaxed max-w-md overflow-x-auto">
                                {log.old_value ? (
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-red-500 font-black shrink-0 w-12 text-right uppercase tracking-wider">[LAMA]</span>
                                    <div className="flex-1 font-semibold text-slate-600">{parseLogValue(log.old_value)}</div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-blue-500 font-black shrink-0 w-12 text-right uppercase tracking-wider">[BARU]</span>
                                    <span className="text-slate-400 italic font-bold">Data baru dibuat</span>
                                  </div>
                                )}
                                {log.new_value && (
                                  <div className="flex items-start gap-1.5 border-t border-slate-200/60 pt-1.5">
                                    <span className="text-emerald-600 font-black shrink-0 w-12 text-right uppercase tracking-wider">[BARU]</span>
                                    <div className="flex-1 font-semibold text-slate-700">{parseLogValue(log.new_value)}</div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* IP Address */}
                            <td className="px-6 py-4 align-top text-right">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200/40">
                                {log.ip_address || "127.0.0.1"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {meta && meta.total_pages > 1 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    Menampilkan {logs.length} dari {meta.total} log aktivitas
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPage((prev: any) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((p: any) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-colors cursor-pointer border ${
                          page === p
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((prev: any) => Math.min(meta.total_pages, prev + 1))}
                      disabled={page === meta.total_pages}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
