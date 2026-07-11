"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Plus, 
  ChevronRight, 
  Shield, 
  Mail, 
  User, 
  Key, 
  UserCheck, 
  UserX, 
  Loader2, 
  AlertCircle,
  X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

interface DBUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "kasir";
  is_active: boolean;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser, isHydrated } = useAuthStore();

  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "kasir">("kasir");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      if (res.data?.success) {
        setUsers(res.data.data || []);
      } else {
        setError(res.data?.message || "Gagal memuat data kasir.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.role !== "admin") {
        // Redirect if not admin
        router.push("/cashier");
      } else {
        fetchUsers();
      }
    }
  }, [isHydrated, currentUser, router]);

  const handleToggleStatus = async (user: DBUser) => {
    if (user.email === (currentUser as any)?.email) {
      alert("Anda tidak dapat menonaktifkan akun admin Anda sendiri.");
      return;
    }

    const action = user.is_active ? "deactivate" : "activate";
    const confirmMsg = user.is_active
      ? `Nonaktifkan akun ${user.name}? Kasir ini tidak akan bisa login ke kasir.`
      : `Aktifkan kembali akun ${user.name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/admin/users/${user.id}/${action}`);
      if (res.data?.success) {
        fetchUsers();
      } else {
        alert(res.data?.message || "Gagal memperbarui status user.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghubungi server.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setCreateError("Semua field wajib diisi.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post("/admin/users", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (res.data?.success) {
        alert("Kasir baru berhasil ditambahkan!");
        setShowModal(false);
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setRole("kasir");
        fetchUsers();
      } else {
        setCreateError(res.data?.message || "Gagal membuat user.");
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Gagal mendaftarkan user.");
    } finally {
      setCreateLoading(false);
    }
  };

  // If not hydrated or not admin, show simple loader to avoid flash of content
  if (!isHydrated || !currentUser || currentUser.role !== "admin") {
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
            <span className="text-sm font-bold text-slate-900">Kelola Kasir</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Kelola staf kasir, administrator, dan izin masuk aplikasi.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Tambah Kasir Baru
              </button>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span>Memuat data pengguna...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm font-medium">
                  Belum ada kasir/user yang terdaftar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Peran (Role)</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isSelf = u.email === (currentUser as any).email;
                        const initial = u.name ? u.name.charAt(0).toUpperCase() : "?";

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/10">
                                  {initial}
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-900">
                                    {u.name}
                                  </span>
                                  {isSelf && (
                                    <span className="ml-2 text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                                      Saya
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-500 font-medium">{u.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                                u.role === "admin" 
                                  ? "bg-purple-50 text-purple-600 border border-purple-100" 
                                  : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}>
                                <Shield className="size-3.5" />
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                u.is_active 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                  : "bg-red-50 text-red-500 border-red-200"
                              }`}>
                                {u.is_active ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isSelf ? (
                                <span className="text-xs text-slate-400 font-bold italic pr-2">
                                  Sedang Digunakan
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                                    u.is_active
                                      ? "border-red-200 hover:border-red-300 text-red-600 bg-white hover:bg-red-50"
                                      : "border-emerald-200 hover:border-emerald-300 text-emerald-600 bg-white hover:bg-emerald-50"
                                  }`}
                                >
                                  {u.is_active ? (
                                    <span className="flex items-center gap-1"><UserX className="size-3.5" /> Nonaktifkan</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><UserCheck className="size-3.5" /> Aktifkan</span>
                                  )}
                                </button>
                              )}
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

      {/* Modal Tambah User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-blue-600">
                <Users className="h-5 w-5" />
                <h3 className="font-bold text-sm">Pendaftaran Kasir Baru</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Nama */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap kasir"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Alamat Email (Digunakan untuk Login)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Peran (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("kasir")}
                    className={`h-11 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      role === "kasir"
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                    }`}
                  >
                    Staf Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`h-11 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      role === "admin"
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  disabled={createLoading}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    "Daftarkan"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
