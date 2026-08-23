"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { MemberModal } from "@/features/member/components/MemberModal";
import { MemberImportModal } from "@/features/member/components/MemberImportModal";
import { memberApi } from "@/features/member/api";
import { useMemberManagement } from "@/features/member/hooks/useMemberManagement";

export default function MemberPage() {
  const router = useRouter();
  const {
    currentUser,
    isHydrated,
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
    handleCopyCode,
    handleEditClick,
    handleCreateClick,
    handleDeleteClick,
    handleModalSuccess,
    filteredMembers,
    formatDate,
  } = useMemberManagement();

  if (!isHydrated || !currentUser) {
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
                  onClick={() => memberApi.exportMembersCsv(filteredMembers)}
                  className="h-11 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Ekspor CSV Data Member"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Import Data Member dari CSV"
                >
                  <Upload className="h-4 w-4" />
                  Import CSV
                </button>
                <button
                  onClick={handleCreateClick}
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="h-4.5 w-4.5" />
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
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                <input
                  type="text"
                  placeholder="Cari member berdasarkan Nama, HP, atau Kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span>Memuat data member...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-sm font-medium">
                  {searchQuery ? "Tidak ditemukan member yang cocok dengan pencarian Anda." : "Belum ada member yang terdaftar."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="w-16 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">No</th>
                        <th className="w-64 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kode Member</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                        <th className="w-56 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nomor Telepon</th>
                        <th className="w-44 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal Bergabung</th>
                        <th className="w-32 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((member: any, index: any) => (
                        <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                          {/* No */}
                          <td className="px-6 py-4 text-xs font-bold text-slate-400 text-center">
                            {index + 1}
                          </td>

                          {/* Kode Member */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                                {member.member_code}
                              </span>
                              <button
                                onClick={() => handleCopyCode(member.member_code, member.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                                title="Salin Kode"
                              >
                                {copiedId === member.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Nama Lengkap */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-xs text-slate-900">{member.name}</div>
                          </td>

                          {/* Nomor Telepon */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{member.phone || "-"}</span>
                            </div>
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
