import { supabase } from "@/helper/supabaseClient";

export async function fetchCashSummaryData() {
  const { data: activeShift } = await supabase
    .from("shifts")
    .select("*")
    .eq("status", "open")
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  let trxQuery = supabase
    .from("transactions")
    .select("*, items:transaction_items(*)")
    .order("created_at", { ascending: false });

  let expQuery = supabase
    .from("expenses")
    .select(`*, user:users(id, name, email)`)
    .order("created_at", { ascending: false });

  if (activeShift && activeShift.start_time) {
    trxQuery = trxQuery.gte("created_at", activeShift.start_time);
    expQuery = expQuery.gte("created_at", activeShift.start_time);
  }

  const [resTrx, resExp] = await Promise.all([trxQuery, expQuery]);

  return {
    transactions: resTrx.data || [],
    expenses: resExp.data || [],
    activeShift: activeShift || null,
  };
}
