import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import type { Transaction } from "../types";
import { handleReceiptPrint } from "@/lib/printer";

export function useAdminTransactions() {
  const { user: currentUser, isHydrated } = useAuthStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = useCallback(async () => {
    if (!isHydrated || !currentUser || currentUser.role !== "admin") return;
    setLoading(true);
    setError("");

    if (startDate && endDate && startDate > endDate) {
      setError("Rentang tanggal tidak valid: Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      setTransactions([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("transactions")
        .select(`
          id,
          transaction_code,
          user_id,
          total_amount,
          payment_method,
          amount_paid,
          change_amount,
          status,
          member_id,
          discount_amount,
          created_at,
          user:users(id, name, email, role),
          member:members(id, name, phone),
          items:transaction_items(*)
        `, { count: "exact" });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (search) {
        query = query.ilike("transaction_code", `%${search}%`);
      }

      if (startDate) {
        query = query.gte("created_at", startDate + "T00:00:00");
      }
      if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59");
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setTransactions((data as any) || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage) || 1);
    } catch (err: any) {
      console.error("Gagal memuat data transaksi:", err);
      setError(err.message || "Gagal menghubungi database untuk memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  }, [isHydrated, currentUser, currentPage, itemsPerPage, search, statusFilter, startDate, endDate]);

  const openDetail = async (trx: Transaction) => {
    setDetailLoading(true);
    setSelectedTransaction(trx);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          transaction_code,
          user_id,
          total_amount,
          payment_method,
          amount_paid,
          change_amount,
          status,
          member_id,
          discount_amount,
          created_at,
          user:users(id, name, email, role),
          member:members(id, name, phone),
          items:transaction_items(*)
        `)
        .eq("id", trx.id)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedTransaction(data as any);
      }
    } catch (err) {
      console.error("Gagal memuat detail nota transaksi:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  const handlePrint = async () => {
    if (!selectedTransaction) {
      setPrintError("Tidak ada transaksi yang terpilih.");
      return;
    }
    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const res = await handleReceiptPrint({
        transaction: {
          ...selectedTransaction,
          items: selectedTransaction.items?.map((item: any) => ({
            product_name: item.product_name,
            qty: item.qty,
            price: item.unit_price,
            subtotal: item.subtotal,
          }))
        },
        cashierName: selectedTransaction.user?.name || "Kasir"
      });

      if (res && res.success === false) {
        throw new Error(res.message || "Gagal mencetak struk.");
      }
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error cetak di useAdminTransactions:", err);
      setPrintError(err.message || "Periksa koneksi printer.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelectedTransaction(null);
    alert("Retur barang berhasil diproses!");
    fetchTransactions();
  };

  const handleVoid = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan transaksi ini? Tindakan ini akan mengembalikan stok produk.")) {
      return;
    }
    try {
      setDetailLoading(true);

      // Fetch transaction details
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (txErr || !tx) throw new Error("Transaksi tidak ditemukan.");
      if (tx.status !== "completed") throw new Error("Hanya transaksi berstatus completed yang bisa dibatalkan.");

      // Fetch items
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
        .eq("id", id);

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

      alert("Transaksi berhasil dibatalkan!");
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat membatalkan transaksi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResetFilters = () => {
    search && setSearch("");
    statusFilter !== "all" && setStatusFilter("all");
    startDate && setStartDate("");
    endDate && setEndDate("");
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions;

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, startDate, endDate]);

  // Fetch transactions when page or filters change
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, search, statusFilter, startDate, endDate, fetchTransactions]);

  return {
    currentUser,
    isHydrated,
    transactions,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedTransaction,
    setSelectedTransaction,
    detailLoading,
    showRefundModal,
    setShowRefundModal,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    totalItems,
    paginatedTransactions,
    itemsPerPage,
    fetchTransactions,
    openDetail,
    handlePrint,
    isPrinting,
    printError,
    printSuccess,
    handleRefundSuccess,
    handleResetFilters,
    goToPage,
    handleVoid,
  };
}
