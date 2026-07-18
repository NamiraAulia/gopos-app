import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { cashierApi } from "../api";
import { useCashierProducts, useActiveShift } from "../hooks";

export function useCashierPage() {
  const router = useRouter();
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
    recallCart,
    deleteHeldCart,
    loadHeldCarts,
  } = useCartStore();

  const { products, loading, searchQuery, triggerSearch, refetch } =
    useCashierProducts();
  const { shift, isShiftActive, checkShift } = useActiveShift();
  const [members, setMembers] = useState<any[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<any>(null);
  

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await cashierApi.getMembers();
        if (res.success) {
          setMembers(res.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat member:", err);
      }
    };
    if (isHydrated && currentUser) {
      fetchMembers();
      checkShift();
    }
  }, [isHydrated, currentUser, checkShift]);


  const totalNormal = cart.reduce((sum, item) => {
    const isBig = item.unit_choice === "big" && item.price_big > 0;
    const harga =
      item.custom_price != null && item.custom_price > 0
        ? item.custom_price
        : isBig
        ? item.price_big
        : item.price;
    return sum + harga * item.qty;
  }, 0);

  const totalNet = cart.reduce((sum, item) => {
    const isBig = item.unit_choice === "big" && item.price_big > 0;
    const isMemberPrice = !isBig && selectedMember && item.price_member > 0;
    const harga =
      item.custom_price != null && item.custom_price > 0
        ? item.custom_price
        : isBig
        ? item.price_big
        : isMemberPrice
        ? item.price_member
        : item.price;
    return sum + harga * item.qty;
  }, 0);

  const discountAmount = totalNormal - totalNet;
  const grandTotal = totalNet;

  // Sync state to Dual-Screen Customer Facing Display via BroadcastChannel API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const channel = new BroadcastChannel("gopos-customer-display");

    const sendUpdate = () => {
      channel.postMessage({
        type: "CART_UPDATE",
        cart,
        totalNormal,
        discountAmount,
        grandTotal,
        selectedMember,
        lastTransaction,
      });
    };

    // Broadcast current state
    sendUpdate();

    // Listen for state requests from new customer display sessions
    channel.onmessage = (event) => {
      if (event.data?.type === "REQUEST_CURRENT_STATE") {
        sendUpdate();
      }
    };

    return () => {
      channel.close();
    };
  }, [cart, totalNormal, discountAmount, grandTotal, selectedMember, lastTransaction]);

  return {
    router,
    currentUser,
    isHydrated,
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
    products,
    loading,
    searchQuery,
    triggerSearch,
    refetch,
    shift,
    isShiftActive,
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
    totalNet,
    discountAmount,
    grandTotal,
    heldCarts,
    holdCurrentCart,
    recallCart,
    deleteHeldCart,
    loadHeldCarts,
  };
}
