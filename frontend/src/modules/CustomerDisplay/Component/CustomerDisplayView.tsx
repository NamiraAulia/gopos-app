"use client";

import { ShoppingBag, Sparkles, CheckCircle2, User, CreditCard, Banknote } from "lucide-react";
import type { CustomerDisplayCartItemDAO } from "../DAO/customerDisplay.dao";

interface CustomerDisplayViewProps {
  cart: CustomerDisplayCartItemDAO[];
  totalNormal: number;
  discountAmount: number;
  grandTotal: number;
  selectedMember: any;
  lastTransaction: any;
  isPaying?: boolean;
}

export function CustomerDisplayView({
  cart,
  totalNormal,
  discountAmount,
  grandTotal,
  selectedMember,
  lastTransaction,
  isPaying = false,
}: CustomerDisplayViewProps) {
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none overflow-hidden relative">
      {/* Light Theme Scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />

      {/* Compact Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">GoPOS</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Layar Pelanggan</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Kasir Aktif</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* State 1: Cashier Clicked "Bayar Sekarang" -> Display Total Only */}
        {isPaying && !lastTransaction ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-slate-50">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3 text-blue-600">
                <Banknote className="h-7 w-7 animate-pulse" />
              </div>

              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pembayaran</p>

              <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight my-2">
                Rp {grandTotal.toLocaleString("id-ID")}
              </div>

              {selectedMember && (
                <div className="mb-3 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                  <User className="h-3.5 w-3.5" />
                  <span>Member: {selectedMember.name}</span>
                </div>
              )}

              <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-bold">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Silakan Lakukan Pembayaran Kepada Kasir</span>
              </div>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* State 2: Welcome Screen when Cart is Empty */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 text-blue-600 animate-bounce">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 text-xs max-w-xs mt-2 leading-relaxed">
              Daftar belanjaan Anda akan muncul di layar ini secara real-time saat kasir mulai memindai produk.
            </p>
          </div>
        ) : (
          /* State 3: Compact Single-Column Layout for Small 3-inch Screens */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar: Item count & optional member badge */}
            <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between shrink-0 text-xs">
              <span className="font-extrabold text-slate-600">Daftar Belanja ({totalItemCount} item)</span>
              {selectedMember ? (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px] truncate max-w-[140px]">
                  Member: {selectedMember.name}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Pelanggan Umum</span>
              )}
            </div>

            {/* Scrollable Item List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {cart.map((item) => {
                const isBig = item.unit_choice === "big" && item.price_big > 0;
                const isMemberPrice = !isBig && selectedMember && item.price_member > 0;
                const hargaSatuan = item.custom_price != null && item.custom_price > 0
                  ? item.custom_price
                  : (isBig
                    ? item.price_big
                    : (isMemberPrice ? item.price_member : item.price));
                const itemSubtotal = hargaSatuan * item.qty;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{item.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-600 uppercase">
                          {isBig ? `Grosir (${item.unit_big})` : `Eceran (${item.unit})`}
                        </span>
                        {isMemberPrice && !item.custom_price && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            Member
                          </span>
                        )}
                        {item.custom_price ? (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                            Khusus
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Rp {hargaSatuan.toLocaleString("id-ID")} <span className="font-bold text-slate-700">x{item.qty}</span>
                      </div>
                      <div className="text-base font-black text-blue-600">
                        Rp {itemSubtotal.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Total Footer Bar (Maximized for Small Screen) */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-lg shrink-0">
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs font-semibold text-rose-600 mb-1">
                  <span>Diskon Member</span>
                  <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Belanja</p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-tight">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Siap Bayar</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Full-Screen Checkout Success Overlay */}
      {lastTransaction && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-xs bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-600">
              <CheckCircle2 className="h-8 w-8 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Transaksi Berhasil!</h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Terima kasih telah berbelanja.
            </p>

            <div className="my-4 w-full rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-left text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Struk</span>
                <span className="text-slate-900 font-bold">{lastTransaction.transaction_code}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Metode</span>
                <span className="text-slate-900 uppercase font-bold">{lastTransaction.payment_method}</span>
              </div>

              <div className="flex justify-between pt-1 text-slate-700">
                <span>Total</span>
                <span className="text-emerald-600 font-black">Rp {lastTransaction.total_amount.toLocaleString("id-ID")}</span>
              </div>

              {lastTransaction.change_amount > 0 && (
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-700 font-bold">Kembalian</span>
                  <span className="text-base font-black text-emerald-600">Rp {lastTransaction.change_amount.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Menunggu transaksi berikutnya...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}



