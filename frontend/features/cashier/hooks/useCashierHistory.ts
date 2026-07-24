import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { handleReceiptPrint } from "@/lib/printer";
import type { Transaction } from "../api";

export function useCashierHistory() {
  const router = useRouter();
  const { user, activeShift } = useAuthStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchCode, setSearchCode] = useState("");

  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");

  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Sync shift active status from store
  useEffect(() => {
    setIsShiftActive(!!activeShift);
  }, [activeShift]);

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    alert("Retur barang berhasil diproses!");
    fetchTransactions(page);
    setSelected(null);
  };

  const fetchTransactions = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      const limit = 15;
      const from = (targetPage - 1) * limit;
      const to = from + limit - 1;

      // If user is a cashier and there is no active shift, they shouldn't see transactions
      if (user?.role === "kasir" && !activeShift) {
        setTransactions([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("transactions")
        .select(`
          *,
          member:members(id, name, phone)
        `, { count: "exact" });

      // Shift-Locked View for cashiers: only active shift's transactions created by them
      if (user?.role === "kasir" && activeShift) {
        // Subtract 10 minutes from start_time to handle client/server clock skew
        const skewTime = new Date(new Date(activeShift.start_time).getTime() - 10 * 60 * 1000).toISOString();
        query = query.gte("created_at", skewTime)
                     .eq("user_id", user.id);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setTransactions((data as any[]) || []);
      setTotalPages(Math.ceil((count || 0) / limit) || 1);
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeShift]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTransactions(page);
  }, [page, fetchTransactions, router]);

  const openDetail = async (trx: Transaction) => {
    setDetailLoading(true);
    setSelected(trx);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          user:users(id, name),
          member:members(id, name, phone),
          items:transaction_items(*)
        `)
        .eq("id", trx.id)
        .single();

      if (error) throw error;
      if (data) setSelected(data as any);
    } catch (err) {
      console.error("Gagal memuat detail transaksi:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = async () => {
    if (selected) {
      try {
        await handleReceiptPrint({ transaction: selected });
      } catch (err: any) {
        alert(err.message || "Gagal mencetak struk.");
      }
    } else {
      alert("Tidak ada transaksi yang terpilih.");
    }
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    try {
      setVoidLoading(true);
      setVoidError("");

      // Fetch transaction
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", voidTarget.id)
        .single();

      if (txErr || !tx) throw new Error("Transaksi tidak ditemukan.");
      if (tx.status !== "completed") throw new Error("Hanya transaksi completed yang dapat dibatalkan.");

      // Fetch transaction items
      const { data: items } = await supabase
        .from("transaction_items")
        .select("*")
        .eq("transaction_id", voidTarget.id);

      if (items) {
        for (const item of items) {
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

          if (product) {
            const qtyRestored = item.conversion_used * item.qty;
            await supabase
              .from("products")
              .update({ stock: product.stock + qtyRestored })
              .eq("id", item.product_id);
          }
        }
      }

      // Update status
      const { error: updateErr } = await supabase
        .from("transactions")
        .update({ status: "voided" })
        .eq("id", voidTarget.id);

      if (updateErr) throw updateErr;

      // Adjust shift expected cash
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

      setVoidTarget(null);
      setSelected(null);
      fetchTransactions(page);
    } catch (err: any) {
      setVoidError(err.message || "Gagal membatalkan transaksi.");
    } finally {
      setVoidLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin mengakhiri sesi kasir?")) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const filteredTransactions = searchCode
    ? transactions.filter((t) =>
      t.transaction_code.toLowerCase().includes(searchCode.toLowerCase()),
    )
    : transactions;

  return {
    router,
    transactions,
    loading,
    page,
    setPage,
    totalPages,
    searchCode,
    setSearchCode,
    selected,
    setSelected,
    detailLoading,
    voidTarget,
    setVoidTarget,
    voidLoading,
    voidError,
    showOpenShiftModal,
    setShowOpenShiftModal,
    isShiftActive,
    setIsShiftActive,
    showRefundModal,
    setShowRefundModal,
    handleRefundSuccess,
    openDetail,
    handlePrint,
    confirmVoid,
    handleLogout,
    filteredTransactions,
  };
}
