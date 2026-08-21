"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Check,
  Edit,
  Pause,
  Sparkles,
} from "lucide-react";
import { PaymentModal } from "@/features/cashier/components/PaymentModal";
import { ReceiptModal } from "@/features/cashier/components/ReceiptModal";
import { PrintableReceipt } from "@/features/cashier/components/PrintableReceipt";
import { OpenShiftModal } from "@/features/cashier/components/OpenShiftModal";
import { HoldCartModal } from "@/features/cashier/components/HoldCartModal";
import { HeldCartsModal } from "@/features/cashier/components/HeldCartsModal";
import { ProductModal } from "@/features/products/components/ProductModal";
import Navbar from "@/features/cashier/components/Navbar";
import { useCashierPage } from "@/features/cashier/hooks/useCashierPage";

interface QuantityInputProps {
  itemId: number;
  value: number;
  onChange: (qty: number) => void;
  onRemove: () => void;
}

const QuantityInput = ({ itemId, value, onChange, onRemove }: QuantityInputProps) => {
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
      className="font-mono text-sm font-black w-14 h-9 text-center bg-white border border-slate-300 rounded-xl shadow-inner outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900"
    />
  );
};

export default function CashierPage() {
  const router = useRouter();
  const {
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
  } = useCashierPage();

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);

  useEffect(() => {
    loadHeldCarts();
  }, [loadHeldCarts]);

  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.push("/login");
    }
  }, [isHydrated, currentUser, router]);

  if (!isHydrated || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Navbar
        isShiftActive={isShiftActive}
        onOpenShiftClick={() => setShowOpenShiftModal(true)}
        onCloseShiftClick={() => router.push("/cashier/cashSummary")}
        onRecallClick={() => setShowHeldCartsModal(true)}
      />

      <main className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <section className="flex flex-[0.65] flex-col overflow-hidden border-r border-slate-200">
          <div className="bg-slate-50 p-6 z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
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
                  className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm font-bold focus:border-blue-600 outline-none"
                  placeholder="Cari barang..."
                />
              </div>

              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                title="Tambah produk baru ke sistem"
                className="h-12 px-4 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider hover:bg-blue-100 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <PackagePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Produk Baru</span>
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6 grid grid-cols-3 gap-4">
            {!isShiftActive ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center gap-3">
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
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Buka Shift Sekarang
                </button>
              </div>
            ) : loading ? (
              <div className="col-span-3 flex justify-center py-24">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center gap-3">
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
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <PackagePlus className="h-3.5 w-3.5" /> Tambah Produk Baru
                </button>
              </div>
            ) : (
              products.map((product: any) => {
                const cartItem = cart.find((item: any) => item.id === product.id);
                const inCartQty = cartItem ? cartItem.qty : 0;

                return (
                  <div
                    key={product.id}
                    className={`p-4 bg-white border rounded-2xl flex flex-col justify-between transition-all relative ${
                      inCartQty > 0
                        ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md bg-blue-50/10"
                        : "border-slate-200 hover:border-blue-500 shadow-sm"
                    }`}
                  >
                    {inCartQty > 0 && (
                      <span className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white text-xs font-black h-7 w-7 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse z-10">
                        {inCartQty}
                      </span>
                    )}
                    <div>
                      <h3 className="font-black text-sm text-slate-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-blue-600 font-extrabold text-sm mt-1">
                        Rp {product.price.toLocaleString("id-ID")}
                      </p>
                      {product.unit_big && (
                        <p className="text-[11px] text-amber-700 font-mono font-bold mt-1 flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" /> Grosir: 1 {product.unit_big} = {product.conversion}{" "}
                          {product.unit}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          product.stock <= (product.min_stock ?? 5)
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Stok: {product.stock}
                      </span>

                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-blue-50 border-2 border-blue-600 p-1 rounded-xl shadow-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQty(product.id);
                            }}
                            className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-black flex items-center justify-center transition-all cursor-pointer"
                            title="Kurangi Qty"
                          >
                            <Minus className="h-4 w-4 stroke-[3]" />
                          </button>
                          <span className="w-6 text-center font-mono font-black text-sm text-blue-700">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, "small");
                            }}
                            className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                            title="Tambah Qty"
                          >
                            <Plus className="h-4 w-4 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product, "small")}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[3]" /> Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="flex flex-[0.35] flex-col bg-slate-50 relative z-20">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-sm text-slate-800">
              Keranjang Belanja
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-500 font-bold flex items-center gap-1 hover:text-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Bersihkan
              </button>
            )}
          </div>

          {/* Member Selection Panel */}
          {cart.length > 0 && (
            <div className="px-4 py-3 bg-white border-b border-slate-200">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Pilih Member / Pelanggan
              </label>
              <select
                value={selectedMember?.id || ""}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const found = members.find((m: any) => m.id === id);
                  setSelectedMember(found || null);
                }}
                className="w-full h-10 px-3 text-xs font-bold border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-all bg-white text-slate-700 cursor-pointer"
              >
                <option value="">-- Umum (Bukan Member) --</option>
                {members.map((mbr: any) => (
                  <option key={mbr.id} value={mbr.id}>
                    {mbr.name} ({mbr.member_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item: any) => {
              const isBig = item.unit_choice === "big" && item.price_big > 0;
              const isMemberPrice = !isBig && selectedMember && item.price_member > 0;
              const hargaTampil = item.custom_price != null && item.custom_price > 0
                ? item.custom_price
                : (isBig 
                  ? item.price_big 
                  : (isMemberPrice ? item.price_member : item.price));
              
              const isOutOfStock = false;
              
              return (
                <div
                  key={item.id}
                  className="p-3 bg-white border rounded-xl flex flex-col gap-2 shadow-sm border-slate-200"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-slate-800 truncate max-w-[180px]">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {item.unit_big ? (
                      <button
                        type="button"
                        onClick={() => toggleUnitChoice(item.id)}
                        className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isBig
                            ? "bg-amber-500 border-amber-600 text-white"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                      >
                        {isBig
                          ? `GROSIR (${item.unit_big})`
                          : `ECERAN (${item.unit})`}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        Satuan: {item.unit}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                      <button
                        type="button"
                        onClick={() => decreaseQty(item.id)}
                        className="h-9 w-9 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-900 border border-slate-200 shadow-sm font-black flex items-center justify-center transition-all cursor-pointer"
                        title="Kurangi Qty"
                      >
                        <Minus className="h-4 w-4 stroke-[3]" />
                      </button>
                      <QuantityInput
                        itemId={item.id}
                        value={item.qty}
                        onChange={(qty) => setQty(item.id, qty)}
                        onRemove={() => removeFromCart(item.id)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          addToCart(item as any, item.unit_choice)
                        }
                        disabled={isOutOfStock}
                        className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black flex items-center justify-center transition-all shadow-md shadow-blue-600/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Tambah Qty"
                      >
                        <Plus className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {!isBig && item.conversion > 1 && item.unit_big && item.qty >= item.conversion && (
                    <div className="mt-1 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          Dapat dipecah ke <strong>{Math.floor(item.qty / item.conversion)} {item.unit_big}</strong> (Grosir) + <strong>{item.qty % item.conversion} {item.unit}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const conversion = item.conversion || 1;
                          const bigQty = Math.floor(item.qty / conversion);
                          const remainderQty = item.qty % conversion;
                          const productObj = products.find((p) => p.id === item.id);
                          if (productObj && bigQty > 0) {
                            if (remainderQty > 0) {
                              setQty(item.id, remainderQty);
                            } else {
                              removeFromCart(item.id);
                            }
                            for (let i = 0; i < bigQty; i++) {
                              addToCart(productObj, "big");
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        ⚡ Terapkan Paket Dus
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-semibold">Subtotal</span>
                    {editingPriceId === item.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[10px] font-bold">Rp</span>
                        <input
                          type="text"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const newPrice = parseInt(tempPrice) || 0;
                              setCustomPrice(item.id, newPrice > 0 ? newPrice : undefined);
                              setEditingPriceId(null);
                            } else if (e.key === "Escape") {
                              setEditingPriceId(null);
                            }
                          }}
                          className="w-16 h-7 px-1 text-[10px] font-bold border border-blue-400 rounded outline-none bg-white text-slate-800"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            const newPrice = parseInt(tempPrice) || 0;
                            setCustomPrice(item.id, newPrice > 0 ? newPrice : undefined);
                            setEditingPriceId(null);
                          }}
                          className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="font-black text-xs text-blue-600">
                          {isMemberPrice && !item.custom_price && (
                            <span className="text-[10px] line-through text-slate-400 font-bold mr-1">
                              Rp {(item.price * item.qty).toLocaleString("id-ID")}
                            </span>
                          )}
                          {item.custom_price ? (
                            <span className="text-[9px] text-amber-600 font-bold mr-1 bg-amber-50 px-1 rounded border border-amber-200">
                              Pas
                            </span>
                          ) : null}
                          Rp {(hargaTampil * item.qty).toLocaleString("id-ID")}
                        </span>
                        <button
                          onClick={() => {
                            setEditingPriceId(item.id);
                            setTempPrice(hargaTampil.toString());
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Harga Satuan"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-3.5">
            {discountAmount > 0 && (
              <div className="space-y-1.5 text-xs font-semibold text-slate-500 border-b border-slate-200/60 pb-3">
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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Pembayaran
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                Rp {grandTotal.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowHoldModal(true)}
                disabled={cart.length === 0}
                className="flex h-14 flex-[0.35] items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Tunda Transaksi / Simpan Keranjang"
              >
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Simpan</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0 || !isShiftActive}
                className="flex h-14 flex-[0.65] items-center justify-center gap-3 rounded-xl bg-blue-600 text-base font-black uppercase text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <CreditCard className="h-5 w-5" /> Bayar Sekarang
              </button>
            </div>
          </div>
        </section>
      </main>

      <OpenShiftModal
        isOpen={showOpenShiftModal}
        onClose={() => setShowOpenShiftModal(false)}
        onSuccess={() => { setShowOpenShiftModal(false); checkShift(); refetch(); }}
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
        onClose={() => setShowReceipt(false)}
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

      {/* Hidden printable receipt for thermal printer */}
      <div className="hidden print:block">
        <PrintableReceipt transaction={lastTransaction} />
      </div>

      {/* Confirmation Modal for Clearing Cart */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <h3 className="font-black text-slate-900 text-lg">Yakin hapus semua item?</h3>
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
    </div>
  );
}
