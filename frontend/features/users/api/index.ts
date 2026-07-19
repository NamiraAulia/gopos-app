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
      // 1. Sign up credential validation
      if (data.email && data.password) {
        const { error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (authError) throw authError;
      }

      // 2. Insert profile into the users table
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          name: data.name,
          email: data.email,
          role: data.role || "kasir",
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: "User berhasil dibuat",
        data: newUser,
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
