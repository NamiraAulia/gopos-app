import { supabase } from "@/helper/supabaseClient";
import type { ExpenseDAO } from "@/modules/Expenses/DAO/expenses.dao";
import type { CreateExpenseDTO } from "@/modules/Expenses/DTO/expenses.dto";

export async function fetchExpenses(): Promise<ExpenseDAO[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, user:users(id, name, email)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ExpenseDAO[]) || [];
}

export async function createExpense(payload: CreateExpenseDTO): Promise<ExpenseDAO> {
  const { data: authUser } = await supabase.auth.getUser();
  let userId: number | undefined;
  if (authUser.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", authUser.user.email)
      .single();
    if (profile) userId = profile.id;
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      name: payload.name,
      amount: payload.amount,
      category: payload.category,
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as ExpenseDAO;
}
