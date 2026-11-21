"use client";

import { useEffect, useState } from "react";
import { X, User, Phone, Loader2, AlertCircle, Users } from "lucide-react";
import { memberDAO } from "../DAO/member.dao";
import type { MemberDTO as Member } from "../DTO/member.dto";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member | null;
}

export const MemberModal = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}: MemberModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isEditMode = !!member;

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name);
        setPhone(member.phone || "");
      } else {
        setName("");
        setPhone("");
      }
      setErrorMsg("");
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama lengkap wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isEditMode && member) {
        res = await memberDAO.editMember(member.id, {
          name: name.trim(),
          phone: phone.trim(),
        });
      } else {
        res = await memberDAO.createMember({
          name: name.trim(),
          phone: phone.trim(),
        });
      }

      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message || "Gagal memproses data member.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Terjadi kesalahan koneksi atau server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                {isEditMode ? "Ubah Data Member" : "Registrasi Member Baru"}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-500">
                Data profil pelanggan toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          
          {errorMsg && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Code Display (If editing) */}
          {isEditMode && member && (
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">
                ID / Kode Member
              </label>
              <div className="text-base font-black text-slate-900 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 select-all font-mono">
                {member.member_code}
              </div>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 stroke-[2.5]" />
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 pl-12 pr-4 text-sm sm:text-base font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">
              Nomor Telepon / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 stroke-[2.5]" />
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 pl-12 pr-4 text-sm sm:text-base font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="h-12 px-5 border-2 border-slate-200 bg-white hover:bg-slate-50 text-sm sm:text-base font-black text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-blue-600/20 hover:shadow-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Data"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
