import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { usersApi } from "../api";
import type { DBUser } from "../types";

export function useUserManagement() {
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usersApi.getUsers();
      if (res.success) {
        setUsers(res.data || []);
      } else {
        setError(res.message || "Gagal memuat data kasir.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      const res = await usersApi.toggleStatus(user.id, action);
      if (res.success) {
        fetchUsers();
      } else {
        alert(res.message || "Gagal memperbarui status user.");
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
      const res = await usersApi.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (res.success) {
        alert("Kasir baru berhasil ditambahkan!");
        setShowModal(false);
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setRole("kasir");
        fetchUsers();
      } else {
        setCreateError(res.message || "Gagal membuat kasir baru.");
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Gagal mendaftarkan user baru.");
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    currentUser,
    isHydrated,
    users,
    loading,
    error,
    showModal,
    setShowModal,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    createLoading,
    createError,
    fetchUsers,
    handleToggleStatus,
    handleCreateUser,
  };
}
