import { supabase } from "@/helper/supabaseClient";
import type { MemberDTO } from "@/modules/Member/DTO/member.dto";
import type { KasbonSummaryDAO } from "@/modules/Kasbon/DAO/kasbon.dao";
import type { RepayKasbonDTO } from "@/modules/Kasbon/DTO/kasbon.dto";

export async function fetchKasbonMembers(): Promise<{ members: MemberDTO[]; summary: KasbonSummaryDAO }> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  const members = (data as MemberDTO[]) || [];
  const total_receivables = members.reduce((acc, m) => acc + (m.total_debt || 0), 0);
  const debtors = members.filter((m) => (m.total_debt || 0) > 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const overdue_debtors = debtors.filter(
    (m) => m.last_debt_at && new Date(m.last_debt_at) < thirtyDaysAgo
  ).length;

  return {
    members,
    summary: {
      total_receivables,
      total_debtors: debtors.length,
      overdue_debtors,
    },
  };
}

export async function recordRepayment(payload: RepayKasbonDTO): Promise<{ success: boolean }> {
  const { memberId, amount, paymentMethod, notes } = payload;

  const { data: member, error: fetchErr } = await supabase
    .from("members")
    .select("total_debt")
    .eq("id", memberId)
    .single();

  if (fetchErr) throw fetchErr;

  const currentDebt = member?.total_debt || 0;
  const newDebt = Math.max(0, currentDebt - amount);

  // Insert debt log entry
  const { error: logErr } = await supabase.from("debt_logs").insert({
    member_id: memberId,
    type: "repayment",
    amount: amount,
    remaining_debt: newDebt,
    payment_method: paymentMethod,
    notes: notes || "Pembayaran cicilan kasbon",
    created_at: new Date().toISOString(),
  });

  if (logErr) throw logErr;

  // Update member debt
  const { error: updateErr } = await supabase
    .from("members")
    .update({ total_debt: newDebt })
    .eq("id", memberId);

  if (updateErr) throw updateErr;

  // If payment method is cash, update active cashier shift total_cash_expected
  if (paymentMethod === "cash") {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: activeShift } = await supabase
          .from("shifts")
          .select("id, total_cash_expected")
          .eq("user_id", user.id)
          .eq("status", "open")
          .maybeSingle();

        if (activeShift) {
          await supabase
            .from("shifts")
            .update({
              total_cash_expected: (activeShift.total_cash_expected || 0) + amount,
            })
            .eq("id", activeShift.id);
        }
      }
    } catch (shiftErr) {
      console.warn("Gagal mengupdate saldo shift untuk pelunasan kasbon tunai:", shiftErr);
    }
  }

  return { success: true };
}
