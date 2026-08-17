import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse } from "@/types/api";
import type { KasbonSummary, MemberKasbonDetail, RepayPayload, DebtLog } from "./types";

export const kasbonApi = {
  getSummary: async (): Promise<ApiResponse<KasbonSummary>> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch("http://localhost:8080/api/v1/kasbon/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json;
        }
      }

      // Supabase Fallback
      const { data: members, error } = await supabase
        .from("members")
        .select("total_debt, last_debt_at")
        .eq("is_active", true);

      if (error) throw error;

      let totalReceivables = 0;
      let totalDebtors = 0;
      let overdueDebtors = 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      (members || []).forEach((m: any) => {
        const debt = m.total_debt || 0;
        if (debt > 0) {
          totalReceivables += debt;
          totalDebtors += 1;
          if (m.last_debt_at && new Date(m.last_debt_at) < thirtyDaysAgo) {
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`http://localhost:8080/api/v1/members/${memberId}/kasbon-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json;
        }
      }

      // Supabase Fallback
      const { data: member, error: mbrErr } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (mbrErr) throw mbrErr;

      const { data: logs, error: logErr } = await supabase
        .from("debt_logs")
        .select("*")
        .eq("member_id", memberId)
        .order("id", { ascending: false });

      if (logErr) throw logErr;

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
          logs: (logs as DebtLog[]) || [],
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`http://localhost:8080/api/v1/members/${memberId}/repay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json;
        }
      }

      // Supabase Fallback
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
