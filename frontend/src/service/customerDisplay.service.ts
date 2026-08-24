import type { CustomerDisplayPayloadDAO } from "@/modules/CustomerDisplay/DAO/customerDisplay.dao";

export function createCustomerDisplayChannel(onUpdate: (data: CustomerDisplayPayloadDAO) => void) {
  if (typeof window === "undefined") return null;

  const channel = new BroadcastChannel("gopos-customer-display");

  channel.onmessage = (event) => {
    const data = event.data;
    if (data && data.type === "CART_UPDATE") {
      onUpdate({
        cart: data.cart || [],
        totalNormal: data.totalNormal || 0,
        discountAmount: data.discountAmount || 0,
        grandTotal: data.grandTotal || 0,
        selectedMember: data.selectedMember || null,
        lastTransaction: data.lastTransaction || null,
      });
    }
  };

  channel.postMessage({ type: "REQUEST_CURRENT_STATE" });

  return channel;
}
