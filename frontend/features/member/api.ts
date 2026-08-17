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
    // 1. Primary: Try calling Go Backend API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch("http://localhost:8080/api/v1/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const list = Array.isArray(json.data) ? json.data : (json.data.members || []);
            return {
              success: true,
              message: "Daftar member berhasil diambil",
              data: list as Member[],
              meta: null,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Gagal fetch members dari Backend Go, beralih ke Supabase fallback:", e);
    }

    // 2. Fallback: Supabase Client
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
    // 1. Primary: Try calling Go Backend API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch("http://localhost:8080/api/v1/members", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          return {
            success: true,
            message: json.message || "Member baru berhasil didaftarkan",
            data: json.data as Member,
            meta: null,
          };
        } else if (json.message) {
          return {
            success: false,
            message: json.message,
            data: null,
            meta: null,
          };
        }
      }
    } catch (e) {
      console.warn("Gagal create member ke Backend Go, beralih ke Supabase fallback:", e);
    }

    // 2. Fallback: Supabase Client
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
    // 1. Primary: Try calling Go Backend API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`http://localhost:8080/api/v1/members/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          return {
            success: true,
            message: json.message || "Member berhasil diperbarui",
            data: json.data as Member,
            meta: null,
          };
        } else if (json.message) {
          return {
            success: false,
            message: json.message,
            data: null,
            meta: null,
          };
        }
      }
    } catch (e) {
      console.warn("Gagal edit member ke Backend Go, beralih ke Supabase fallback:", e);
    }

    // 2. Fallback: Supabase Client
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
    // 1. Primary: Try calling Go Backend API
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`http://localhost:8080/api/v1/members/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          return {
            success: true,
            message: json.message || "Member berhasil dinonaktifkan",
            data: json.data,
            meta: null,
          };
        }
      }
    } catch (e) {
      console.warn("Gagal delete member di Backend Go, beralih ke Supabase fallback:", e);
    }

    // 2. Fallback: Supabase Client
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
