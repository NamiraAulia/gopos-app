"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCashierPage } from "./useCashierPage";
import { useAuthStore } from "@/store/authStore";
import { useCashierStore } from "../Store/useCashierStore";
import { CashierView } from "../Component/CashierView";

export default function CashierContainer() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { showHoldModal, setShowHoldModal, showHeldCartsModal, setShowHeldCartsModal } = useCashierStore();

  const cashierData = useCashierPage();

  useEffect(() => {
    cashierData.loadHeldCarts();
  }, []);

  useEffect(() => {
    if (cashierData.isHydrated && !cashierData.currentUser) {
      logout();
      router.push("/login");
    }
  }, [cashierData.isHydrated, cashierData.currentUser, router, logout]);

  return (
    <CashierView
      router={router}
      currentUser={cashierData.currentUser}
      isHydrated={cashierData.isHydrated}
      cart={cashierData.cart}
      addToCart={cashierData.addToCart}
      decreaseQty={cashierData.decreaseQty}
      removeFromCart={cashierData.removeFromCart}
      clearCart={cashierData.clearCart}
      toggleUnitChoice={cashierData.toggleUnitChoice}
      selectedMember={cashierData.selectedMember}
      setSelectedMember={cashierData.setSelectedMember}
      setQty={cashierData.setQty}
      setCustomPrice={cashierData.setCustomPrice}
      products={cashierData.products}
      loading={cashierData.loading}
      searchQuery={cashierData.searchQuery}
      triggerSearch={cashierData.triggerSearch}
      refetch={cashierData.refetch}
      isShiftActive={cashierData.isShiftActive}
      checkShift={cashierData.checkShift}
      members={cashierData.members}
      showPaymentModal={cashierData.showPaymentModal}
      setShowPaymentModal={cashierData.setShowPaymentModal}
      showReceipt={cashierData.showReceipt}
      setShowReceipt={cashierData.setShowReceipt}
      lastTransaction={cashierData.lastTransaction}
      setLastTransaction={cashierData.setLastTransaction}
      showOpenShiftModal={cashierData.showOpenShiftModal}
      setShowOpenShiftModal={cashierData.setShowOpenShiftModal}
      showProductModal={cashierData.showProductModal}
      setShowProductModal={cashierData.setShowProductModal}
      showClearConfirm={cashierData.showClearConfirm}
      setShowClearConfirm={cashierData.setShowClearConfirm}
      editingPriceId={cashierData.editingPriceId}
      setEditingPriceId={cashierData.setEditingPriceId}
      tempPrice={cashierData.tempPrice}
      setTempPrice={cashierData.setTempPrice}
      searchInputRef={cashierData.searchInputRef}
      debounceTimer={cashierData.debounceTimer}
      totalNormal={cashierData.totalNormal}
      discountAmount={cashierData.discountAmount}
      grandTotal={cashierData.grandTotal}
      heldCarts={cashierData.heldCarts}
      holdCurrentCart={cashierData.holdCurrentCart}
      loadHeldCarts={cashierData.loadHeldCarts}
      handleSearchKeyDown={cashierData.handleSearchKeyDown}
      showHoldModal={showHoldModal}
      setShowHoldModal={setShowHoldModal}
      showHeldCartsModal={showHeldCartsModal}
      setShowHeldCartsModal={setShowHeldCartsModal}
    />
  );
}
