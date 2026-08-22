import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse, Product } from "@/types/api";

export interface CheckoutItemPayload {
  product_id: number;
  qty: number;
  unit_price: number;
  unit_choice: "small" | "big";
}

export interface CheckoutPayload {
  items: CheckoutItemPayload[];
  payment_method: "cash" | "qris" | "transfer" | "kasbon";
  amount_paid: number;
  member_id?: number;
  discount_amount?: number;
  idempotency_key?: string;
}

export interface TransactionResult {
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount?: number;
  date?: string;
  items?: Array<{
    id: number;
    product_name: string;
    qty: number;
    subtotal: number;
  }>;
}

export interface ShiftData {
  id: number;
  start_cash: number;
  total_cash_expected: number;
  total_refunded_cash: number;
  start_time: string;
  end_time: string | null;
  status: "open" | "closed";
  total_cash_actual?: number;
  cash_difference?: number;
}

export interface Transaction {
  id: number;
  transaction_code: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  status: string;
  created_at: string;
  items?: any[];
  discount_amount?: number;
  member?: {
    id: number;
    name: string;
    phone?: string;
    member_code?: string;
  } | null;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  created_at: string;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const getCurrentProfileId = async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("User tidak terautentikasi.");

  const { data: profile, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", authUser.email)
    .single();

  if (error || !profile) throw new Error("Profil pengguna tidak ditemukan.");
  return profile.id;
};

export const cashierApi = {
  getMembers: async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  },

  getProducts: async (search?: string) => {
    let query = supabase.from("products").select("*").eq("is_active", true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      success: true,
      data: {
        products: data || [],
        data: data || [],
      }
    };
  },

  getProductByBarcode: async (barcode: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data: data as Product | null };
  },

  getActiveShift: async () => {
    try {
      const userId = await getCurrentProfileId();
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "open")
        .maybeSingle();

      if (error) throw error;
      return { success: true, data: data as ShiftData };
    } catch (err) {
      return { success: false, data: null as any };
    }
  },

  openShift: async (startCash: number) => {
    const userId = await getCurrentProfileId();
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        user_id: userId,
        start_cash: startCash,
        total_cash_expected: startCash,
        start_time: new Date().toISOString(),
        status: "open",
        total_refunded_cash: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message?.includes("idx_shifts_user_open_unique")) {
        throw new Error("Shift sudah aktif untuk akun Anda. Silakan muat ulang (refresh) halaman.");
      }
      throw error;
    }
    return { success: true, data: data as ShiftData };
  },

  closeShift: async (totalCashActual: number) => {
    const userId = await getCurrentProfileId();

    const { data: activeShift, error: findError } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .single();

    if (findError || !activeShift) throw new Error("Tidak ada shift aktif yang berjalan.");

    const difference = totalCashActual - activeShift.total_cash_expected;

    const { data, error } = await supabase
      .from("shifts")
      .update({
        total_cash_actual: totalCashActual,
        cash_difference: difference,
        status: "closed",
        end_time: new Date().toISOString(),
      })
      .eq("id", activeShift.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: "Shift kasir berhasil ditutup", data: data as ShiftData };
  },

  getTransactions: async (limit: number = 100) => {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        member:members(id, name, phone, member_code)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data: (data as Transaction[]) || [] };
  },

  getExpenses: async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        user:users(id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: (data as Expense[]) || [] };
  },

  createExpense: async (payload: { name: string; amount: number; category: string }) => {
    const userId = await getCurrentProfileId();

    const { data: expense, error: expError } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        name: payload.name,
        amount: payload.amount,
        category: payload.category,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (expError) throw expError;

    if (payload.category.toLowerCase() === "operasional" || payload.category.toLowerCase() === "lainnya") {
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
            total_cash_expected: activeShift.total_cash_expected - payload.amount,
          })
          .eq("id", activeShift.id);
      }
    }

    return { success: true, data: expense as Expense };
  },

  checkout: async (payload: CheckoutPayload) => {
    const userId = await getCurrentProfileId();

    const totalAmount = payload.items.reduce((sum, item) => sum + (item.unit_price * item.qty), 0) - (payload.discount_amount || 0);
    const changeAmount = payload.amount_paid - totalAmount;

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        transaction_code: "TX-" + Date.now(),
        user_id: userId,
        total_amount: totalAmount,
        payment_method: payload.payment_method,
        amount_paid: payload.amount_paid,
        change_amount: changeAmount,
        status: "completed",
        member_id: payload.member_id || null,
        discount_amount: payload.discount_amount || 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) throw txError;

    const itemsResult: any[] = [];

    for (const item of payload.items) {
      const { data: product } = await supabase
        .from("products")
        .select("name, stock, conversion")
        .eq("id", item.product_id)
        .single();

      if (product) {
        const subtotal = Math.round(item.unit_price * item.qty);
        await supabase.from("transaction_items").insert({
          transaction_id: tx.id,
          product_id: item.product_id,
          product_name: product.name,
          unit_price: item.unit_price,
          qty: item.qty,
          subtotal: subtotal,
          conversion_used: item.unit_choice === "big" ? product.conversion : 1,
          unit_choice: item.unit_choice,
        });

        itemsResult.push({
          id: item.product_id,
          product_name: product.name,
          qty: item.qty,
          subtotal: subtotal,
        });

        const qtyDeducted = item.unit_choice === "big" ? (item.qty * product.conversion) : item.qty;
        const { error: rpcError } = await supabase.rpc("adjust_product_stock", {
          product_id: item.product_id,
          qty_change: -qtyDeducted,
        });
        if (rpcError) console.warn("Stock RPC adjust error:", rpcError);
      }
    }

    if (payload.payment_method === "cash") {
      try {
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
              total_cash_expected: activeShift.total_cash_expected + totalAmount,
            })
            .eq("id", activeShift.id);
        }
      } catch (err) {
        console.warn("Shift update error:", err);
      }
    } else if (payload.payment_method === "kasbon" && payload.member_id) {
      const dpAmount = payload.amount_paid > 0 ? payload.amount_paid : 0;
      const masukUtang = totalAmount - dpAmount;

      if (dpAmount > 0) {
        try {
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
                total_cash_expected: activeShift.total_cash_expected + dpAmount,
              })
              .eq("id", activeShift.id);
          }
        } catch (err) {
          console.warn("Shift DP update error:", err);
        }
      }

      if (masukUtang > 0) {
        try {
          const { data: mbr, error: fetchMbrErr } = await supabase
            .from("members")
            .select("total_debt")
            .eq("id", payload.member_id)
            .single();

          if (fetchMbrErr) console.error("Error fetching member debt:", fetchMbrErr);

          const currentDebt = mbr?.total_debt || 0;
          const newTotalDebt = currentDebt + masukUtang;

          const { error: updateMbrErr } = await supabase
            .from("members")
            .update({
              total_debt: newTotalDebt,
              last_debt_at: new Date().toISOString(),
            })
            .eq("id", payload.member_id);

          if (updateMbrErr) console.error("Error updating member total_debt:", updateMbrErr);

          const debtLogPayload: any = {
            member_id: payload.member_id,
            transaction_id: tx.id,
            type: "kasbon",
            amount: masukUtang,
            down_payment: dpAmount,
            remaining_debt: newTotalDebt,
            payment_method: "kasbon",
            notes: `Kasbon transaksi ${tx.transaction_code} (Total: Rp ${totalAmount}, DP: Rp ${dpAmount})`,
            user_id: userId,
            created_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

          const { error: logInsertErr } = await supabase
            .from("debt_logs")
            .insert(debtLogPayload);

          if (logInsertErr) {
            console.error("Error inserting debt_logs full payload, trying fallback:", logInsertErr);
            await supabase.from("debt_logs").insert({
              member_id: payload.member_id,
              type: "kasbon",
              amount: masukUtang,
              remaining_debt: newTotalDebt,
              payment_method: "kasbon",
              notes: `Kasbon transaksi ${tx.transaction_code} (Total: Rp ${totalAmount}, DP: Rp ${dpAmount})`,
              created_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn("Supabase member debt / debt_logs error:", err);
        }
      }
    }

    return {
      success: true,
      message: "Transaksi berhasil diproses",
      data: {
        transaction_code: tx.transaction_code,
        payment_method: tx.payment_method,
        total_amount: tx.total_amount,
        amount_paid: tx.amount_paid,
        change_amount: tx.change_amount,
        date: tx.created_at,
        items: itemsResult,
      },
    };
  },

  voidTransaction: async (id: number) => {
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (txErr || !tx) throw new Error("Transaksi tidak ditemukan.");
    if (tx.status !== "completed") throw new Error("Hanya transaksi berstatus completed yang bisa dibatalkan.");

    const { data: items } = await supabase
      .from("transaction_items")
      .select("*")
      .eq("transaction_id", id);

    if (items) {
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const qtyRestored = item.conversion_used * item.qty;
          const { error: rpcError } = await supabase.rpc("adjust_product_stock", {
            product_id: item.product_id,
            qty_change: qtyRestored,
          });
          if (rpcError) throw rpcError;
        }
      }
    }

    const { data: updatedTx, error } = await supabase
      .from("transactions")
      .update({ status: "voided" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (tx.payment_method === "cash") {
      const { data: activeShift } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", tx.user_id)
        .eq("status", "open")
        .maybeSingle();

      if (activeShift) {
        await supabase
          .from("shifts")
          .update({
            total_cash_expected: activeShift.total_cash_expected - tx.total_amount,
          })
          .eq("id", activeShift.id);
      }
    }

    return { success: true, message: "Transaksi berhasil dibatalkan", data: updatedTx };
  },

  refundTransaction: async (id: number, payload: { reason: string; items: Array<{ product_id: number; qty_refunded: number }> }) => {
    const userId = await getCurrentProfileId();

    const { data: refund, error: refError } = await supabase
      .from("refunds")
      .insert({
        transaction_id: id,
        user_id: userId,
        reason: payload.reason,
        total_refunded: 0,
      })
      .select()
      .single();

    if (refError) throw refError;

    let grandRefundAmount = 0;

    for (const refundItem of payload.items) {
      const { data: txItem } = await supabase
        .from("transaction_items")
        .select("*")
        .eq("transaction_id", id)
        .eq("product_id", refundItem.product_id)
        .single();

      if (txItem) {
        const itemRefundAmount = txItem.unit_price * refundItem.qty_refunded;
        grandRefundAmount += itemRefundAmount;

        await supabase.from("refund_items").insert({
          refund_id: refund.id,
          product_id: refundItem.product_id,
          product_name: txItem.product_name,
          qty_refunded: refundItem.qty_refunded,
          refund_amount: itemRefundAmount,
        });

        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", refundItem.product_id)
          .single();

        if (product) {
          const qtyRestored = txItem.conversion_used * refundItem.qty_refunded;
          const { error: rpcError } = await supabase.rpc("adjust_product_stock", {
            product_id: refundItem.product_id,
            qty_change: qtyRestored,
          });
          if (rpcError) throw rpcError;
        }
      }
    }

    await supabase
      .from("refunds")
      .update({ total_refunded: grandRefundAmount })
      .eq("id", refund.id);

    await supabase
      .from("transactions")
      .update({ status: "partially_refunded" })
      .eq("id", id);

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
          total_refunded_cash: activeShift.total_refunded_cash + grandRefundAmount,
          total_cash_expected: activeShift.total_cash_expected - grandRefundAmount,
        })
        .eq("id", activeShift.id);
    }

    return { success: true, message: "Retur transaksi berhasil diproses." };
  }
};
