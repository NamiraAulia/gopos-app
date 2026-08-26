"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, createUser, toggleUserStatus } from "@/service/users.service";
import { useUserStore } from "../Store/useUserStore";
import { validateCreateUser } from "../Validation/users.validation";
import { UsersView } from "../Component/UsersView";
import { useAuthStore } from "@/store/authStore";
import type { UserDAO } from "../DAO/users.dao";
import { useState } from "react";

export default function UsersContainer() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [createError, setCreateError] = useState("");

  const {
    isAddModalOpen,
    setIsAddModalOpen,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    resetForm,
  } = useUserStore();

  // Query: Fetch Users list
  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  // Mutation: Create User
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      resetForm();
      setIsAddModalOpen(false);
      setCreateError("");
    },
    onError: (err: any) => {
      setCreateError(err.message || "Gagal mendaftarkan pengguna.");
    },
  });

  // Mutation: Toggle Status (Activate / Deactivate)
  const toggleStatusMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      alert(err.message || "Gagal memperbarui status pengguna.");
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    const payload = { name, email, password, role };
    const validation = validateCreateUser(payload);
    if (!validation.valid) {
      setCreateError(validation.error || "Data form tidak valid.");
      return;
    }

    createUserMutation.mutate(payload);
  };

  const handleToggleStatus = (u: UserDAO) => {
    const action = u.is_active ? "deactivate" : "activate";
    toggleStatusMutation.mutate({ id: u.id, action });
  };

  return (
    <UsersView
      currentUser={currentUser}
      users={users}
      loading={isLoading}
      error={isError ? (error as any)?.message || "Gagal memuat pengguna" : ""}
      isAddModalOpen={isAddModalOpen}
      setIsAddModalOpen={setIsAddModalOpen}
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      role={role}
      setRole={setRole}
      createLoading={createUserMutation.isPending}
      createError={createError}
      handleToggleStatus={handleToggleStatus}
      handleCreateUser={handleCreateUser}
    />
  );
}
