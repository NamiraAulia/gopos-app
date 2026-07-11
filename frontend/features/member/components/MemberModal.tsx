"use client";

import { useEffect, useState } from "react";
import { X, User, Phone, Loader2, AlertCircle, Users } from "lucide-react";
import { memberApi } from "../api";
import type { Member } from "../types";

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
        setPhone(member.phone);
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
    if (!phone.trim()) {
      setErrorMsg("Nomor telepon wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isEditMode && member) {
        res = await memberApi.editMember(member.id, {
          name: name.trim(),
          phone: phone.trim(),
        });
      } else {
        res = await memberApi.createMember({
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-blue-600">
            <Users className="h-5 w-5" />
            <h3 className="font-bold text-sm">
              {isEditMode ? "Ubah Data Member" : "Registrasi Member Baru"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Code Display (If editing) */}
          {isEditMode && member && (
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                ID/Kode Member
              </label>
              <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 select-all font-mono">
                {member.member_code}
              </div>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 pl-11 pr-4 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nomor Telepon / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 pl-11 pr-4 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
