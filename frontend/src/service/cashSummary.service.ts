import { supabase } from "@/helper/supabaseClient";

export async function fetchCashSummaryData() {
  const [resTrx, resExp, resShift] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select(`*, user:users(id, name, email)`)
      .order("created_at", { ascending: false }),
    supabase
      .from("cashier_shifts")
      .select("*")
      .eq("status", "open")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    transactions: resTrx.data || [],
    expenses: resExp.data || [],
    activeShift: resShift.data || null,
  };
}
