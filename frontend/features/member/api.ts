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
      const { data: membersData, error } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      const membersWithDebt: Member[] = (membersData || []).map((m: any) => ({
        ...m,
        total_debt: m.total_debt || 0,
        last_debt_at: m.last_debt_at || undefined,
      }));

      return {
        success: true,
        message: "Daftar member berhasil diambil",
        data: membersWithDebt,
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
      const { data: member, error: fetchErr } = await supabase
        .from("members")
        .select("name, total_debt")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      const debt = member?.total_debt || 0;
      if (debt > 0) {
        return {
          success: false,
          message: `Gagal menghapus: Member "${member.name}" masih memiliki sisa utang kasbon sebesar Rp ${debt.toLocaleString("id-ID")}. Pelunasan utang wajib dilakukan terlebih dahulu.`,
          data: null,
          meta: null,
        };
      }

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

  exportMembersCsv: (members: Member[]) => {
    let csv = "ID,Kode Member,Nama Lengkap,No HP,Total Utang,Status,Tanggal Daftar\n";
    members.forEach((m) => {
      const statusStr = m.is_active ? "Aktif" : "Nonaktif";
      const code = (m.member_code || "").replace(/"/g, '""');
      const name = (m.name || "").replace(/"/g, '""');
      const phone = (m.phone || "").replace(/"/g, '""');
      const debt = m.total_debt || 0;
      const date = m.created_at || "";
      csv += `${m.id},"${code}","${name}","${phone}",${debt},"${statusStr}","${date}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daftar_member_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importMembersCsv: async (items: { name: string; phone?: string }[]): Promise<ApiResponse<any>> => {
    try {
      const payload = items.map((item) => ({
        member_code: generateMemberCode(),
        name: item.name.trim(),
        phone: item.phone ? item.phone.trim() : "",
        is_active: true,
      }));

      const { data, error } = await supabase
        .from("members")
        .insert(payload)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `Berhasil mengimpor ${data?.length || items.length} member.`,
        data: data,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memproses import member",
        data: null,
        meta: null,
      };
    }
  },
};
