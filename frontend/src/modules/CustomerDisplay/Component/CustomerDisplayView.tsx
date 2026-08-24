"use client";

import { ShoppingBag, Sparkles, CheckCircle2, User, CreditCard } from "lucide-react";
import type { CustomerDisplayCartItemDAO } from "../DAO/customerDisplay.dao";

interface CustomerDisplayViewProps {
  cart: CustomerDisplayCartItemDAO[];
  totalNormal: number;
  discountAmount: number;
  grandTotal: number;
  selectedMember: any;
  lastTransaction: any;
}

export function CustomerDisplayView({
  cart,
  totalNormal,
  discountAmount,
  grandTotal,
  selectedMember,
  lastTransaction,
}: CustomerDisplayViewProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans select-none overflow-hidden relative">
      {/* Ported Custom Minimalist Scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}} />

      {/* Header */}
      <header className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-8 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">GoPOS</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Layar Pelanggan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-300">Tersambung Ke Kasir</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {cart.length === 0 ? (
          /* Welcome Screen when Cart is Empty */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
            <div className="h-24 w-24 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6 animate-bounce duration-1000">
              <Sparkles className="h-12 w-12 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Selamat Datang di Toko Kami</h2>
            <p className="text-slate-400 text-sm max-w-md mt-3 leading-relaxed">
              Daftar belanjaan Anda akan muncul di layar ini secara real-time saat kasir mulai memindai produk. Terima kasih telah berbelanja dengan kami!
            </p>
          </div>
        ) : (
          /* Cart Screen */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Panel: Items List (Scrollable) */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 border-r border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-black text-slate-300 uppercase tracking-wider text-xs">Daftar Barang Belanja</h3>
                <span className="px-3 py-1 rounded bg-slate-800 text-[10px] font-extrabold text-blue-400 uppercase">
                  {cart.reduce((sum, item) => sum + item.qty, 0)} Item
                </span>
              </div>

              {/* Scrollable container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3.5">
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
                      className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-4 transition-all hover:border-slate-700/80"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-base text-white truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400 uppercase">
                            {isBig ? `Grosir (${item.unit_big})` : `Eceran (${item.unit})`}
                          </span>
                          {isMemberPrice && !item.custom_price && (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Harga Member
                            </span>
                          )}
                          {item.custom_price ? (
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                              Harga Khusus
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div className="text-slate-400 text-xs">
                          <div>Rp {hargaSatuan.toLocaleString("id-ID")}</div>
                          <div className="font-extrabold text-slate-300 mt-0.5">x {item.qty}</div>
                        </div>
                        <div className="text-lg font-black text-blue-400 min-w-[100px]">
                          Rp {itemSubtotal.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Shopping Summary (Fixed/Sticky Sidebar) */}
            <div className="w-full lg:w-96 p-6 flex flex-col justify-between shrink-0 bg-slate-950/30 border-t lg:border-t-0 border-slate-800">
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-slate-400 uppercase tracking-wider text-[10px] mb-3">Informasi Pelanggan</h3>
                  {selectedMember ? (
                    <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/25 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{selectedMember.name}</p>
                        <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider mt-0.5">Kode: {selectedMember.member_code}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3.5 text-slate-500">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Pelanggan Umum</p>
                        <p className="text-[10px] uppercase tracking-wider mt-0.5">Bukan member</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-5 space-y-3.5 text-sm font-semibold">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>Rp {totalNormal.toLocaleString("id-ID")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/15">
                      <span>Diskon Member</span>
                      <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Display Section */}
              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Belanja</p>
                <div className="text-4xl font-black text-emerald-400 tracking-tight mt-2 drop-shadow-sm">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span>Silakan Lakukan Pembayaran</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Full-Screen Checkout Success Overlay */}
      {lastTransaction && (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
          
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-pulse" />
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight">Transaksi Berhasil!</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm">
            Terima kasih telah melakukan pembayaran. Detail transaksi Anda dapat dilihat di bawah ini.
          </p>

          <div className="my-8 w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3.5 text-left text-sm font-semibold">
            <div className="flex justify-between border-b border-slate-800/60 pb-3">
              <span className="text-slate-400">Nomor Struk</span>
              <span className="text-white font-bold">{lastTransaction.transaction_code}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Metode Bayar</span>
              <span className="text-white uppercase font-bold">{lastTransaction.payment_method}</span>
            </div>

            <div className="flex justify-between pt-1 text-slate-300">
              <span>Total Belanja</span>
              <span className="text-emerald-400 font-black">Rp {lastTransaction.total_amount.toLocaleString("id-ID")}</span>
            </div>

            {lastTransaction.change_amount > 0 && (
              <div className="flex justify-between border-t border-slate-800/80 pt-3 mt-3">
                <span className="text-slate-400 font-bold">Kembalian</span>
                <span className="text-xl font-black text-emerald-400">Rp {lastTransaction.change_amount.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
            Menunggu transaksi berikutnya...
          </p>
        </div>
      )}
    </div>
  );
}
