"use client";

import { useState } from "react";
import { ShieldCheck, Printer, ShoppingCart, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { handleReceiptPrint } from "@/lib/printer";
import { Alert } from "@/components/ui/Alert";

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
};

export const ReceiptModal = ({ isOpen, onClose, transaction }: ReceiptModalProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const res = await handleReceiptPrint({ transaction });
      if (res && res.success === false) {
        throw new Error(res.message || "Printer tidak merespon.");
      }
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 4000);
    } catch (err: any) {
      console.error("Print error in ReceiptModal:", err);
      setPrintError(err.message || "Tidak dapat terhubung ke printer.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col border-2 border-slate-200 max-h-[88vh] overflow-y-auto">
        <div className="p-8 pb-6 flex flex-col items-center border-b border-slate-100 bg-slate-50">
          <div className="h-18 w-18 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck className="h-10 w-10 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center leading-tight">Transaksi Berhasil</h2>
          <p className="text-center text-sm sm:text-base font-bold text-slate-500 mt-2">Stok gudang diperbarui otomatis.</p>
        </div>

        {/* Success Alert */}
        {printSuccess && (
          <div className="px-6 pt-4">
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-900 text-sm font-black flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 stroke-[2.5]" />
              <span>Struk berhasil dicetak</span>
            </div>
          </div>
        )}

        {/* Error Alert with Retry button */}
        {printError && (
          <div className="px-6 pt-4 space-y-2">
            <Alert type="error" message={`Gagal mencetak struk: ${printError}. Periksa koneksi printer.`} />
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 stroke-[2.5] ${isPrinting ? "animate-spin" : ""}`} />
              <span>Coba Cetak Lagi</span>
            </button>
          </div>
        )}

        <div className="p-6 bg-slate-50/80 m-6 mt-4 rounded-xl border-2 border-slate-200 space-y-2.5">
          <div className="flex justify-between text-base">
            <span className="font-bold text-slate-500">Nomor Struk</span>
            <span className="font-black text-slate-900">{transaction.transaction_code}</span>
          </div>
          {transaction.member && (
            <div className="flex justify-between text-base">
              <span className="font-bold text-slate-500">Member</span>
              <span className="font-black text-slate-900">{transaction.member.name}</span>
            </div>
          )}
          <div className="flex justify-between text-base">
            <span className="font-bold text-slate-500">Metode</span>
            <span className="font-black text-slate-900 uppercase">{transaction.payment_method}</span>
          </div>
          {transaction.payment_splits && transaction.payment_splits.length > 0 && (
            <div className="mb-3 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg space-y-1 text-xs">
              <span className="font-bold text-indigo-900 block text-[11px] uppercase tracking-wider">
                Rincian Split:
              </span>
              {transaction.payment_splits.map((s: any, idx: number) => (
                <div key={idx} className="flex justify-between text-slate-700 font-medium">
                  <span className="capitalize">
                    {s.method === "cash"
                      ? "Tunai"
                      : s.method === "qris"
                      ? "QRIS"
                      : s.method === "transfer"
                      ? `Bank ${s.bank_info ? `(${s.bank_info})` : ""}`
                      : "Kasbon"}
                  </span>
                  <span className="font-bold text-slate-900">
                    Rp {Number(s.amount).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
          {transaction.discount_amount > 0 && (
            <div className="flex justify-between text-sm mb-3">
              <span className="font-bold text-slate-500">Diskon Member</span>
              <span className="font-bold text-red-600">-Rp {transaction.discount_amount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Total Bayar</span>
            <span className="text-2xl font-black text-blue-600">Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>
          {transaction.change_amount > 0 && (
            <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Kembalian</span>
              <span className="text-xl font-black text-emerald-600">Rp {transaction.change_amount.toLocaleString("id-ID")}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 space-y-3 print:hidden">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full h-14 rounded-xl border-2 border-blue-600 bg-blue-50 text-base font-black text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            {isPrinting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Mencetak Struk...</span>
              </>
            ) : (
              <>
                <Printer className="h-5 w-5 stroke-[2.5]" />
                <span>Cetak Struk Fisik</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full h-13 rounded-xl border-2 border-slate-300 text-base font-black text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5 stroke-[2.5]" /> Tutup & Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};