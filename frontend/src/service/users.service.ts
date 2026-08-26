import { supabase } from "@/helper/supabaseClient";
import type { UserDAO } from "@/modules/Users/DAO/users.dao";
import type { CreateUserDTO, ToggleUserStatusDTO } from "@/modules/Users/DTO/users.dto";

export async function fetchUsers(): Promise<UserDAO[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active")

  if (error) throw error;
  return (data as UserDAO[]) || [];
}

export async function createUser(payload: CreateUserDTO): Promise<UserDAO> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserDAO;
}

export async function toggleUserStatus(payload: ToggleUserStatusDTO): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("users")
    .update({ is_active: payload.action === "activate" })
    .eq("id", payload.id);

  if (error) throw error;
  return { success: true };
}
