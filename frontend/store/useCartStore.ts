import { create } from 'zustand';

export interface Product {
  min_stock: number;
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem extends Product {
  qty: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  decreaseQty: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  updatePrice: (productId: number, newPrice: number) => void; // 👈 Fitur baru
}

export const useCartStore = create<CartStore>((set) => ({
  cart: [],

  addToCart: (product) => set((state) => {
    const existingItem = state.cart.find((item) => item.id === product.id);
    if (existingItem) {
      return {
        cart: state.cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        ),
      };
    } else {
      return { cart: [...state.cart, { ...product, qty: 1 }] };
    }
  }),

  decreaseQty: (productId) => set((state) => {
    const existingItem = state.cart.find((item) => item.id === productId);
    if (existingItem && existingItem.qty > 1) {
      return {
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        ),
      };
    }
    return { cart: state.cart.filter((item) => item.id !== productId) };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== productId)
  })),

  clearCart: () => set({ cart: [] }),

  updatePrice: (productId, newPrice) => set((state) => ({
    cart: state.cart.map((item) =>
      item.id === productId ? { ...item, price: newPrice } : item
    ),
  })),
}));