"use client";

import React, { useState } from "react";
import { Printer, handleReceiptPrint } from "@/lib/printer";
import { Alert } from "@/components/ui/Alert";
import { Loader2, Printer as PrinterIcon } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export interface ReceiptItem {
  id?: number;
  product_name: string;
  qty: number;
  price?: number;
  subtotal: number;
}

export interface ReceiptTransaction {
  transaction_code: string;
  created_at?: string;
  payment_method: string;
  amount_paid?: number;
  total_amount: number;
  change_amount?: number;
  discount_amount?: number;
  items?: ReceiptItem[];
  member?: {
    name: string;
    member_code: string;
  } | null;
}

interface PrintableReceiptProps {
  transaction: ReceiptTransaction | null;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  showPrintButton?: boolean;
  paperSize?: "37mm" | "58mm" | "80mm";
}

export const PrintableReceipt = ({
  transaction,
  shopName = "GoPOS STORE",
  shopAddress = "Jl. Raya Utama No. 123, Jakarta",
  shopPhone = "0812-3456-7890",
  showPrintButton = false,
  paperSize: propPaperSize,
}: PrintableReceiptProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  const [paperSize, setPaperSize] = useState<"37mm" | "58mm" | "80mm">("80mm");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gopos_paper_size") as "37mm" | "58mm" | "80mm";
      if (saved) setPaperSize(saved);
    }
  }, []);

  const activePaperSize = propPaperSize || paperSize || "80mm";
  const widthClass = activePaperSize === "37mm" ? "max-w-[37mm]" : activePaperSize === "58mm" ? "max-w-[58mm]" : "max-w-[80mm] w-[80mm]";

  if (!transaction) return null;

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleString("id-ID");
    try {
      return new Date(dateStr).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const cashPaid = transaction.amount_paid ?? transaction.total_amount;
  const change = transaction.change_amount ?? 0;
  const discount = transaction.discount_amount ?? 0;

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Printer.checkPrinterStatus();
        if (!status.connected) {
          throw new Error(status.message || "Printer thermal/USB tidak terhubung atau tidak siap.");
        }
      }

      const res = await handleReceiptPrint({
        transaction,
        shopName,
        shopAddress,
        shopPhone,
      });

      if (res && res.success === false) {
        throw new Error(res.message || "Gagal mengirim data cetak ke printer.");
      }
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 4000);
    } catch (err: any) {
      console.error("Gagal mencetak struk:", err);
      setPrintError(err.message || "Periksa koneksi printer.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* CSS Dinamis untuk Cetak Browser (window.print) */}
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: ${activePaperSize === "80mm" ? "80mm auto" : activePaperSize === "58mm" ? "58mm auto" : "37mm auto"} !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: ${activePaperSize === "80mm" ? "80mm" : activePaperSize === "58mm" ? "58mm" : "37mm"} !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-weight: 800 !important;
            -webkit-font-smoothing: antialiased !important;
          }
          .struk-thermal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${activePaperSize === "80mm" ? "80mm" : activePaperSize === "58mm" ? "58mm" : "37mm"} !important;
            max-width: ${activePaperSize === "80mm" ? "80mm" : activePaperSize === "58mm" ? "58mm" : "37mm"} !important;
            margin: 0 !important;
            padding: ${activePaperSize === "80mm" ? "3mm 4mm" : activePaperSize === "58mm" ? "2mm 3mm" : "1mm 1.5mm"} !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-weight: 800 !important;
            color: #000000 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {/* Pesan Sukses */}
      {printSuccess && (
        <div className={`w-full ${widthClass} mb-3 print:hidden p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold`}>
          Struk berhasil dicetak
        </div>
      )}

      {/* Pesan Error / Alert jika print gagal dengan tombol Coba Cetak Lagi */}
      {printError && (
        <div className={`w-full ${widthClass} mb-3 print:hidden space-y-2`}>
          <Alert type="error" message={`Gagal mencetak struk: ${printError}. Periksa koneksi printer.`} />
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>Coba Cetak Lagi</span>
          </button>
        </div>
      )}

      {/* Tombol Cetak jika dipanggil sebagai komponen aktif */}
      {showPrintButton && (
        <div className={`mb-4 print:hidden w-full ${widthClass}`}>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            {isPrinting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mencetak Struk...</span>
              </>
            ) : (
              <>
                <PrinterIcon className="h-4 w-4" />
                <span>Cetak Struk Fisik</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tampilan Struk Thermal 80x50 Format Rapi & Bold High-Contrast */}
      <div className={`struk-thermal font-mono font-bold text-[12px] leading-tight text-black w-full ${widthClass} mx-auto p-4 bg-white select-none border border-slate-200 shadow-sm print:border-none print:shadow-none`}>
        {/* Header Toko */}
        <div className="text-center mb-3">
          <h2 className="font-black text-lg uppercase tracking-wider text-black">{shopName}</h2>
          <p className="text-[11px] font-bold leading-tight text-black mt-1">{shopAddress}</p>
          <p className="text-[11px] font-bold text-black">Telp: {shopPhone}</p>
        </div>

        {/* Pembatas Line Terang & Jelas */}
        <div className="border-t-2 border-dashed border-black my-2.5" />

        {/* Info Transaksi Rapi */}
        <div className="space-y-1 text-[11px] font-bold text-black">
          <div className="flex justify-between">
            <span className="font-bold">No. Struk:</span>
            <span className="font-black tracking-wide">{transaction.transaction_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Tanggal:</span>
            <span className="font-black">{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Pembayaran:</span>
            <span className="uppercase font-black">{transaction.payment_method}</span>
          </div>
          {transaction.member && (
            <div className="flex justify-between border-2 border-dashed border-black p-1.5 my-1 rounded font-black text-[11.5px]">
              <span>Pelanggan:</span>
              <span>
                {transaction.member.name} ({transaction.member.member_code})
              </span>
            </div>
          )}
        </div>

        {/* Pembatas Line */}
        <div className="border-t-2 border-dashed border-black my-2.5" />

        {/* Header Tabel Barang untuk 80mm */}
        <div className="flex justify-between text-[11px] font-black text-black pb-1 border-b border-black">
          <span>ITEM / BELANJAAN</span>
          <span>SUBTOTAL</span>
        </div>

        {/* Daftar Item Rapi & Bold */}
        <div className="space-y-2.5 py-2 text-[11.5px] font-bold text-black">
          {transaction.items?.map((item, index) => {
            const itemPrice = item.price || (item.qty > 0 ? item.subtotal / item.qty : 0);
            return (
              <div key={item.id || index} className="space-y-0.5">
                <div className="font-black text-[12.5px] text-black leading-tight tracking-tight">{item.product_name}</div>
                <div className="flex justify-between text-[11px] text-black">
                  <span className="font-bold">
                    {item.qty} x Rp {itemPrice.toLocaleString("id-ID")}
                  </span>
                  <span className="font-black">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total & Rincian Pembayaran Bold */}
        <div className="space-y-1.5 text-[11.5px] font-bold text-black">
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="font-bold">Diskon Member:</span>
              <span className="font-black">-Rp {discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base text-black pt-2 pb-1 border-y-2 border-black my-1">
            <span>TOTAL AKHIR:</span>
            <span>Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>

          {transaction.payment_method.toLowerCase() === "cash" && (
            <>
              <div className="flex justify-between pt-1 font-bold">
                <span>TUNAI:</span>
                <span className="font-black text-xs sm:text-sm">Rp {cashPaid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>KEMBALIAN:</span>
                <span className="font-black text-xs sm:text-sm">Rp {change.toLocaleString("id-ID")}</span>
              </div>
            </>
          )}
        </div>

        {/* Pembatas Line */}
        <div className="border-t-2 border-dashed border-black my-3" />

        {/* Footer Struk */}
        <div className="text-center text-[11px] font-bold text-black space-y-1">
          <p className="font-black uppercase tracking-wider text-black text-xs">Terima Kasih</p>
        </div>
      </div>
    </div>
  );
};
