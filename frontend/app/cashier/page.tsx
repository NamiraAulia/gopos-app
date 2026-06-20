"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MonitorSmartphone, Plus, Minus, X, CreditCard, LogOut, Package, Trash2 } from "lucide-react";
import { useCartStore, Product } from "../../store/useCartStore";

import { PaymentModal } from "../../features/cashier/components/PaymentModal";
import { ReceiptModal } from "../../features/cashier/components/ReceiptModal";
import { ProductModal } from "../../features/products/components/ProductModal";

export default function CashierPage() {
  const router = useRouter();
  const { cart, addToCart, decreaseQty, removeFromCart, clearCart, updatePrice } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const grandTotal = cart.reduce((total, item) => total + item.price * item.qty, 0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = useCallback(async (keyword = "") => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = keyword ? `${API_URL}/api/v1/products?name=${encodeURIComponent(keyword)}` : `${API_URL}/api/v1/products`;

      const response = await fetch(url, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) router.push("/login");

      const result = await response.json();
      if (result.success && result.data && result.data.data) {
        setProducts(result.data.data);
      }
    } catch (error) {
      console.error("Gagal ambil data produk:", error);
    }
  }, []);

  const handleLogout = () => {
    if (confirm("Yakin ingin mengakhiri sesi kasir?")) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* --- HEADER (Bisa dipisah jadi komponen layout/Header.tsx nanti) --- */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <MonitorSmartphone className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">GoPOS</h1>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
            <a className="text-blue-600 font-bold" href="/cashier">Kasir</a>
            <a className="hover:text-slate-900 transition-colors" href="/products">Gudang</a>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* --- KIRI: DAFTAR PRODUK --- */}
        <section className="flex flex-[0.65] flex-col overflow-hidden border-r border-slate-200">
          <div className="bg-slate-50 p-6 z-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input type="text" autoFocus value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (debounceTimer.current) clearTimeout(debounceTimer.current);
                  debounceTimer.current = setTimeout(() => fetchProducts(e.target.value), 300);
                }}
                className="h-12 w-full max-w-sm rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm font-bold focus:border-blue-600 outline-none"
                placeholder="Cari barang..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 pt-0 grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => {
              const isOutOfStock = Number(product.stock) <= 0;
              return (
                <div key={product.id} onClick={() => !isOutOfStock && addToCart(product)}
                  className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${isOutOfStock ? "border-red-200 bg-red-50" : "border-slate-200 bg-white hover:border-blue-600 cursor-pointer"}`}>
                  <div className="mb-4">
                    <h3 className="text-base font-bold line-clamp-2">{product.name}</h3>
                    <p className="text-blue-600 font-bold mt-1 text-sm">Rp {product.price.toLocaleString("id-ID")}</p>
                  </div>
                  <button className={`w-full py-2 font-bold rounded-xl text-sm flex items-center justify-center gap-2 pointer-events-none ${isOutOfStock ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}>
                    <Plus className="h-4 w-4" /> Tambah
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- KANAN: KERANJANG BELANJA --- */}
        <section className="flex flex-[0.35] flex-col bg-slate-50 relative z-20">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-blue-600">Keranjang Belanja</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs font-bold text-red-500 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Kosongkan</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col bg-white p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between mb-3">
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button onClick={() => decreaseQty(item.id)} className="p-1 border rounded"><Minus className="h-4 w-4" /></button>
                    <span className="font-bold">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="p-1 border rounded"><Plus className="h-4 w-4" /></button>
                  </div>
                  <span className="font-black text-blue-600">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-slate-500">Total Pembayaran</p>
              <h2 className="text-2xl font-black">Rp {grandTotal.toLocaleString("id-ID")}</h2>
            </div>
            <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 text-lg font-black text-white hover:bg-blue-700 disabled:opacity-50">
              <CreditCard className="h-6 w-6" /> Bayar Sekarang
            </button>
          </div>
        </section>
      </main>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        grandTotal={grandTotal}
        onSuccess={(data) => {
          setShowPaymentModal(false);
          setLastTransaction(data);
          setShowReceipt(true); 
          fetchProducts();      
        }} 
      />

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        transaction={lastTransaction} 
      />

    </div>
  );
}