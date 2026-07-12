import { useState, useEffect, useCallback } from "react";
import { cashierApi, type CheckoutPayload, type ShiftData, type Transaction, type Expense } from "./api";
import type { Product } from "@/types/api";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export function useCashierProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchProducts = useCallback(async (search?: string) => {
        try {
            const res = await cashierApi.getProducts(search);
            const list = (res?.data as any)?.products ?? [];
            setProducts(Array.isArray(list) ? list : []);

            const cart = useCartStore.getState().cart;
            if (cart.length > 0 && Array.isArray(list)) {
                const updatedCart = cart.map(item => {
                    const match = list.find((p: any) => p.id === item.id);
                    if (match) {
                        return { ...item, stock: match.stock };
                    }
                    return item;
                });
                useCartStore.setState({ cart: updatedCart });
            }
        } catch (err) {
            console.error("Gagal memuat produk kasir:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const triggerSearch = useCallback(
        (query: string) => {
            setSearchQuery(query);
            fetchProducts(query || undefined);
        },
        [fetchProducts],
    );

    return {
        products,
        loading,
        searchQuery,
        triggerSearch,
        refetch: useCallback(
            () => fetchProducts(searchQuery || undefined),
            [fetchProducts, searchQuery],
        ),
    };
}

export function useCheckoutMutation() {
    const [isLoading, setIsLoading] = useState(false);

    const mutateCheckout = async (payload: CheckoutPayload) => {
        try {
            setIsLoading(true);
            const res = await cashierApi.checkout(payload);
            return res;
        } catch (err: any) {
            return {
                success: false,
                message:
                    err.response?.data?.message || "Gagal menghubungi server kasir.",
                data: null,
            };
        } finally {
            setIsLoading(false);
        }
    };

    return { mutateCheckout, isLoading };
}

export function useActiveShift() {
    const [shift, setShift] = useState<ShiftData | null>(null);
    const [isShiftActive, setIsShiftActive] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkShift = useCallback(async () => {
        setLoading(true);
        try {
            const res = await cashierApi.getActiveShift();
            if (res.success && res.data) {
                setShift(res.data);
                setIsShiftActive(true);
            } else {
                setShift(null);
                setIsShiftActive(false);
            }
        } catch {
            setShift(null);
            setIsShiftActive(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkShift();
    }, [checkShift]);

    return { shift, isShiftActive, loading, checkShift };
}

export function useCashSummary() {
    const router = useRouter();
    const logout = useAuthStore((s) => s.logout);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actualCashInput, setActualCashInput] = useState("");
    const [isClosingShift, setIsClosingShift] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [resTrx, resExp, resShift] = await Promise.allSettled([
                cashierApi.getTransactions(100),
                cashierApi.getExpenses(),
                cashierApi.getActiveShift(),
            ]);

            if (resTrx.status === "fulfilled" && resTrx.value.success) {
                const raw = resTrx.value.data;
                setTransactions(Array.isArray(raw) ? raw : ((raw as any)?.data ?? []));
            }
            if (resExp.status === "fulfilled" && resExp.value.success) {
                const raw = resExp.value.data;
                setExpenses(Array.isArray(raw) ? raw : ((raw as any)?.data ?? []));
            }
            if (resShift.status === "fulfilled" && resShift.value.success) {
                setActiveShift(resShift.value.data);
            } else {
                setActiveShift(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const completedTrx = transactions.filter((t) => t.status === "completed");

    const cashTotal = completedTrx
        .filter((t) => t.payment_method.toLowerCase() === "cash")
        .reduce((s, t) => s + t.total_amount, 0);

    const qrisTotal = completedTrx
        .filter((t) => t.payment_method.toLowerCase() === "qris")
        .reduce((s, t) => s + t.total_amount, 0);

    const transferTotal = completedTrx
        .filter((t) => t.payment_method.toLowerCase() === "transfer")
        .reduce((s, t) => s + t.total_amount, 0);

    const totalIncome = cashTotal + qrisTotal + transferTotal;
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    const voidedTrx = transactions.filter((t) => t.status === "voided");
    const totalVoided = voidedTrx.reduce((s, t) => s + t.total_amount, 0);

    const startCash = activeShift?.start_cash ?? 0;
    const totalUangMasuk = activeShift?.total_cash_expected ?? cashTotal;
    const totalUangKeluar = totalExpense;
    const totalKas =
        startCash + totalUangMasuk - (activeShift?.total_refunded_cash ?? 0);

    const actualCashNum = parseInt(actualCashInput.replace(/\D/g, "")) || 0;
    const selisih = actualCashNum > 0 ? actualCashNum - totalKas : null;

    const netProfit = totalIncome - totalExpense;

    const handleLogout = () => {
        if (confirm("Yakin ingin mengakhiri sesi kasir?")) {
            logout();
            router.push("/login");
        }
    };

    const handleVoidTransaction = async (id: number, code: string) => {
        if (
            !confirm(
                `Apakah Anda yakin ingin membatalkan transaksi #${code.slice(-6)}? Tindakan ini akan mengembalikan stok produk.`
            )
        ) {
            return;
        }

        try {
            const data = await cashierApi.voidTransaction(id);
            if (data.success) {
                alert("Transaksi berhasil dibatalkan!");
                fetchData();
            } else {
                alert(data.message || "Gagal membatalkan transaksi");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan atau server");
        }
    };

    const handleCloseShift = async () => {
        if (actualCashNum <= 0) {
            alert("Masukkan jumlah uang fisik yang dihitung di laci terlebih dahulu.");
            return;
        }
        if (
            !confirm(
                `Yakin ingin menutup shift kasir saat ini?\n` +
                `Uang Kas Estimasi: Rp ${totalKas.toLocaleString("id-ID")}\n` +
                `Uang Kas Aktual: Rp ${actualCashNum.toLocaleString("id-ID")}\n` +
                `Selisih: Rp ${(selisih || 0).toLocaleString("id-ID")}`
            )
        ) {
            return;
        }

        setIsClosingShift(true);
        try {
            const res = await cashierApi.closeShift(actualCashNum);
            if (res.success) {
                alert("Shift kasir berhasil ditutup!");
                fetchData();
                router.push("/cashier");
            } else {
                alert(res.message || "Gagal menutup shift kasir.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menutup shift kasir.");
        } finally {
            setIsClosingShift(false);
        }
    };

    return {
        transactions,
        expenses,
        activeShift,
        isLoading,
        isModalOpen,
        setIsModalOpen,
        actualCashInput,
        setActualCashInput,
        completedTrx,
        cashTotal,
        qrisTotal,
        transferTotal,
        totalIncome,
        totalExpense,
        voidedTrx,
        totalVoided,
        startCash,
        totalUangMasuk,
        totalUangKeluar,
        totalKas,
        actualCashNum,
        selisih,
        netProfit,
        handleLogout,
        handleVoidTransaction,
        fetchData,
        isClosingShift,
        handleCloseShift,
    };
}

