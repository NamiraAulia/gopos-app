import { supabase } from "@/helper/supabaseClient";
import type {
  MemberDTO,
  CreateMemberPayloadDTO,
  DebtLogDTO,
  RepayDebtPayloadDTO,
  MemberCsvItemDTO,
} from "@/modules/Member/DTO/member.dto";

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
      name: payload.name.trim(),
      phone: payload.phone ? payload.phone.trim() : "",
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
      name: payload.name.trim(),
      phone: payload.phone ? payload.phone.trim() : "",
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

export async function fetchDebtLogs(memberId: number): Promise<DebtLogDTO[]> {
  const { data, error } = await supabase
    .from("debt_logs")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DebtLogDTO[]) || [];
}

export async function repayDebt(
  memberId: number,
  payload: RepayDebtPayloadDTO
): Promise<{ success: boolean; remainingDebt: number }> {
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("name, total_debt")
    .eq("id", memberId)
    .single();

  if (memberErr || !member) throw new Error("Member tidak ditemukan.");

  const currentDebt = member.total_debt || 0;
  const payNum = Number(payload.amount);
  const newDebt = Math.max(0, currentDebt - payNum);

  const { error: updateErr } = await supabase
    .from("members")
    .update({ total_debt: newDebt })
    .eq("id", memberId);

  if (updateErr) throw updateErr;

  const { error: logErr } = await supabase.from("debt_logs").insert({
    member_id: memberId,
    type: "repayment",
    amount: payNum,
    remaining_debt: newDebt,
    payment_method: payload.payment_method || "cash",
    notes: payload.notes || `Pelunasan kasbon Rp ${payNum.toLocaleString("id-ID")}`,
    created_at: new Date().toISOString(),
  });

  if (logErr) throw logErr;

  return { success: true, remainingDebt: newDebt };
}

export async function importMembersCsv(items: MemberCsvItemDTO[]): Promise<{ count: number }> {
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
  return { count: data?.length || items.length };
}

export function exportMembersCsv(members: MemberDTO[]): void {
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
}
