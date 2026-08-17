import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { Supplier, CreateSupplierPayload, TodayScheduleData, TodayScheduleItem } from "./types";

export const supplierApi = {
  getSuppliers: async (search?: string): Promise<ApiResponse<Supplier[]>> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const url = search
          ? `http://localhost:8080/api/v1/suppliers?search=${encodeURIComponent(search)}`
          : "http://localhost:8080/api/v1/suppliers";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const list = Array.isArray(json.data) ? json.data : (json.data.suppliers || []);
            return {
              success: true,
              message: "Daftar distributor berhasil diambil",
              data: list as Supplier[],
              meta: null,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Gagal fetch suppliers dari Backend Go, beralih ke Supabase fallback:", e);
    }

    // Fallback: Supabase Client
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const url = day
          ? `http://localhost:8080/api/v1/suppliers/schedule?day=${encodeURIComponent(day)}`
          : "http://localhost:8080/api/v1/suppliers/schedule";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json;
          }
        }
      }
    } catch (e) {
      console.warn("Gagal fetch schedule dari Backend Go, beralih ke Supabase fallback:", e);
    }

    // Fallback default empty
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
  },

  createSupplier: async (payload: CreateSupplierPayload): Promise<ApiResponse<Supplier>> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch("http://localhost:8080/api/v1/suppliers", {
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
            message: json.message || "Distributor berhasil ditambahkan",
            data: json.data as Supplier,
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
      console.warn("Gagal create supplier ke Backend Go, beralih ke Supabase fallback:", e);
    }

    // Fallback: Supabase
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
        await supabase.from("supplier_sales").insert(salesData);
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`http://localhost:8080/api/v1/suppliers/${id}`, {
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
            message: json.message || "Distributor berhasil diperbarui",
            data: json.data as Supplier,
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
      console.warn("Gagal edit supplier di Backend Go:", e);
    }

    return {
      success: false,
      message: "Gagal mengupdate distributor",
      data: null,
      meta: null,
    };
  },

  deleteSupplier: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`http://localhost:8080/api/v1/suppliers/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          return {
            success: true,
            message: json.message || "Distributor berhasil dinonaktifkan",
            data: json.data,
            meta: null,
          };
        }
      }
    } catch (e) {
      console.warn("Gagal delete supplier di Backend Go:", e);
    }

    return {
      success: false,
      message: "Gagal menghapus distributor",
      data: null,
      meta: null,
    };
  },
};
