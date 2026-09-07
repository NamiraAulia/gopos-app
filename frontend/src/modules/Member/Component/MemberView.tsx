"use client";

import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Phone,
  Calendar,
  Download,
  Upload,
  History,
  Wallet,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { MemberModal } from "@/modules/Member/Component/MemberModal";
import { MemberImportModal } from "@/modules/Member/Component/MemberImportModal";
import { KasbonHistoryModal } from "@/modules/Member/Component/KasbonHistoryModal";
import { RepaymentModal } from "@/modules/Member/Component/RepaymentModal";
import { memberDAO } from "@/modules/Member/DAO/member.dao";
import type { MemberDTO } from "../DTO/member.dto";
import type { MemberModalState } from "../Store/memberModal.atom";

interface MemberViewProps {
  loading: boolean;
  errorMsg: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  copiedId: number | null;
  modal: MemberModalState;
  openModal: (payload: { type: any; data?: any }) => void;
  closeModal: () => void;
  filteredMembers: MemberDTO[];
  handleCopyCode: (code: string, id: number) => void;
  handleEditClick: (member: MemberDTO) => void;
  handleCreateClick: () => void;
  handleImportClick: () => void;
  handleHistoryClick: (member: MemberDTO) => void;
  handleRepaymentClick: (member: MemberDTO) => void;
  handleDeleteClick: (member: MemberDTO) => void;
  handleModalSuccess: () => void;
  formatDate: (dateStr?: string) => string;
}

export function MemberView({
  loading,
  errorMsg,
  searchQuery,
  setSearchQuery,
  copiedId,
  modal,
  openModal,
  closeModal,
  filteredMembers,
  handleCopyCode,
  handleEditClick,
  handleCreateClick,
  handleImportClick,
  handleHistoryClick,
  handleRepaymentClick,
  handleDeleteClick,
  handleModalSuccess,
  formatDate,
}: MemberViewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Data Member Toko</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header Title & Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Daftar Member & Pedagang</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Kelola profil pelanggan tetap Anda untuk memberikan penawaran harga khusus pedagang.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => memberDAO.exportMembersCsv(filteredMembers)}
                  className="h-11 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Ekspor CSV Data Member"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleImportClick}
                  className="h-11 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Impor CSV Data Member"
                >
                  <Upload className="h-4 w-4" />
                  Import CSV
                </button>
                <button
                  onClick={handleCreateClick}
                  className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Member Baru
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, kode member, atau nomor telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Error State */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-xs font-bold">Memuat daftar member...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Users className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Tidak ada member ditemukan</p>
                  <p className="text-xs text-slate-400">
                    {searchQuery ? "Coba gunakan kata kunci pencarian lain." : "Mulai daftarkan member pelanggan pertama Anda."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4">Kode Member</th>
                        <th className="px-6 py-4">Nama Lengkap</th>
                        <th className="px-6 py-4">Nomor HP / WA</th>
                        <th className="px-6 py-4">Status Kasbon</th>
                        <th className="px-6 py-4">Tanggal Bergabung</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Kode Member */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {member.member_code}
                              </span>
                              <button
                                onClick={() => handleCopyCode(member.member_code, member.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Salin Kode Member"
                              >
                                {copiedId === member.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Nama */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{member.name}</span>
                          </td>

                          {/* No HP */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{member.phone || "-"}</span>
                            </div>
                          </td>

                          {/* Status Kasbon */}
                          <td className="px-6 py-4">
                            {(member.total_debt || 0) > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                                  Rp {(member.total_debt || 0).toLocaleString("id-ID")}
                                </span>
                                <button
                                  onClick={() => handleRepaymentClick(member)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                                  title="Bayar Pelunasan Utang"
                                >
                                  <Wallet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleHistoryClick(member)}
                                  className="p-1 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                  title="Lihat Riwayat Kasbon"
                                >
                                  <History className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">Lunas / Rp 0</span>
                            )}
                          </td>

                          {/* Tanggal Bergabung */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{formatDate(member.created_at)}</span>
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(member)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Member"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(member)}
                                className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Hapus Member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Member Input/Edit Modal */}
      <MemberModal
        isOpen={modal.type === "MEMBER_FORM"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        member={modal.data || null}
      />

      {/* Member Import CSV Modal */}
      <MemberImportModal
        isOpen={modal.type === "IMPORT_CSV"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />

      {/* Member Kasbon History Modal */}
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

      {/* Member Repayment Modal */}
      <RepaymentModal
        isOpen={modal.type === "REPAYMENT"}
        onClose={closeModal}
        member={modal.data || null}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
