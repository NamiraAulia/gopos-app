"use client";

import {
  Search,
  Users,
  AlertCircle,
  CreditCard,
  History,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Clock,
  Phone,
  CheckCircle2,
} from "lucide-react";
import type { MemberDTO } from "@/modules/Member/DTO/member.dto";
import type { KasbonSummaryDAO } from "../DAO/kasbon.dao";
import { RepaymentModal } from "@/modules/Member/Component/RepaymentModal";
import { KasbonHistoryModal } from "@/modules/Member/Component/KasbonHistoryModal";

interface KasbonViewProps {
  router: any;
  members: MemberDTO[];
  filteredMembers: MemberDTO[];
  summary: KasbonSummaryDAO;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: "all" | "has_debt" | "overdue";
  setActiveTab: (t: "all" | "has_debt" | "overdue") => void;
  selectedMemberForRepay: MemberDTO | null;
  setSelectedMemberForRepay: (m: MemberDTO | null) => void;
  selectedMemberForHistory: MemberDTO | null;
  setSelectedMemberForHistory: (m: MemberDTO | null) => void;
  thirtyDaysAgo: Date;
  loadData: () => void;
}

export function KasbonView({
  router,
  members,
  filteredMembers,
  summary,
  loading,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  selectedMemberForRepay,
  setSelectedMemberForRepay,
  selectedMemberForHistory,
  setSelectedMemberForHistory,
  thirtyDaysAgo,
  loadData,
}: KasbonViewProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/cashier")}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Kembali ke Kasir"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-black text-slate-900 text-lg tracking-tight">
              Manajemen Kasbon Pelanggan
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Pencatatan utang, cicilan, dan monitoring jatuh tempo kasbon toko
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Total Piutang Toko
              </span>
              <h2 className="text-2xl font-black text-red-600 mt-1">
                Rp {summary.total_receivables.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Member Berutang
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {summary.total_debtors} <span className="text-sm font-medium text-slate-400">Orang</span>
              </h2>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Jatuh Tempo (&gt; 30 Hari)
              </span>
              <h2 className="text-2xl font-black text-amber-600 mt-1">
                {summary.overdue_debtors} <span className="text-sm font-medium text-slate-400">Member</span>
              </h2>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("has_debt")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === "has_debt"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ada Utang ({summary.total_debtors})
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === "overdue"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Jatuh Tempo ({summary.overdue_debtors})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua Member ({members.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, kode, no hp..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-xs font-bold focus:border-blue-600 outline-none bg-slate-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Member Debt Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Users className="h-10 w-10 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600">Tidak ada member ditemukan</p>
              <p className="text-xs text-slate-400">
                {activeTab === "has_debt"
                  ? "Saat ini tidak ada member yang memiliki utang aktif"
                  : "Coba ubah kata kunci pencarian atau filter tab"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                    <th className="py-3.5 px-4">Member / Kode</th>
                    <th className="py-3.5 px-4">Kontak (No HP)</th>
                    <th className="py-3.5 px-4">Total Utang</th>
                    <th className="py-3.5 px-4">Utang Terakhir</th>
                    <th className="py-3.5 px-4">Status Jatuh Tempo</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMembers.map((m) => {
                    const debt = m.total_debt || 0;
                    const isOverdue = debt > 0 && m.last_debt_at && new Date(m.last_debt_at) < thirtyDaysAgo;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{m.member_code}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" /> {m.phone}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-black text-sm ${debt > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            Rp {debt.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {m.last_debt_at
                            ? new Date(m.last_debt_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          {debt <= 0 ? (
                            <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> LUNAS
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2.5 py-1 text-[10px] font-black bg-red-100 text-red-700 rounded-full border border-red-200 inline-flex items-center gap-1 animate-pulse">
                              <AlertCircle className="h-3 w-3" /> JATUH TEMPO (&gt;30 Hari)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-black bg-amber-50 text-amber-700 rounded-full border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> BELUM LUNAS
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {debt > 0 && (
                              <button
                                onClick={() => setSelectedMemberForRepay(m)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Cicil / Bayar
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedMemberForHistory(m)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <History className="h-3.5 w-3.5" /> Riwayat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <RepaymentModal
        isOpen={!!selectedMemberForRepay}
        onClose={() => setSelectedMemberForRepay(null)}
        member={selectedMemberForRepay as any}
        onSuccess={() => {
          setSelectedMemberForRepay(null);
          loadData();
        }}
      />

      <KasbonHistoryModal
        isOpen={!!selectedMemberForHistory}
        onClose={() => setSelectedMemberForHistory(null)}
        member={selectedMemberForHistory as any}
        onOpenRepay={() => {
          if (selectedMemberForHistory) {
            setSelectedMemberForRepay(selectedMemberForHistory);
          }
        }}
      />
    </div>
  );
}
