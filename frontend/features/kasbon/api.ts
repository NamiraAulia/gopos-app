import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { KasbonSummary, MemberKasbonDetail, RepayPayload, DebtLog } from "./types";

export const kasbonApi = {
  getSummary: async (): Promise<ApiResponse<KasbonSummary>> => {
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      let debtMap: Record<number, { total_debt: number; last_debt_at: string | null }> = {};
      try {
        const { data: logs, error: logErr } = await supabase
          .from("debt_logs")
          .select("member_id, type, amount, remaining_debt, created_at")
          .order("id", { ascending: true });

        if (!logErr && logs && logs.length > 0) {
          logs.forEach((log: any) => {
            if (!debtMap[log.member_id]) {
              debtMap[log.member_id] = { total_debt: 0, last_debt_at: null };
            }
            if (log.type === "kasbon") {
              debtMap[log.member_id].total_debt += log.amount;
              debtMap[log.member_id].last_debt_at = log.created_at;
            } else if (log.type === "repayment" || log.type === "void_debt") {
              debtMap[log.member_id].total_debt = Math.max(0, debtMap[log.member_id].total_debt - log.amount);
            }
            if (log.remaining_debt !== undefined && log.remaining_debt !== null) {
              debtMap[log.member_id].total_debt = log.remaining_debt;
            }
          });
        }
      } catch (e) {
        // Safe ignore
      }

      let totalReceivables = 0;
      let totalDebtors = 0;
      let overdueDebtors = 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      (members || []).forEach((m: any) => {
        const computed = debtMap[m.id];
        const debt = (m.total_debt !== undefined && m.total_debt !== null && m.total_debt > 0)
          ? m.total_debt
          : (computed?.total_debt || 0);

        const lastDebtAt = m.last_debt_at || computed?.last_debt_at;

        if (debt > 0) {
          totalReceivables += debt;
          totalDebtors += 1;
          if (lastDebtAt && new Date(lastDebtAt) < thirtyDaysAgo) {
            overdueDebtors += 1;
          }
        }
      });

      return {
        success: true,
        message: "Ringkasan kasbon",
        data: {
          total_receivables: totalReceivables,
          total_debtors: totalDebtors,
          overdue_debtors: overdueDebtors,
        },
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memuat ringkasan kasbon",
        data: { total_receivables: 0, total_debtors: 0, overdue_debtors: 0 },
        meta: null,
      };
    }
  },

  getMemberHistory: async (memberId: number): Promise<ApiResponse<MemberKasbonDetail>> => {
    try {
      const { data: member, error: mbrErr } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (mbrErr) throw mbrErr;

      let logsList: DebtLog[] = [];
      try {
        const { data: logs, error: logErr } = await supabase
          .from("debt_logs")
          .select("*")
          .eq("member_id", memberId)
          .order("id", { ascending: false });

        if (!logErr && logs) {
          logsList = logs as DebtLog[];
        }
      } catch (e) {
        console.warn("Notice: debt_logs fetch warning:", e);
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isOverdue =
        (member.total_debt || 0) > 0 &&
        member.last_debt_at &&
        new Date(member.last_debt_at) < thirtyDaysAgo;

      return {
        success: true,
        message: "Riwayat kasbon member",
        data: {
          member: member,
          is_overdue: !!isOverdue,
          logs: logsList,
        },
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memuat riwayat kasbon member",
        data: null as any,
        meta: null,
      };
    }
  },

  processRepayment: async (memberId: number, payload: RepayPayload): Promise<ApiResponse<any>> => {
    try {
      const { data: member, error: mbrErr } = await supabase
        .from("members")
        .select("total_debt, name")
        .eq("id", memberId)
        .single();

      if (mbrErr) throw mbrErr;

      const currentDebt = member.total_debt || 0;
      if (currentDebt <= 0) {
        return { success: false, message: "Member tidak memiliki utang aktif", data: null, meta: null };
      }

      if (payload.amount_paid > currentDebt) {
        return {
          success: false,
          message: `Nominal cicilan (Rp ${payload.amount_paid.toLocaleString("id-ID")}) melebihi utang saat ini (Rp ${currentDebt.toLocaleString("id-ID")})`,
          data: null,
          meta: null,
        };
      }

      const newTotalDebt = currentDebt - payload.amount_paid;

      await supabase
        .from("members")
        .update({ total_debt: newTotalDebt })
        .eq("id", memberId);

      const notes =
        payload.notes ||
        (newTotalDebt === 0
          ? "Pelunasan Utang Kasbon (LUNAS)"
          : `Pembayaran Cicilan Utang Kasbon (Sisa Utang: Rp ${newTotalDebt.toLocaleString("id-ID")})`);

      const { data: newLog, error: logErr } = await supabase
        .from("debt_logs")
        .insert({
          member_id: memberId,
          type: "repayment",
          amount: payload.amount_paid,
          remaining_debt: newTotalDebt,
          payment_method: payload.payment_method,
          notes: notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (logErr) throw logErr;

      // Updating shift cash expected if paid in CASH
      if (payload.payment_method === "cash") {
        const userStr = localStorage.getItem("gopos-user");
        let userId = 1;
        if (userStr) {
          try {
            userId = JSON.parse(userStr).id;
          } catch (e) {}
        }

        const { data: activeShift } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "open")
          .maybeSingle();

        if (activeShift) {
          await supabase
            .from("shifts")
            .update({
              total_cash_expected: activeShift.total_cash_expected + payload.amount_paid,
            })
            .eq("id", activeShift.id);
        }
      }

      return {
        success: true,
        message: "Pembayaran cicilan kasbon berhasil diproses",
        data: {
          remaining_debt: newTotalDebt,
          log: newLog,
        },
        meta: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memproses pembayaran kasbon",
        data: null,
        meta: null,
      };
    }
  },
};
