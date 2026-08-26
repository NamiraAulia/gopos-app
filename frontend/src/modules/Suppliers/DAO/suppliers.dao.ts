import { supabase } from "@/helper/supabaseClient";

export interface SalesContactDAO {
  id?: number;
  supplier_id?: number;
  sales_name: string;
  phone_number: string;
  category: string;
  visit_day: string;
  visit_type: "taking_order" | "billing" | "both";
  notes?: string;
  supplier_name?: string;
  supplier?: { id: number; name: string };
}

export interface SupplierDAO {
  id: number;
  name: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  sales_contacts?: SalesContactDAO[];
  created_at?: string;
}

export interface TodayScheduleDataDAO {
  day: string;
  taking_order: SalesContactDAO[];
  billing: SalesContactDAO[];
  total_sales: number;
}

export const supplierDAO = {
  async getSuppliers(search?: string) {
    let query = supabase.from("suppliers").select("*, sales_contacts:supplier_sales(*)").eq("is_active", true).order("name", { ascending: true });
    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
    }
    const { data, error } = await query;
    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: (data as SupplierDAO[]) || [] };
  },
  async getTodaySchedule(engDay: string) {
    const { data, error } = await supabase.from("supplier_sales").select("*, supplier:suppliers(id, name)").eq("visit_day", engDay);
    if (error) return { success: false, message: error.message, data: null };
    const contacts = (data || []).map((c: any) => ({
      ...c,
      supplier_name: c.supplier?.name || "",
    }));
    return {
      success: true,
      data: {
        day: engDay,
        taking_order: contacts.filter((c: any) => c.visit_type === "taking_order" || c.visit_type === "both"),
        billing: contacts.filter((c: any) => c.visit_type === "billing" || c.visit_type === "both"),
        total_sales: contacts.length,
      },
    };
  },
  async createSupplier(payload: any) {
    const { data: sup, error: supErr } = await supabase
      .from("suppliers")
      .insert({ name: payload.name, address: payload.address, notes: payload.notes, is_active: true })
      .select()
      .single();

    if (supErr) return { success: false, message: supErr.message };

    if (payload.sales_contacts && payload.sales_contacts.length > 0) {
      const contactsToInsert = payload.sales_contacts.map((c: any) => ({
        supplier_id: sup.id,
        sales_name: c.sales_name,
        phone_number: c.phone_number,
        category: c.category,
        visit_day: c.visit_day,
        visit_type: c.visit_type,
      }));
      await supabase.from("supplier_sales").insert(contactsToInsert);
    }
    return { success: true, message: "Distributor berhasil ditambahkan." };
  },
  async editSupplier(id: number, payload: any) {
    const { error: supErr } = await supabase
      .from("suppliers")
      .update({ name: payload.name, address: payload.address, notes: payload.notes })
      .eq("id", id);

    if (supErr) return { success: false, message: supErr.message };

    await supabase.from("supplier_sales").delete().eq("supplier_id", id);
    if (payload.sales_contacts && payload.sales_contacts.length > 0) {
      const contactsToInsert = payload.sales_contacts.map((c: any) => ({
        supplier_id: id,
        sales_name: c.sales_name,
        phone_number: c.phone_number,
        category: c.category,
        visit_day: c.visit_day,
        visit_type: c.visit_type,
      }));
      await supabase.from("supplier_sales").insert(contactsToInsert);
    }
    return { success: true, message: "Distributor berhasil diperbarui." };
  },
  async deleteSupplier(id: number) {
    const { error } = await supabase.from("suppliers").update({ is_active: false }).eq("id", id);
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Distributor berhasil dinonaktifkan." };
  },
};
