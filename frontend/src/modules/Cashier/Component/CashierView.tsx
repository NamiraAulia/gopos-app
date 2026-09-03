"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  X,
  CreditCard,
  Trash2,
  Wallet,
  Package,
  PackagePlus,
  Loader2,
  FolderOpen,
  Inbox,
  Sparkles,
} from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { PrintableReceipt } from "./PrintableReceipt";
import { OpenShiftModal } from "./OpenShiftModal";
import { HoldCartModal } from "./HoldCartModal";
import { HeldCartsModal } from "./HeldCartsModal";
import { StaleShiftModal } from "./StaleShiftModal";
import { ProductModal } from "@/modules/Products/Component/ProductModal";
import Navbar from "./Navbar";

interface QuantityInputProps {
  itemId: number;
  value: number;
  onChange: (qty: number) => void;
  onRemove: () => void;
}

const QuantityInput = ({
  itemId,
  value,
  onChange,
  onRemove,
}: QuantityInputProps) => {
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleChange = (val: string) => {
    let cleaned = val.replace(/[^0-9.,]/g, "");
    cleaned = cleaned.replace(",", ".");
    setTempValue(cleaned);

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(tempValue);
    if (isNaN(parsed) || parsed <= 0) {
      if (confirm("Apakah Anda ingin menghapus produk ini dari keranjang?")) {
        onRemove();
      } else {
        setTempValue("1");
        onChange(1);
      }
    } else {
      setTempValue(parsed.toString());
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      value={tempValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className="font-mono text-xs sm:text-sm font-black w-8 sm:w-10 h-8 text-center bg-white outline-none focus:bg-blue-50 text-slate-900 select-all"
    />
  );
};

interface CashierViewProps {
  router: any;
  currentUser: any;
  isHydrated: boolean;
  cart: any[];
  addToCart: (product: any, unitChoice?: "small" | "big") => void;
  decreaseQty: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  toggleUnitChoice: (productId: number) => void;
  selectedMember: any;
  setSelectedMember: (member: any) => void;
  setQty: (productId: number, qty: number) => void;
  setCustomPrice: (productId: number, price?: number) => void;
  products: any[];
  loading: boolean;
  searchQuery: string;
  triggerSearch: (q: string) => void;
  refetch: () => void;
  isShiftActive: boolean;
  checkShift: () => void;
  members: any[];
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreProducts: () => void;
  showPaymentModal: boolean;
  setShowPaymentModal: (val: boolean) => void;
  showReceipt: boolean;
  setShowReceipt: (val: boolean) => void;
  lastTransaction: any;
  setLastTransaction: (tx: any) => void;
  showOpenShiftModal: boolean;
  setShowOpenShiftModal: (val: boolean) => void;
  showProductModal: boolean;
  setShowProductModal: (val: boolean) => void;
  showClearConfirm: boolean;
  setShowClearConfirm: (val: boolean) => void;
  editingPriceId: number | null;
  setEditingPriceId: (id: number | null) => void;
  tempPrice: string;
  setTempPrice: (price: string) => void;
  searchInputRef: any;
  debounceTimer: any;
  totalNormal: number;
  discountAmount: number;
  grandTotal: number;
  heldCarts: any[];
  holdCurrentCart: (note: string) => void;
  loadHeldCarts: () => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showHoldModal: boolean;
  setShowHoldModal: (val: boolean) => void;
  showHeldCartsModal: boolean;
  setShowHeldCartsModal: (val: boolean) => void;
  staleShiftInfo?: { isStale: boolean; shift: any; hoursOpen: number } | null;
  showStaleShiftModal?: boolean;
  setShowStaleShiftModal?: (val: boolean) => void;
}

export function CashierView({
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
  isShiftActive,
  checkShift,
  members,
  loadingMore,
  hasMore,
  loadMoreProducts,
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
  showHoldModal,
  setShowHoldModal,
  showHeldCartsModal,
  setShowHeldCartsModal,
  staleShiftInfo,
  showStaleShiftModal,
  setShowStaleShiftModal,
}: CashierViewProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cartContainerRef = useRef<HTMLDivElement>(null);
  const prevCartLengthRef = useRef(cart.length);

  // Auto-scroll cart to bottom when new item is added
  useEffect(() => {
    if (cart.length > prevCartLengthRef.current) {
      if (cartContainerRef.current) {
        cartContainerRef.current.scrollTo({
          top: cartContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
    prevCartLengthRef.current = cart.length;
  }, [cart.length]);

  // Infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!hasMore || loadingMore || loading) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMoreProducts();
      }
    };

    container.addEventListener("scroll", handleScroll);

    const sentinel = sentinelRef.current;
    let observer: IntersectionObserver | null = null;
    if (sentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore &&
            !loadingMore &&
            !loading
          ) {
            loadMoreProducts();
          }
        },
        { root: container, rootMargin: "150px", threshold: 0.1 },
      );
      observer.observe(sentinel);
    }

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (observer) observer.disconnect();
    };
  }, [
    hasMore,
    loadingMore,
    loading,
    isShiftActive,
    products.length,
    loadMoreProducts,
  ]);

  if (!isHydrated || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 select-none">
      <Navbar
        isShiftActive={isShiftActive}
        onOpenShiftClick={() => setShowOpenShiftModal(true)}
        onCloseShiftClick={() => router.push("/cashier/cashSummary")}
        onRecallClick={() => setShowHeldCartsModal(true)}
      />

      <main className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <section className="flex flex-1 flex-col overflow-hidden border-r border-slate-200 bg-slate-50/50">
          <div className="bg-white p-3.5 sm:p-4 border-b border-slate-200 z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  defaultValue={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (debounceTimer.current)
                      clearTimeout(debounceTimer.current);
                    (debounceTimer as any).current = setTimeout(
                      () => triggerSearch(val),
                      300,
                    );
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                  placeholder="Cari barang atau scan barcode (F1)..."
                />
              </div>

              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                title="Tambah produk baru"
                className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm shadow-blue-600/20 active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span className="hidden sm:inline">Produk</span>
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5"
          >
            {!isShiftActive ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-amber-500" />
                </div>
                <p className="font-black text-slate-700">Kasir Belum Dibuka</p>
                <p className="text-xs text-slate-400 font-medium max-w-xs">
                  Buka shift kasir terlebih dahulu untuk melihat dan menjual
                  produk
                </p>
                <button
                  onClick={() => setShowOpenShiftModal(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-colors cursor-pointer shadow-sm"
                >
                  Buka Shift Sekarang
                </button>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-24">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <PackagePlus className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-black text-slate-700">
                  {searchQuery
                    ? `"${searchQuery}" tidak ditemukan`
                    : "Belum Ada Produk"}
                </p>
                <p className="text-xs text-slate-400 font-medium max-w-xs">
                  {searchQuery
                    ? "Produk ini belum ada di sistem. Mau tambahkan sekarang?"
                    : "Tambahkan produk pertama ke sistem kasir kamu"}
                </p>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <PackagePlus className="h-3.5 w-3.5" /> Tambah Produk Baru
                </button>
              </div>
            ) : (
              products.map((product: any) => {
                const cartItem = cart.find(
                  (item: any) => item.id === product.id,
                );
                const inCartQty = cartItem ? cartItem.qty : 0;
                const skuCode =
                  product.barcode ||
                  product.sku ||
                  `AIC-${product.id.toString().padStart(2, "0")}`;
                const grosirPrice =
                  product.price_big && product.conversion
                    ? Math.round(product.price_big / product.conversion)
                    : product.price_member && product.price_member > 0
                      ? product.price_member
                      : null;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product, "small")}
                    className={`p-3.5 sm:p-4 bg-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer shadow-xs ${
                      inCartQty > 0
                        ? "border-2 border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/20 shadow-sm"
                        : "border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wide">
                          {skuCode}
                        </span>

                        {inCartQty > 0 ? (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                            Di Keranjang ({inCartQty})
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded ${
                              product.stock <= 5
                                ? "bg-red-100 text-red-700"
                                : product.stock <= 15
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Stok: {product.stock}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight uppercase leading-snug">
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {product.category ||
                          (product.unit
                            ? `Satuan: ${product.unit}`
                            : "Produk Kasir")}
                      </p>
                    </div>

                    {/* Right Price & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-base sm:text-lg font-black text-blue-600">
                          Rp {product.price.toLocaleString("id-ID")}
                        </p>
                        {grosirPrice ? (
                          <p className="text-xs text-slate-400 font-medium">
                            Grosir: Rp {grosirPrice.toLocaleString("id-ID")}
                          </p>
                        ) : null}
                      </div>

                      {inCartQty > 0 ? (
                        <div
                          className="flex items-center border border-blue-600 rounded-xl overflow-hidden bg-white shadow-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => decreaseQty(product.id)}
                            className="h-9 w-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-black flex items-center justify-center transition-colors cursor-pointer border-r border-blue-200"
                            title="Kurangi Qty"
                          >
                            <Minus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-xs sm:text-sm text-slate-900">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(product, "small")}
                            className="h-9 w-9 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black flex items-center justify-center transition-colors cursor-pointer"
                            title="Tambah Qty"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, "small");
                          }}
                          className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[3]" /> TAMBAH
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isShiftActive && !loading && (
              <div
                ref={sentinelRef}
                className="flex flex-col items-center justify-center py-4 gap-2"
              >
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-bold">
                      Memuat produk lainnya...
                    </span>
                  </div>
                )}
                {!hasMore && products.length > 0 && (
                  <p className="text-xs font-medium text-slate-400">
                    Semua produk telah dimuat ({products.length} produk)
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Cart Panel */}
        <section className="w-full lg:w-[420px] xl:w-[500px] flex flex-col bg-white border-l border-slate-200 shrink-0 relative z-20">
          {/* Header Cart */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base sm:text-lg text-slate-900">
                Keranjang
              </h2>
              <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                {cart.length} item
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus Semua
              </button>
            )}
          </div>

          <div className="px-4 py-3 bg-white border-b border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 shrink-0">
                Pelanggan:
              </label>
              <select
                value={selectedMember?.id || ""}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const found = members.find((m: any) => m.id === id);
                  setSelectedMember(found || null);
                }}
                className="flex-1 h-9 px-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-all bg-white text-slate-800 cursor-pointer"
              >
                <option value="">Pelanggan Umum</option>
                {members.map((mbr: any) => (
                  <option key={mbr.id} value={mbr.id}>
                    {mbr.name} ({mbr.member_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            ref={cartContainerRef}
            className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 bg-slate-50/40"
          >
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-3">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Inbox className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-black text-sm text-slate-700">
                  Keranjang Masih Kosong
                </p>
                <p className="text-xs text-slate-400 font-medium max-w-xs">
                  Pilih produk di daftar sebelah kiri untuk memasukkan ke
                  keranjang
                </p>
              </div>
            ) : (
              cart.map((item: any) => {
                const isBig = item.unit_choice === "big" && item.price_big > 0;
                const isMemberPrice =
                  !isBig && selectedMember && item.price_member > 0;
                const hargaTampil =
                  item.custom_price != null && item.custom_price > 0
                    ? item.custom_price
                    : isBig
                      ? item.price_big
                      : isMemberPrice
                        ? item.price_member
                        : item.price;

                return (
                  <div
                    key={item.id}
                    className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-1.5 shadow-xs transition-all hover:border-slate-300"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight leading-snug flex-1 pr-1 truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="h-5 w-5 rounded-md border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Hapus Item"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 font-medium">
                      <span>
                        @ Rp {hargaTampil.toLocaleString("id-ID")} /{" "}
                        {isBig ? item.unit_big : item.unit || "pcs"}
                      </span>
                      {item.unit_big && item.conversion > 1 && (
                        <span className="bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                          1 {item.unit_big} = {item.conversion}{" "}
                          {item.unit || "Pcs"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {item.unit_big ? (
                          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => isBig && toggleUnitChoice(item.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                                !isBig
                                  ? "bg-blue-600 text-white shadow-xs font-black"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              {item.unit || "Pcs"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                !isBig && toggleUnitChoice(item.id)
                              }
                              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                                isBig
                                  ? "bg-blue-600 text-white shadow-xs font-black"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              {item.unit_big || "Dus"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-500 px-1">
                            {item.unit || "Pcs"}
                          </span>
                        )}

                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                          <button
                            type="button"
                            onClick={() => decreaseQty(item.id)}
                            className="h-7 w-7 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-black flex items-center justify-center transition-colors cursor-pointer border-r border-slate-200"
                            title="Kurangi Qty"
                          >
                            <Minus className="h-2.5 w-2.5 stroke-[3]" />
                          </button>
                          <QuantityInput
                            itemId={item.id}
                            value={item.qty}
                            onChange={(qty) => setQty(item.id, qty)}
                            onRemove={() => removeFromCart(item.id)}
                          />
                          <button
                            type="button"
                            onClick={() => addToCart(item, item.unit_choice)}
                            className="h-7 w-7 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black flex items-center justify-center transition-colors cursor-pointer"
                            title="Tambah Qty"
                          >
                            <Plus className="h-2.5 w-2.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-xs sm:text-sm text-blue-600">
                          Rp {(hargaTampil * item.qty).toLocaleString("id-ID")}
                        </span>
                        {isBig && item.conversion > 1 && (
                          <p className="text-[9px] text-slate-400 font-semibold">
                            ({item.qty * item.conversion} {item.unit || "pcs"})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Checkout & Actions Area */}
          <div className="border-t border-slate-200 bg-white p-4 sm:p-5 space-y-3">
            {discountAmount > 0 && (
              <div className="space-y-1 text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {totalNormal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-red-500 font-black">
                  <span>Diskon Member</span>
                  <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                TOTAL TAGIHAN
              </span>
              <h2 className="text-1xl sm:text-1xl xl xl font-black text-slate-700 tracking-tight">
                Rp {grandTotal.toLocaleString("id-ID")}
              </h2>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowHoldModal(true)}
                disabled={cart.length === 0}
                className="flex-1 h-11 sm:h-12 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed text-amber-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Tahan/Simpan keranjang saat ini (F4)"
              >
                <Inbox className="h-4 w-4 text-amber-700" />
                <span>SIMPAN KERANJANG</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0 || !isShiftActive}
                className="flex-1 h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Bayar"
              >
                <CreditCard className="h-5 w-5" />
                <span>BAYAR</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <OpenShiftModal
        isOpen={showOpenShiftModal}
        onClose={() => setShowOpenShiftModal(false)}
        onSuccess={() => {
          setShowOpenShiftModal(false);
          checkShift();
          refetch();
        }}
      />

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSuccess={() => {
          setShowProductModal(false);
          refetch();
        }}
        existingProduct={null}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        grandTotal={grandTotal}
        memberId={selectedMember?.id}
        discountAmount={discountAmount}
        onSuccess={(data) => {
          setShowPaymentModal(false);
          setLastTransaction(data);
          setShowReceipt(true);
          refetch();
          checkShift();
        }}
        onShiftRequired={() => {
          setShowPaymentModal(false);
          setShowOpenShiftModal(true);
        }}
      />

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setLastTransaction(null);
        }}
        transaction={lastTransaction}
      />

      <HoldCartModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onConfirm={(note) => holdCurrentCart(note)}
      />

      <HeldCartsModal
        isOpen={showHeldCartsModal}
        onClose={() => setShowHeldCartsModal(false)}
      />

      <StaleShiftModal
        isOpen={!!showStaleShiftModal}
        onClose={() => setShowStaleShiftModal?.(false)}
        staleShiftInfo={staleShiftInfo || null}
        onCloseShiftClick={() => {
          setShowStaleShiftModal?.(false);
          router.push("/cashier/cashSummary");
        }}
      />

      <div className="hidden print:block">
        <PrintableReceipt transaction={lastTransaction} />
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <h3 className="font-black text-slate-900 text-lg">
              Yakin hapus semua item?
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2">
              Keranjang belanja Anda akan dikosongkan sepenuhnya.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tidak
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPriceId !== null &&
        (() => {
          const editItem = cart.find((item: any) => item.id === editingPriceId);
          if (!editItem) return null;
          const isBig =
            editItem.unit_choice === "big" && editItem.price_big > 0;
          const tempPriceNum = parseInt(tempPrice) || 0;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Edit Harga Satuan
                      </p>
                      <h3 className="font-black text-slate-900 text-base mt-0.5 truncate max-w-[250px]">
                        {editItem.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingPriceId(null)}
                      className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Harga Satuan Baru
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={
                          tempPriceNum === 0
                            ? ""
                            : tempPriceNum.toLocaleString("id-ID")
                        }
                        onChange={(e) =>
                          setTempPrice(e.target.value.replace(/\D/g, ""))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const newPrice = parseInt(tempPrice) || 0;
                            setCustomPrice(
                              editItem.id,
                              newPrice > 0 ? newPrice : undefined,
                            );
                            setEditingPriceId(null);
                          } else if (e.key === "Escape") {
                            setEditingPriceId(null);
                          }
                        }}
                        className="w-full h-14 rounded-xl border-2 border-slate-200 pl-12 pr-4 text-xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all"
                        autoFocus
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 pb-5 space-y-2">
                  <div className="flex gap-2">
                    {editItem.custom_price ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPrice(editItem.id, undefined);
                          setEditingPriceId(null);
                        }}
                        className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        Reset Harga
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        const newPrice = parseInt(tempPrice) || 0;
                        setCustomPrice(
                          editItem.id,
                          newPrice > 0 ? newPrice : undefined,
                        );
                        setEditingPriceId(null);
                      }}
                      className={`${
                        editItem.custom_price ? "flex-1" : "w-full"
                      } h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-wider transition-colors shadow-md shadow-blue-600/20 cursor-pointer`}
                    >
                      Simpan Harga
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPriceId(null)}
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
