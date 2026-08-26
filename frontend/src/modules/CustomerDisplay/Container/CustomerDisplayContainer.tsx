"use client";

import { useEffect } from "react";
import { createCustomerDisplayChannel } from "@/service/customerDisplay.service";
import { useCustomerDisplayStore } from "../Store/useCustomerDisplayStore";
import { CustomerDisplayView } from "../Component/CustomerDisplayView";

export default function CustomerDisplayContainer() {
  const {
    cart,
    totalNormal,
    discountAmount,
    grandTotal,
    selectedMember,
    lastTransaction,
    setCartData,
    clearLastTransaction,
  } = useCustomerDisplayStore();

  useEffect(() => {
    const channel = createCustomerDisplayChannel((data) => {
      setCartData(data);
    });

    return () => {
      if (channel) channel.close();
    };
  }, [setCartData]);

  useEffect(() => {
    if (cart.length > 0 && lastTransaction) {
      clearLastTransaction();
    }
  }, [cart, lastTransaction, clearLastTransaction]);

  return (
    <CustomerDisplayView
      cart={cart}
      totalNormal={totalNormal}
      discountAmount={discountAmount}
      grandTotal={grandTotal}
      selectedMember={selectedMember}
      lastTransaction={lastTransaction}
    />
  );
}
