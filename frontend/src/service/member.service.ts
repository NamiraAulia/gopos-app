import { supabase } from "@/helper/supabaseClient";
import type { MemberDTO, CreateMemberPayloadDTO } from "@/modules/Member/DTO/member.dto";

const generateMemberCode = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const uniqueID = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `MBR-${dateStr}-${uniqueID}`;
};

export async function fetchMembers(): Promise<MemberDTO[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as MemberDTO[]) || [];
}

export async function createMember(payload: CreateMemberPayloadDTO): Promise<MemberDTO> {
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
  return data as MemberDTO;
}

export async function editMember(id: number, payload: CreateMemberPayloadDTO): Promise<MemberDTO> {
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
  return data as MemberDTO;
}

export async function deleteMember(id: number): Promise<{ success: boolean }> {
  const { data: member, error: fetchErr } = await supabase
    .from("members")
    .select("name, total_debt")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;

  const debt = member?.total_debt || 0;
  if (debt > 0) {
    throw new Error(
      `Gagal menghapus: Member "${member.name}" masih memiliki sisa utang kasbon sebesar Rp ${debt.toLocaleString("id-ID")}. Pelunasan utang wajib dilakukan terlebih dahulu.`
    );
  }

  const { error } = await supabase
    .from("members")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}
