"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cashierDAO } from "../DAO/cashier.dao";
import type { ShiftDataDTO as ShiftData } from "../DTO/cashier.dto";
import type { Product } from "@/interface/api";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/authStore";

const PRODUCTS_PER_PAGE = 50;

export function useCashierPage() {
  const { user: currentUser, isHydrated } = useAuthStore();
  const {
    cart,
    addToCart,
    decreaseQty,
    removeFromCart,
    clearCart,
    toggleUnitChoice,
    selectedMember,
    setSelectedMember,
    setQty,
    setCustomPrice,
    heldCarts,
    holdCurrentCart,
    loadHeldCarts,
  } = useCartStore();

  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [isShiftChecking, setIsShiftChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [members, setMembers] = useState<any[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [lastTransaction, setLastTransaction] = useState<any | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<any>(null);
  const pageRef = useRef(1);

  const [staleShiftInfo, setStaleShiftInfo] = useState<{ isStale: boolean; shift: ShiftData | null; hoursOpen: number } | null>(null);
  const [showStaleShiftModal, setShowStaleShiftModal] = useState(false);

  const checkShift = useCallback(async () => {
    setIsShiftChecking(true);
    try {
      const res = await cashierDAO.getActiveShift();
      if (res.success && res.data) {
        setActiveShift(res.data);
        const staleRes = await cashierDAO.checkStaleShift();
        if (staleRes && staleRes.isStale) {
          setStaleShiftInfo(staleRes);
          setShowStaleShiftModal(true);
        }
      } else {
        setActiveShift(null);
        setStaleShiftInfo(null);
      }
    } catch (err) {
      setActiveShift(null);
    } finally {
      setIsShiftChecking(false);
    }
  }, []);

  const fetchProducts = useCallback(async (q?: string) => {
    setLoading(true);
    pageRef.current = 1;
    try {
      const res = await cashierDAO.getProducts(q, 1, PRODUCTS_PER_PAGE);
      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setHasMore(res.data.hasMore !== false);
      }
    } catch (err) {
      console.error("Gagal memuat produk kasir:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await cashierDAO.getProducts(
        searchQuery || undefined,
        nextPage,
        PRODUCTS_PER_PAGE
      );
      if (res.success && res.data) {
        const newProducts = res.data.products || [];
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newProducts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
        setHasMore(newProducts.length >= PRODUCTS_PER_PAGE && res.data.hasMore !== false);
        pageRef.current = nextPage;
      }
    } catch (err) {
      console.error("Gagal memuat lebih banyak produk:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchQuery]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await cashierDAO.getMembers();
      if (res.success && res.data) {
        setMembers(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat member kasir:", err);
    }
  }, []);

  useEffect(() => {
    checkShift();
    fetchProducts();
    fetchMembers();
  }, [checkShift, fetchProducts, fetchMembers]);

  const activeCart = cart || [];

  const totalNormal = activeCart.reduce(
    (sum: number, item: any) => sum + (item.custom_price || item.price || 0) * item.qty,
    0
  );
  const discountAmount = 0;
  const grandTotal = Math.max(0, totalNormal - discountAmount);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchProducts(searchQuery);
    }
  };

  const triggerSearch = (q: string) => {
    setSearchQuery(q);
    fetchProducts(q);
  };

  return {
    currentUser,
    isHydrated,
    cart: activeCart,
    addToCart,
    decreaseQty,
    removeFromCart,
    clearCart,
    toggleUnitChoice,
    selectedMember,
    setSelectedMember,
    setQty,
    setCustomPrice,
    products,
    loading,
    loadingMore,
    hasMore,
    loadMoreProducts,
    searchQuery,
    setSearchQuery,
    triggerSearch,
    refetch: fetchProducts,
    isShiftActive: !!activeShift,
    checkShift,
    members,
    showPaymentModal,
    setShowPaymentModal,
    showReceipt,
    setShowReceipt,
    lastTransaction,
    setLastTransaction,
    showOpenShiftModal,
    setShowOpenShiftModal,
    showProductModal,
    setShowProductModal,
    showClearConfirm,
    setShowClearConfirm,
    editingPriceId,
    setEditingPriceId,
    tempPrice,
    setTempPrice,
    searchInputRef,
    debounceTimer,
    totalNormal,
    discountAmount,
    grandTotal,
    heldCarts,
    holdCurrentCart,
    loadHeldCarts,
    handleSearchKeyDown,
    staleShiftInfo,
    showStaleShiftModal,
    setShowStaleShiftModal,
  };
}
