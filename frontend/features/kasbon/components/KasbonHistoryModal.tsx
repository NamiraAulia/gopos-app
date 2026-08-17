"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, CreditCard, User, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { kasbonApi } from "../api";
import type { DebtLog } from "../types";
import type { Member } from "@/features/member/types";

interface KasbonHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onOpenRepay?: () => void;
}

export const KasbonHistoryModal = ({
  isOpen,
  onClose,
  member,
  onOpenRepay,
}: KasbonHistoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<DebtLog[]>([]);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      fetchHistory();
    }
  }, [isOpen, member]);

  const fetchHistory = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const res = await kasbonApi.getMemberHistory(member.id);
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setIsOverdue(res.data.is_overdue || false);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat kasbon:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  const totalDebt = member.total_debt || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Riwayat Kasbon & Cicilan</h2>
              {isOverdue && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-600 rounded-full flex items-center gap-1 border border-red-200">
                  <AlertCircle className="h-3 w-3" /> Jatuh Tempo (&gt;30 Hari)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {member.name} ({member.member_code}) • Telp: {member.phone || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Card */}
        <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Total Utang Aktif Saat Ini
            </span>
            <h3 className={`text-2xl font-black ${totalDebt > 0 ? "text-red-600" : "text-emerald-600"}`}>
              Rp {totalDebt.toLocaleString("id-ID")}
            </h3>
          </div>
          {totalDebt > 0 && onOpenRepay && (
            <button
              onClick={() => {
                onClose();
                onOpenRepay();
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 cursor-pointer flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" /> Bayar / Cicil Utang
            </button>
          )}
        </div>

        {/* Timeline Log List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">Belum ada riwayat transaksi kasbon atau cicilan</p>
            </div>
          ) : (
            logs.map((item) => {
              const isKasbon = item.type === "kasbon";
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    isKasbon
                      ? "bg-red-50/40 border-red-200/80"
                      : "bg-emerald-50/40 border-emerald-200/80"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                          isKasbon ? "bg-red-500 text-white" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isKasbon ? "KASBON BARU" : "CICILAN / PELUNASAN"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span
                      className={`font-black text-sm ${
                        isKasbon ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {isKasbon ? "+" : "-"} Rp {item.amount.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">{item.notes || "-"}</p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200/60 pt-2 font-mono">
                    <span>
                      Sisa Utang: <strong>Rp {item.remaining_debt.toLocaleString("id-ID")}</strong>
                    </span>
                    <span>Metode: {item.payment_method?.toUpperCase()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 mt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
