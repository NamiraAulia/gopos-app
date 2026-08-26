import { create } from "zustand";
import type { Product } from "@/types/api";
import type { MemberDTO as Member } from "@/modules/Member/DTO/member.dto";

export interface CartItem {
  id: number;
  name: string;
  price: number;      
  price_big: number;   
  price_member: number;
  qty: number;        
  unit: string;       
  unit_big: string;    
  conversion: number;
  unit_choice: "small" | "big"; 
  stock: number;
  custom_price?: number;
}

export interface HeldCart {
  id: string;
  note: string;
  items: CartItem[];
  selectedMember: Member | null;
  heldAt: string;
}

interface CartState {
  cart: CartItem[];
  selectedMember: Member | null;
  heldCarts: HeldCart[];
  addToCart: (product: Product, choice?: "small" | "big") => void;
  decreaseQty: (id: number) => void;
  toggleUnitChoice: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  setSelectedMember: (member: Member | null) => void;
  setQty: (id: number, qty: number) => void;
  setCustomPrice: (id: number, price: number | undefined) => void;
  holdCurrentCart: (note: string) => void;
  recallCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;
  loadHeldCarts: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: [],
  selectedMember: null,
  
  addToCart: (product, choice = "small") => set((state) => {
    const existingIndex = state.cart.findIndex((item) => item.id === product.id);
    
    if (existingIndex > -1) {
      const newCart = [...state.cart];
      newCart[existingIndex].qty += 1;
      return { cart: newCart };
    }

    return {
      cart: [
        ...state.cart,
        {
          id: product.id!,
          name: product.name,
          price: product.price,
          price_big: (product as any).price_big || 0,
          price_member: product.price_member || 0,
          qty: 1,
          unit: product.unit || "pcs",
          unit_big: product.unit_big || "",
          conversion: product.conversion || 1,
          unit_choice: choice,
          stock: product.stock,
        },
      ],
    };
  }),

  decreaseQty: (id) => set((state) => ({
    cart: state.cart
      .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
      .filter((item) => item.qty > 0),
  })),

  toggleUnitChoice: (id) => set((state) => ({
    cart: state.cart.map((item) => {
      if (item.id === id) {
        const nextChoice = item.unit_choice === "small" ? "big" : "small";
        return { ...item, unit_choice: nextChoice };
      }
      return item;
    }),
  })),

  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== id),
  })),

  clearCart: () => set({ cart: [], selectedMember: null }),
  setSelectedMember: (member) => set({ selectedMember: member }),
  setQty: (id, qty) => set((state) => ({
    cart: state.cart.map((item) => (item.id === id ? { ...item, qty } : item)),
  })),
  setCustomPrice: (id, price) => set((state) => ({
    cart: state.cart.map((item) => (item.id === id ? { ...item, custom_price: price } : item)),
  })),

  heldCarts: [],

  loadHeldCarts: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gopos-held-carts");
      if (stored) {
        try {
          set({ heldCarts: JSON.parse(stored) });
        } catch (e) {
          console.error("Gagal memuat held carts:", e);
        }
      }
    }
  },

  holdCurrentCart: (note) => set((state) => {
    if (state.cart.length === 0) return {};
    const newHeld: HeldCart = {
      id: Date.now().toString(),
      note,
      items: state.cart,
      selectedMember: state.selectedMember,
      heldAt: new Date().toISOString(),
    };
    const updated = [...state.heldCarts, newHeld];
    if (typeof window !== "undefined") {
      localStorage.setItem("gopos-held-carts", JSON.stringify(updated));
    }
    return {
      heldCarts: updated,
      cart: [],
      selectedMember: null,
    };
  }),

  recallCart: (id) => set((state) => {
    const target = state.heldCarts.find((c) => c.id === id);
    if (!target) return {};
    const updated = state.heldCarts.filter((c) => c.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem("gopos-held-carts", JSON.stringify(updated));
    }
    return {
      heldCarts: updated,
      cart: target.items,
      selectedMember: target.selectedMember,
    };
  }),

  deleteHeldCart: (id) => set((state) => {
    const updated = state.heldCarts.filter((c) => c.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem("gopos-held-carts", JSON.stringify(updated));
    }
    return {
      heldCarts: updated,
    };
  }),
}));