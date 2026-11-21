"use client";

import {
  Search,
  Users,
  AlertCircle,
  CreditCard,
  History,
  TrendingDown,
  RefreshCw,
  Clock,
  Phone,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
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
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Breadcrumb */}
        <header className="h-16 sm:h-18 bg-white border-b-2 border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <CreditCard className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              <span className="text-base sm:text-lg font-black text-slate-900">Manajemen Kasbon Pelanggan</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="h-12 px-5 rounded-xl border-2 border-slate-200 bg-white text-sm sm:text-base font-black text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-4.5 w-4.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`} /> Refresh Data
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Pencatatan Utang & Piutang Kasbon</h2>
                <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                  Pencatatan saldo piutang member, cicilan pelunasan, dan monitoring jatuh tempo toko.
                </p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase text-slate-500 tracking-wider">
                    Total Piutang Toko
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
                    Rp {summary.total_receivables.toLocaleString("id-ID")}
                  </h2>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                  <TrendingDown className="h-7 w-7 stroke-[2.5]" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase text-slate-500 tracking-wider">
                    Member Berutang
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {summary.total_debtors} <span className="text-base font-bold text-slate-500">Orang</span>
                  </h2>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="h-7 w-7 stroke-[2.5]" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase text-slate-500 tracking-wider">
                    Jatuh Tempo (&gt; 30 Hari)
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                    {summary.overdue_debtors} <span className="text-base font-bold text-slate-500">Member</span>
                  </h2>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <AlertCircle className="h-7 w-7 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
              {/* Tabs */}
              <div className="flex bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto gap-1">
                <button
                  onClick={() => setActiveTab("has_debt")}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
                    activeTab === "has_debt"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ada Utang ({summary.total_debtors})
                </button>
                <button
                  onClick={() => setActiveTab("overdue")}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
                    activeTab === "overdue"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Jatuh Tempo ({summary.overdue_debtors})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua Member ({members.length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 stroke-[2.5]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, kode, no hp..."
                  className="h-12 w-full rounded-xl border-2 border-slate-200 pl-12 pr-4 text-sm sm:text-base font-bold focus:border-blue-600 outline-none bg-slate-50 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Member Debt Table */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <Users className="h-12 w-12 mx-auto text-slate-300 stroke-[2.5]" />
                  <p className="font-black text-base text-slate-700">Tidak ada member ditemukan</p>
                  <p className="text-sm font-bold text-slate-500">
                    {activeTab === "has_debt"
                      ? "Saat ini tidak ada member yang memiliki utang aktif"
                      : "Coba ubah kata kunci pencarian atau filter tab"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[920px]">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-800 uppercase tracking-wider text-xs sm:text-sm font-black">
                        <th className="py-4 px-6">Member / Kode</th>
                        <th className="py-4 px-6">Kontak (No HP)</th>
                        <th className="py-4 px-6">Total Utang</th>
                        <th className="py-4 px-6">Utang Terakhir</th>
                        <th className="py-4 px-6 whitespace-nowrap">Status Jatuh Tempo</th>
                        <th className="py-4 px-6 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((m) => {
                        const debt = m.total_debt || 0;
                        const isOverdue =
                          debt > 0 &&
                          m.last_debt_at &&
                          new Date(m.last_debt_at) < thirtyDaysAgo;

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <span className="font-black text-base sm:text-lg text-slate-900 block">
                                {m.name}
                              </span>
                              <span className="text-xs font-bold font-mono text-slate-500">
                                {m.member_code}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 font-bold text-sm sm:text-base">
                              {m.phone ? (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="h-4 w-4 text-slate-400 stroke-[2.5]" /> {m.phone}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`font-black text-base sm:text-lg ${debt > 0 ? "text-red-600" : "text-emerald-600"}`}
                              >
                                Rp {debt.toLocaleString("id-ID")}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-600 font-bold font-mono text-xs sm:text-sm">
                              {m.last_debt_at
                                ? new Date(m.last_debt_at).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {debt <= 0 ? (
                                <span className="px-3 py-1.5 text-xs sm:text-sm font-black bg-emerald-50 text-emerald-700 rounded-full border-2 border-emerald-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" /> LUNAS
                                </span>
                              ) : isOverdue ? (
                                <span className="px-3 py-1.5 text-xs sm:text-sm font-black bg-red-100 text-red-700 rounded-full border-2 border-red-300 inline-flex items-center gap-1.5 animate-pulse whitespace-nowrap shrink-0">
                                  <AlertCircle className="h-4 w-4 stroke-[2.5]" /> JATUH TEMPO (&gt;30 Hari)
                                </span>
                              ) : (
                                <span className="px-3 py-1.5 text-xs sm:text-sm font-black bg-amber-50 text-amber-700 rounded-full border-2 border-amber-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                  <Clock className="h-4 w-4 stroke-[2.5]" /> BELUM LUNAS
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2.5">
                                {debt > 0 && (
                                  <button
                                    onClick={() => setSelectedMemberForRepay(m)}
                                    className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                                  >
                                    <CreditCard className="h-4 w-4 stroke-[2.5]" /> Cicil / Bayar
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedMemberForHistory(m)}
                                  className="h-10 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-black text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <History className="h-4 w-4 stroke-[2.5]" /> Riwayat
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
          </div>
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
