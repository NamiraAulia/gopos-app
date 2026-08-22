import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { auditLogsApi } from "../api";
import type { ActivityLog, PaginationMeta } from "../types";

export function useAuditLogs() {
  const { user: currentUser, isHydrated } = useAuthStore();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAuditLogs = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError("");

    if (startDate && endDate && startDate > endDate) {
      setError("Rentang tanggal tidak valid: Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      setLogs([]);
      setMeta(null);
      setLoading(false);
      return;
    }

    try {
      const res = await auditLogsApi.getAuditLogs({
        page: targetPage,
        limit: 12,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      if (res.success) {
        setLogs(res.data || []);
        setMeta(res.meta as any);
      } else {
        setError(res.message || "Gagal memuat log aktivitas.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  useEffect(() => {
    if (isHydrated && currentUser && currentUser.role === "admin") {
      fetchAuditLogs(page);
    }
  }, [isHydrated, currentUser, page, startDate, endDate, fetchAuditLogs]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("VOID") || act.includes("DELETE")) {
      return "bg-red-50 text-red-600 border border-red-200";
    }
    if (act.includes("PRICE") || act.includes("STOCK") || act.includes("ADJUST")) {
      return "bg-amber-50 text-amber-600 border border-amber-200";
    }
    if (act.includes("REFUND")) {
      return "bg-purple-50 text-purple-600 border border-purple-200";
    }
    if (act.includes("CLOSE")) {
      return "bg-indigo-50 text-indigo-600 border border-indigo-200";
    }
    if (act.includes("OPEN")) {
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    }
    return "bg-slate-50 text-slate-600 border border-slate-200";
  };

  const getFriendlyActionName = (action: string) => {
    switch (action.toUpperCase()) {
      case "VOID_TRANSACTION":
        return "Void Transaksi";
      case "DELETE_PRODUCT":
        return "Hapus Produk";
      case "CHANGE_PRICE":
        return "Ubah Harga";
      case "MANUAL_STOCK_ADJUST":
        return "Penyesuaian Stok";
      case "EDIT_PRODUCT":
        return "Edit Produk";
      case "PROCESS_REFUND":
        return "Retur Barang";
      case "OPEN_SHIFT":
        return "Buka Shift";
      case "CLOSE_SHIFT":
        return "Tutup Shift";
      default:
        return action;
    }
  };

  const parseLogValue = (val: string) => {
    if (!val) return null;

    // 1. Process Refund
    if (val.includes("TxCode:") && val.includes("TotalOrig:")) {
      const txCodeMatch = val.match(/TxCode:\s*([^\s,]+)/);
      const totalOrigMatch = val.match(/TotalOrig:\s*(\d+)/);
      return (
        <div className="space-y-0.5 font-sans">
          {txCodeMatch && (
            <div>Kode Transaksi: <span className="font-black text-slate-800">{txCodeMatch[1]}</span></div>
          )}
          {totalOrigMatch && (
            <div>Total Belanja Awal: <span className="font-black text-slate-800">Rp {parseInt(totalOrigMatch[1]).toLocaleString("id-ID")}</span></div>
          )}
        </div>
      );
    }

    if (val.includes("REFUND EXECUTED")) {
      const refundIdMatch = val.match(/RefundID:\s*(\d+)/);
      const cashMatch = val.match(/CashDeducted:\s*(\d+)/);
      const reasonMatch = val.match(/Reason:\s*(.+)/);
      return (
        <div className="space-y-0.5 font-sans">
          <div className="text-purple-700 font-bold">Proses Retur Berhasil {refundIdMatch ? `(ID: ${refundIdMatch[1]})` : ""}</div>
          {cashMatch && (
            <div>Kas Dikembalikan: <span className="font-black text-slate-800">Rp {parseInt(cashMatch[1]).toLocaleString("id-ID")}</span></div>
          )}
          {reasonMatch && (
            <div>Alasan: <span className="font-semibold text-slate-700 italic">"{reasonMatch[1]}"</span></div>
          )}
        </div>
      );
    }

    // 2. Void Transaction
    if (val.includes("Status:completed") || (val.includes("Status:") && val.includes("TotalAmount:"))) {
      const statusMatch = val.match(/Status:\s*([^\s,]+)/);
      const totalMatch = val.match(/TotalAmount:\s*(\d+)/);
      const statusLabel = statusMatch && statusMatch[1] === "completed" ? "Selesai" : (statusMatch ? statusMatch[1] : "Selesai");
      return (
        <div className="space-y-0.5 font-sans">
          <div>Status Awal: <span className="font-black text-slate-800">{statusLabel}</span></div>
          {totalMatch && (
            <div>Total Transaksi: <span className="font-black text-slate-800">Rp {parseInt(totalMatch[1]).toLocaleString("id-ID")}</span></div>
          )}
        </div>
      );
    }

    if (val === "Status: voided" || val === "Status:voided") {
      return (
        <div className="font-sans text-red-600 font-bold">
          Status Baru: Dibatalkan (Void)
        </div>
      );
    }

    // 3. Price change
    if (val.startsWith("Price:") && !val.includes(",")) {
      const priceMatch = val.match(/Price:\s*(\d+)/);
      if (priceMatch) {
        return (
          <div className="font-sans">
            Harga: <span className="font-black text-slate-800">Rp {parseInt(priceMatch[1]).toLocaleString("id-ID")}</span>
          </div>
        );
      }
    }

    // 4. Stock adjust
    if (val.startsWith("Stock:") && !val.includes(",")) {
      const stockMatch = val.match(/Stock:\s*(\d+)/);
      if (stockMatch) {
        return (
          <div className="font-sans">
            Stok: <span className="font-black text-slate-800">{stockMatch[1]} pcs</span>
          </div>
        );
      }
    }

    // 5. Delete product
    if (val === "IsActive: true") {
      return <div className="font-sans text-emerald-600 font-semibold">Status: Aktif</div>;
    }
    if (val === "IsActive: false") {
      return <div className="font-sans text-red-500 font-semibold">Status: Nonaktif (Dihapus)</div>;
    }

    // Fallback: split by comma and display as items
    if (val.includes(",") || val.includes(":")) {
      const parts = val.split(/,\s*/);
      return (
        <div className="space-y-0.5 font-sans text-slate-700">
          {parts.map((p, idx) => {
            const splitCol = p.split(/:\s*/);
            if (splitCol.length === 2) {
              let value = splitCol[1];
              // Format if number
              if (/^\d+$/.test(value)) {
                const num = parseInt(value);
                if (num > 1000 && (splitCol[0].toLowerCase().includes("price") || splitCol[0].toLowerCase().includes("total") || splitCol[0].toLowerCase().includes("amount"))) {
                  value = `Rp ${num.toLocaleString("id-ID")}`;
                }
              }
              return (
                <div key={idx}>
                  <span className="text-slate-400 font-normal capitalize">{splitCol[0].replace(/_/g, " ")}:</span>{" "}
                  <span className="font-bold text-slate-800">{value}</span>
                </div>
              );
            }
            return <div key={idx}>{p}</div>;
          })}
        </div>
      );
    }

    return <span className="font-mono">{val}</span>;
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
    fetchAuditLogs,
    handleResetFilters,
    formatDate,
    getActionBadgeStyle,
    getFriendlyActionName,
    parseLogValue,
  };
}
