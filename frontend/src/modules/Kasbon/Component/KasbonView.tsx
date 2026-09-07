"use client";

import {
  Search,
  Users,
  AlertCircle,
  CreditCard,
  History,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Clock,
  Phone,
  CheckCircle2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { MemberDTO } from "@/modules/Member/DTO/member.dto";
import type { KasbonSummaryDAO } from "../DAO/kasbon.dao";
import type { KasbonModalState } from "../Store/kasbonModal.atom";
import { RepaymentModal } from "@/modules/Kasbon/Component/RepaymentModal";
import { KasbonHistoryModal } from "@/modules/Kasbon/Component/KasbonHistoryModal";

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
  modal: KasbonModalState;
  openModal: (payload: { type: any; data: MemberDTO | null }) => void;
  closeModal: () => void;
  thirtyDaysAgo: Date;
  handleModalSuccess: () => void;
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
  modal,
  openModal,
  closeModal,
  thirtyDaysAgo,
  handleModalSuccess,
  loadData,
}: KasbonViewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">
              Manajemen Kasbon Pelanggan
            </span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Manajemen Kasbon Pelanggan
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Pencatatan utang, cicilan, dan monitoring jatuh tempo kasbon toko.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => loadData()}
                  className="h-11 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Total Piutang Toko
                  </span>
                  <h2 className="text-2xl font-bold text-red-600 mt-1">
                    Rp {summary.total_receivables.toLocaleString("id-ID")}
                  </h2>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Member Berutang
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {summary.total_debtors}{" "}
                    <span className="text-xs font-medium text-slate-400">
                      / {members.length} Member
                    </span>
                  </h2>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Kasbon Jatuh Tempo
                  </span>
                  <h2 className="text-2xl font-bold text-amber-600 mt-1">
                    {summary.overdue_debtors}{" "}
                    <span className="text-xs font-medium text-slate-400">
                      (&gt;30 Hari)
                    </span>
                  </h2>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Table and Filter Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, kode member, atau no HP..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("has_debt")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "has_debt"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Ada Utang ({summary.total_debtors})
                  </button>
                  <button
                    onClick={() => setActiveTab("overdue")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "overdue"
                        ? "bg-white text-red-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Jatuh Tempo ({summary.overdue_debtors})
                  </button>
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "all"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Semua Member ({members.length})
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span>Memuat data kasbon...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-bold">
                  Tidak ada data member pada filter ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Kode Member</th>
                        <th className="py-3 px-4">Nama Member</th>
                        <th className="py-3 px-4">Kontak (HP)</th>
                        <th className="py-3 px-4 text-right">Sisa Utang</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredMembers.map((m) => {
                        const debt = m.total_debt || 0;
                        const isOverdue =
                          debt > 0 &&
                          m.last_debt_at &&
                          new Date(m.last_debt_at) < thirtyDaysAgo;

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-mono text-slate-400">
                              {m.member_code}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {m.name}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{m.phone || "-"}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span
                                className={`font-bold ${
                                  debt > 0
                                    ? "text-red-600 font-mono text-sm"
                                    : "text-slate-400"
                                }`}
                              >
                                Rp {debt.toLocaleString("id-ID")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {debt === 0 ? (
                                <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> LUNAS
                                </span>
                              ) : isOverdue ? (
                                <span className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full border border-red-200 inline-flex items-center gap-1 animate-pulse">
                                  <AlertCircle className="h-3 w-3" /> JATUH TEMPO
                                  (&gt;30 Hari)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200 inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> BELUM LUNAS
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {debt > 0 && (
                                  <button
                                    onClick={() =>
                                      openModal({ type: "REPAYMENT", data: m })
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                  >
                                    <CreditCard className="h-3.5 w-3.5" /> Cicil /
                                    Bayar
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    openModal({ type: "HISTORY", data: m })
                                  }
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
          </div>
        </div>
      </main>

      {/* Modals */}
      <RepaymentModal
        isOpen={modal.type === "REPAYMENT"}
        onClose={closeModal}
        member={modal.data || null}
        onSuccess={() => {
          closeModal();
          handleModalSuccess();
        }}
      />

      <KasbonHistoryModal
        isOpen={modal.type === "HISTORY"}
        onClose={closeModal}
        member={modal.data || null}
        onOpenRepay={() => {
          if (modal.data) {
            openModal({ type: "REPAYMENT", data: modal.data });
          }
        }}
      />
    </div>
  );
}
