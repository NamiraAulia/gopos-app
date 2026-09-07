"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { cashierDAO } from "../DAO/cashier.dao";
import type { ShiftDataDTO as ShiftData } from "../DTO/cashier.dto";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/authStore";
import {
  cashierModalAtom,
  openCashierModalAtom,
} from "../Store/cashierModal.atom";
import {
  broadcastCustomerDisplayState,
  listenForCustomerDisplayRequests,
} from "@/service/customerDisplay.service";
import { CashierView } from "../Component/CashierView";

const PRODUCTS_PER_PAGE = 50;

export default function CashierContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, isHydrated, logout } = useAuthStore();
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

  const modalState = useAtomValue(cashierModalAtom);
  const openModal = useSetAtom(openCashierModalAtom);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("0");
  const [lastTransaction, setLastTransaction] = useState<any | null>(null);
  const [staleShiftInfo, setStaleShiftInfo] = useState<{
    isStale: boolean;
    shift: ShiftData | null;
    hoursOpen: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<any>(null);

  const {
    data: activeShift = null,
    isLoading: isShiftChecking,
    refetch: checkShift,
  } = useQuery({
    queryKey: ["activeShift", currentUser?.id],
    queryFn: async () => {
      const res = await cashierDAO.getActiveShift();
      if (res.success && res.data) {
        const staleRes = await cashierDAO.checkStaleShift();
        if (staleRes && staleRes.isStale) {
          setStaleShiftInfo(staleRes);
          openModal({ type: "STALE_SHIFT", data: staleRes });
        }
        return res.data;
      }
      return null;
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["cashierMembers"],
    queryFn: async () => {
      const res = await cashierDAO.getMembers();
      return res.success && res.data ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: productsData,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch: refetchProducts,
  } = useInfiniteQuery({
    queryKey: ["cashierProducts", searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await cashierDAO.getProducts(
        searchQuery || undefined,
        pageParam,
        PRODUCTS_PER_PAGE
      );
      return res.data || { products: [], totalCount: 0, hasMore: false };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  const products = useMemo(() => {
    return productsData?.pages.flatMap((page) => page.products) || [];
  }, [productsData]);

  const loadMoreProducts = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchNextPage();
    }
  }, [hasMore, loadingMore, fetchNextPage]);

  useEffect(() => {
    loadHeldCarts();
  }, [loadHeldCarts]);

  useEffect(() => {
    if (isHydrated && !currentUser) {
      logout();
      router.push("/login");
    }
  }, [isHydrated, currentUser, router, logout]);

  const activeCart = cart || [];

  const totalNormal = activeCart.reduce((sum: number, item: any) => {
    const isBig = item.unit_choice === "big" && item.price_big > 0;
    const isMemberPrice = !isBig && selectedMember && item.price_member > 0;
    const hargaSatuan =
      item.custom_price != null && item.custom_price > 0
        ? item.custom_price
        : isBig
        ? item.price_big
        : isMemberPrice
        ? item.price_member
        : item.price;
    return sum + hargaSatuan * item.qty;
  }, 0);
  const discountAmount = 0;
  const grandTotal = Math.max(0, totalNormal - discountAmount);

  const getCurrentDisplayPayload = useCallback(() => {
    return {
      cart: activeCart.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        price_big: item.price_big || 0,
        price_member: item.price_member || 0,
        qty: item.qty,
        unit: item.unit || "pcs",
        unit_big: item.unit_big || "",
        unit_choice: item.unit_choice || "small",
        custom_price: item.custom_price,
      })),
      totalNormal,
      discountAmount,
      grandTotal,
      selectedMember,
      lastTransaction,
      isPaying: modalState?.type === "PAYMENT",
    };
  }, [
    activeCart,
    totalNormal,
    discountAmount,
    grandTotal,
    selectedMember,
    lastTransaction,
    modalState?.type,
  ]);

  useEffect(() => {
    broadcastCustomerDisplayState(getCurrentDisplayPayload());
  }, [getCurrentDisplayPayload]);

  useEffect(() => {
    const channel = listenForCustomerDisplayRequests(getCurrentDisplayPayload);
    return () => {
      if (channel) channel.close();
    };
  }, [getCurrentDisplayPayload]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = searchInputRef.current?.value?.trim() || searchQuery;
      if (!query) return;

      cashierDAO
        .getProductByBarcode(query)
        .then((res) => {
          if (res.success && res.data) {
            addToCart(res.data, "small");
            if (searchInputRef.current) searchInputRef.current.value = "";
            setSearchQuery("");
            refetchProducts();
          } else {
            setSearchQuery(query);
          }
        })
        .catch(() => {
          setSearchQuery(query);
        });
    }
  };

  const triggerSearch = (q: string) => {
    setSearchQuery(q);
  };

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cashierProducts"] });
    refetchProducts();
  }, [queryClient, refetchProducts]);

  return (
    <CashierView
      router={router}
      currentUser={currentUser}
      isHydrated={isHydrated}
      cart={activeCart}
      addToCart={addToCart}
      decreaseQty={decreaseQty}
      removeFromCart={removeFromCart}
      clearCart={clearCart}
      toggleUnitChoice={toggleUnitChoice}
      selectedMember={selectedMember}
      setSelectedMember={setSelectedMember}
      setQty={setQty}
      setCustomPrice={setCustomPrice}
      products={products}
      loading={loading}
      searchQuery={searchQuery}
      triggerSearch={triggerSearch}
      refetch={refetch}
      isShiftActive={!!activeShift}
      checkShift={checkShift}
      members={members}
      loadingMore={loadingMore}
      hasMore={!!hasMore}
      loadMoreProducts={loadMoreProducts}
      lastTransaction={lastTransaction}
      setLastTransaction={setLastTransaction}
      editingPriceId={editingPriceId}
      setEditingPriceId={setEditingPriceId}
      tempPrice={tempPrice}
      setTempPrice={setTempPrice}
      searchInputRef={searchInputRef}
      debounceTimer={debounceTimer}
      totalNormal={totalNormal}
      discountAmount={discountAmount}
      grandTotal={grandTotal}
      heldCarts={heldCarts}
      holdCurrentCart={holdCurrentCart}
      loadHeldCarts={loadHeldCarts}
      handleSearchKeyDown={handleSearchKeyDown}
      staleShiftInfo={staleShiftInfo}
    />
  );
}
