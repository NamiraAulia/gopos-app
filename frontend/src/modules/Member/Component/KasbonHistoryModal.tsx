"use client";

import { useEffect, useState } from "react";
import { X, History } from "lucide-react";
import { supabase } from "@/helper/supabaseClient";
import type { MemberDTO as Member } from "../DTO/member.dto";

interface KasbonHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onOpenRepay?: () => void;
}

export function KasbonHistoryModal({ isOpen, onClose, member, onOpenRepay }: KasbonHistoryModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && member) {
      setLoading(true);
      supabase
        .from("debt_logs")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setLogs(data || []);
          setLoading(false);
        });
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Riwayat Kasbon</h3>
            <p className="text-xs text-slate-500 font-medium">{member.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <p className="text-center text-xs text-slate-400 py-8">Memuat riwayat...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Belum ada catatan mutasi utang.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className={log.type === "kasbon" ? "text-red-600" : "text-emerald-600"}>
                    {log.type === "kasbon" ? "+ Kasbon" : "- Pelunasan"}
                  </span>
                  <span>Rp {(log.amount || 0).toLocaleString("id-ID")}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {new Date(log.created_at).toLocaleString("id-ID")} · Sisa: Rp {(log.remaining_debt || 0).toLocaleString("id-ID")}
                </p>
                {log.notes && <p className="text-[11px] text-slate-600 italic">{log.notes}</p>}
              </div>
            ))
          )}
        </div>

        {onOpenRepay && (member.total_debt || 0) > 0 && (
          <div className="pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => {
                onClose();
                onOpenRepay();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Bayar Pelunasan Kasbon
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
