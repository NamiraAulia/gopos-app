"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cashierDAO } from "../DAO/cashier.dao";
import type { ShiftDataDTO as ShiftData } from "../DTO/cashier.dto";
import type { Product } from "@/interface/api";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/authStore";

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

  const checkShift = useCallback(async () => {
    setIsShiftChecking(true);
    try {
      const res = await cashierDAO.getActiveShift();
      if (res.success && res.data) {
        setActiveShift(res.data);
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      setActiveShift(null);
    } finally {
      setIsShiftChecking(false);
    }
  }, []);

  const fetchProducts = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const res = await cashierDAO.getProducts(q);
      if (res.success && res.data) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Gagal memuat produk kasir:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  };
}
