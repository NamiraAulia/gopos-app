import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { Member, CreateMemberPayload } from "./types";

const generateMemberCode = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const uniqueID = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `MBR-${dateStr}-${uniqueID}`;
};

export const memberApi = {
  getMembers: async (): Promise<ApiResponse<Member[]>> => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return {
        success: true,
        message: "Daftar member berhasil diambil",
        data: (data as Member[]) || [],
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memuat data member",
        data: [],
        meta: null,
      };
    }
  },

  createMember: async (payload: CreateMemberPayload): Promise<ApiResponse<Member>> => {
    try {
      const { data, error } = await supabase
        .from("members")
        .insert({
          member_code: generateMemberCode(),
          name: payload.name,
          phone: payload.phone,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        success: true,
        message: "Member baru berhasil didaftarkan",
        data: data as Member,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal membuat member baru",
        data: null,
        meta: null,
      };
    }
  },

  editMember: async (id: number, payload: CreateMemberPayload): Promise<ApiResponse<Member>> => {
    try {
      const { data, error } = await supabase
        .from("members")
        .update({
          name: payload.name,
          phone: payload.phone,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        success: true,
        message: "Member berhasil diperbarui",
        data: data as Member,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memperbarui member",
        data: null,
        meta: null,
      };
    }
  },

  deleteMember: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const { data, error } = await supabase
        .from("members")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        success: true,
        message: "Member berhasil dinonaktifkan",
        data: data,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal menonaktifkan member",
        data: null,
        meta: null,
      };
    }
  },
};
