import type { CustomerDisplayPayloadDAO } from "@/modules/CustomerDisplay/DAO/customerDisplay.dao";

const CHANNEL_NAME = "gopos-customer-display";
const STORAGE_KEY = "gopos-customer-display-state";

export function createCustomerDisplayChannel(onUpdate: (data: CustomerDisplayPayloadDAO) => void) {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      onUpdate(parsed);
    }
  } catch (e) {
    console.error("Gagal membaca initial state customer display dari localStorage:", e);
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event) => {
    const data = event.data;
    if (data && data.type === "CART_UPDATE") {
      const payload: CustomerDisplayPayloadDAO = {
        cart: data.cart || [],
        totalNormal: data.totalNormal || 0,
        discountAmount: data.discountAmount || 0,
        grandTotal: data.grandTotal || 0,
        selectedMember: data.selectedMember || null,
        lastTransaction: data.lastTransaction || null,
        isPaying: !!data.isPaying,
      };
      onUpdate(payload);
    }
  };

  channel.postMessage({ type: "REQUEST_CURRENT_STATE" });

  return channel;
}

export function broadcastCustomerDisplayState(payload: CustomerDisplayPayloadDAO) {
  if (typeof window === "undefined") return;

  const dataToStore = {
    cart: payload.cart || [],
    totalNormal: payload.totalNormal || 0,
    discountAmount: payload.discountAmount || 0,
    grandTotal: payload.grandTotal || 0,
    selectedMember: payload.selectedMember || null,
    lastTransaction: payload.lastTransaction || null,
    isPaying: !!payload.isPaying,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (e) {
    console.error("Gagal menyimpan state customer display ke localStorage:", e);
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: "CART_UPDATE",
      ...dataToStore,
    });
    channel.close();
  } catch (e) {
    console.error("Gagal broadcast state customer display:", e);
  }
}

export function listenForCustomerDisplayRequests(getCurrentStatePayload: () => CustomerDisplayPayloadDAO) {
  if (typeof window === "undefined") return null;

  const channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event) => {
    const data = event.data;
    if (data && data.type === "REQUEST_CURRENT_STATE") {
      const currentState = getCurrentStatePayload();
      broadcastCustomerDisplayState(currentState);
    }
  };

  return channel;
}

