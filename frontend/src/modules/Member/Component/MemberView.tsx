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
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { MemberModal } from "@/modules/Member/Component/MemberModal";
import { MemberImportModal } from "@/modules/Member/Component/MemberImportModal";
import { memberDAO } from "@/modules/Member/DAO/member.dao";
import type { MemberDTO } from "../DTO/member.dto";

interface MemberViewProps {
  loading: boolean;
  errorMsg: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  copiedId: number | null;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  importModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  selectedMember: MemberDTO | null;
  filteredMembers: MemberDTO[];
  handleCopyCode: (code: string, id: number) => void;
  handleEditClick: (member: MemberDTO) => void;
  handleCreateClick: () => void;
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
  modalOpen,
  setModalOpen,
  importModalOpen,
  setImportModalOpen,
  selectedMember,
  filteredMembers,
  handleCopyCode,
  handleEditClick,
  handleCreateClick,
  handleDeleteClick,
  handleModalSuccess,
  formatDate,
}: MemberViewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 sm:h-18 bg-white border-b-2 border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              <span className="text-base sm:text-lg font-black text-slate-900">Data Member Toko</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header Title & Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Daftar Member & Pedagang</h2>
                <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                  Kelola profil pelanggan tetap Anda untuk memberikan penawaran harga khusus pedagang.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <button
                  onClick={() => memberDAO.exportMembersCsv(filteredMembers)}
                  className="h-12 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 rounded-xl text-sm sm:text-base font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  title="Ekspor CSV Data Member"
                >
                  <Download className="h-5 w-5 stroke-[2.5]" />
                  Export CSV
                </button>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="h-12 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  title="Import Data Member dari CSV"
                >
                  <Upload className="h-5 w-5 stroke-[2.5]" />
                  Import CSV
                </button>
                <button
                  onClick={handleCreateClick}
                  className="h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                  Tambah Member Baru
                </button>
              </div>
            </div>

            {/* Error state */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Bar (Search) */}
            <div className="bg-white border-2 border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6 stroke-[2.5]" />
                <input
                  type="text"
                  placeholder="Cari member berdasarkan Nama, HP, atau Kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 text-base font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-base font-bold gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span>Memuat data member...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-24 text-center text-slate-500 text-base font-bold">
                  {searchQuery ? "Tidak ditemukan member yang cocok dengan pencarian Anda." : "Belum ada member yang terdaftar."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                      <tr>
                        <th className="w-16 px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider text-center">No</th>
                        <th className="w-64 px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">Kode Member</th>
                        <th className="px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">Nama Lengkap</th>
                        <th className="w-56 px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">Nomor Telepon</th>
                        <th className="w-48 px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">Tanggal Bergabung</th>
                        <th className="w-32 px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-base">
                      {filteredMembers.map((member: MemberDTO, index: number) => (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* No */}
                          <td className="px-6 py-4 text-sm sm:text-base font-black text-slate-600 text-center">
                            {index + 1}
                          </td>

                          {/* Kode Member */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm sm:text-base font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                                {member.member_code}
                              </span>
                              <button
                                onClick={() => handleCopyCode(member.member_code, member.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Salin Kode"
                              >
                                {copiedId === member.id ? (
                                  <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                                ) : (
                                  <Copy className="h-4 w-4 stroke-[2.5]" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Nama Lengkap */}
                          <td className="px-6 py-4">
                            <div className="font-black text-base sm:text-lg text-slate-900">{member.name}</div>
                          </td>

                          {/* Nomor Telepon */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm sm:text-base text-slate-800 font-bold">
                              <Phone className="h-4 w-4 text-slate-400 stroke-[2.5]" />
                              <span>{member.phone || "-"}</span>
                            </div>
                          </td>

                          {/* Tanggal Bergabung */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm sm:text-base text-slate-600 font-bold">
                              <Calendar className="h-4 w-4 text-slate-400 stroke-[2.5]" />
                              <span>{formatDate(member.created_at)}</span>
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(member)}
                                className="h-10 w-10 flex items-center justify-center text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Member"
                              >
                                <Edit className="h-4 w-4 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(member)}
                                className="h-10 w-10 flex items-center justify-center text-slate-600 hover:text-red-600 rounded-xl border border-slate-200 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Member"
                              >
                                <Trash2 className="h-4 w-4 stroke-[2.5]" />
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
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        member={selectedMember}
      />

      {/* Member Import CSV Modal */}
      <MemberImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
