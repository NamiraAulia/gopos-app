import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { Supplier, CreateSupplierPayload, TodayScheduleData, TodayScheduleItem } from "./types";

export const supplierApi = {
  getSuppliers: async (search?: string): Promise<ApiResponse<Supplier[]>> => {
    try {
      let query = supabase.from("suppliers").select("*, sales_contacts(*)").eq("is_active", true).order("name", { ascending: true });
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return {
        success: true,
        message: "Daftar distributor berhasil diambil",
        data: (data as Supplier[]) || [],
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memuat data distributor",
        data: [],
        meta: null,
      };
    }
  },

  getTodaySchedule: async (day?: string): Promise<ApiResponse<TodayScheduleData>> => {
    try {
      const currentDay = day || new Date().toLocaleDateString("en-US", { weekday: "long" });

      // Query sales_contacts yang visit_day-nya mengandung hari ini
      const { data: contacts, error } = await supabase
        .from("sales_contacts")
        .select("*, supplier:suppliers(id, name, address)")
        .eq("is_active", true)
        .ilike("visit_day", `%${currentDay}%`);

      if (error) throw error;

      const takingOrder: TodayScheduleItem[] = [];
      const billing: TodayScheduleItem[] = [];

      (contacts || []).forEach((contact: any) => {
        const item: TodayScheduleItem = {
          supplier_id: contact.supplier?.id,
          supplier_name: contact.supplier?.name || "",
          sales_name: contact.sales_name,
          category: contact.category,
          phone_number: contact.phone_number,
          visit_day: contact.visit_day || "",
          visit_type: contact.visit_type || "both",
          notes: contact.notes,
        };

        if (contact.visit_type === "taking_order" || contact.visit_type === "both") {
          takingOrder.push(item);
        }
        if (contact.visit_type === "billing" || contact.visit_type === "both") {
          billing.push(item);
        }
      });

      return {
        success: true,
        message: `Jadwal kunjungan hari ${currentDay}`,
        data: {
          day: currentDay,
          taking_order: takingOrder,
          billing: billing,
          total_sales: (contacts || []).length,
        },
        meta: null,
      };
    } catch (err: any) {
      const currentDay = day || new Date().toLocaleDateString("en-US", { weekday: "long" });
      return {
        success: true,
        message: `Jadwal kunjungan hari ${currentDay}`,
        data: {
          day: currentDay,
          taking_order: [],
          billing: [],
          total_sales: 0,
        },
        meta: null,
      };
    }
  },

  createSupplier: async (payload: CreateSupplierPayload): Promise<ApiResponse<Supplier>> => {
    try {
      const { data: sup, error: supErr } = await supabase
        .from("suppliers")
        .insert({
          name: payload.name,
          address: payload.address,
          notes: payload.notes,
          is_active: true,
        })
        .select()
        .single();

      if (supErr) throw supErr;

      if (payload.sales_contacts && payload.sales_contacts.length > 0) {
        const salesData = payload.sales_contacts.map((s) => ({
          supplier_id: sup.id,
          sales_name: s.sales_name,
          category: s.category,
          phone_number: s.phone_number,
          visit_day: s.visit_day,
          visit_type: s.visit_type || "both",
          notes: s.notes,
          is_active: true,
        }));
        await supabase.from("sales_contacts").insert(salesData);
      }

      return {
        success: true,
        message: "Distributor berhasil ditambahkan",
        data: sup as Supplier,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal menambah distributor",
        data: null,
        meta: null,
      };
    }
  },

  editSupplier: async (id: number, payload: CreateSupplierPayload): Promise<ApiResponse<Supplier>> => {
    try {
      const { data: updated, error: updateErr } = await supabase
        .from("suppliers")
        .update({
          name: payload.name,
          address: payload.address,
          notes: payload.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Update sales contacts: delete old ones and insert new ones
      if (payload.sales_contacts) {
        await supabase
          .from("sales_contacts")
          .delete()
          .eq("supplier_id", id);

        if (payload.sales_contacts.length > 0) {
          const salesData = payload.sales_contacts.map((s) => ({
            supplier_id: id,
            sales_name: s.sales_name,
            category: s.category,
            phone_number: s.phone_number,
            visit_day: s.visit_day,
            visit_type: s.visit_type || "both",
            notes: s.notes,
            is_active: true,
          }));
          await supabase.from("sales_contacts").insert(salesData);
        }
      }

      return {
        success: true,
        message: "Distributor berhasil diperbarui",
        data: updated as Supplier,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal mengupdate distributor",
        data: null,
        meta: null,
      };
    }
  },

  deleteSupplier: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: "Distributor berhasil dinonaktifkan",
        data: data,
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal menghapus distributor",
        data: null,
        meta: null,
      };
    }
  },
};
