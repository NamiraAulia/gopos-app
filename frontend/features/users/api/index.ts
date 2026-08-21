import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { DBUser } from "../types";

export const usersApi = {
  getUsers: async (): Promise<ApiResponse<DBUser[]>> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      return {
        success: true,
        message: "List semua user",
        data: (data as DBUser[]) || [],
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memuat data user",
        data: [],
        meta: null,
      };
    }
  },

  toggleStatus: async (id: number, action: "activate" | "deactivate"): Promise<ApiResponse<unknown>> => {
    try {
      const isActive = action === "activate";
      const { data, error } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `User berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"}`,
        data: data,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal mengubah status user",
        data: null,
        meta: null,
      };
    }
  },

  createUser: async (data: Partial<DBUser> & { password?: string }): Promise<ApiResponse<unknown>> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || localStorage.getItem("token") || "";

      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role || "kasir",
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Gagal mendaftarkan user kasir baru");
      }

      return {
        success: true,
        message: resData.message || "User berhasil dibuat",
        data: resData.data,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal membuat user",
        data: null,
        meta: null,
      };
    }
  },
};
