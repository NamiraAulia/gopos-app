import { supabase } from "@/helper/supabaseClient";
import type { SupplierDAO, TodayScheduleDataDAO } from "@/modules/Suppliers/DAO/suppliers.dao";

export async function fetchSuppliers(search?: string): Promise<SupplierDAO[]> {
  let query = supabase
    .from("suppliers")
    .select("*, sales_contacts:supplier_sales(*)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as SupplierDAO[]) || [];
}

export async function fetchTodaySchedule(engDay: string): Promise<TodayScheduleDataDAO> {
  const { data, error } = await supabase
    .from("supplier_sales")
    .select("*, supplier:suppliers(id, name)")
    .eq("visit_day", engDay);

  if (error) throw error;

  const contacts = data || [];
  const takingOrder = contacts.filter((c) => c.visit_type === "taking_order" || c.visit_type === "both");
  const billing = contacts.filter((c) => c.visit_type === "billing" || c.visit_type === "both");

  return {
    day: engDay,
    taking_order: takingOrder,
    billing: billing,
    total_sales: contacts.length,
  };
}

export async function deleteSupplier(id: number): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}
