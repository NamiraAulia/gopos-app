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

  const [paperSize, setPaperSize] = useState<"37mm" | "58mm" | "80mm">("37mm");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gopos_paper_size") as "37mm" | "58mm" | "80mm";
      if (saved) setPaperSize(saved);
    }
  }, []);

  const activePaperSize = propPaperSize || paperSize || "37mm";
  const widthClass = activePaperSize === "37mm" ? "max-w-[37mm]" : activePaperSize === "80mm" ? "max-w-[80mm]" : "max-w-[58mm]";

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
            size: auto !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-weight: 700 !important;
          }
          .struk-thermal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: ${activePaperSize === "37mm" ? "1mm 1.5mm" : "2mm 3mm"} !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-weight: 700 !important;
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

      {/* Tampilan Struk Thermal (Font Bolder, Bigger, Higher Contrast) */}
      <div className={`struk-thermal font-mono font-bold text-[11px] leading-snug text-black w-full ${widthClass} mx-auto p-3.5 bg-white select-none`}>
        {/* Header */}
        <div className="text-center mb-2.5">
          <h2 className="font-black text-base uppercase tracking-wider text-black">{shopName}</h2>
          <p className="text-[10px] font-bold leading-tight text-black mt-0.5">{shopAddress}</p>
          <p className="text-[10px] font-bold text-black">Telp: {shopPhone}</p>
        </div>

        {/* Pembatas Line */}
        <div className="border-t-2 border-dashed border-black my-2" />

        {/* Info Transaksi */}
        <div className="space-y-1 text-[10px] font-bold text-black">
          <div className="flex justify-between">
            <span>No. Struk:</span>
            <span className="font-black">{transaction.transaction_code}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span className="font-bold">{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pembayaran:</span>
            <span className="uppercase font-black">{transaction.payment_method}</span>
          </div>
          {transaction.member && (
            <div className="flex justify-between border-2 border-dashed border-black p-1 mt-1 rounded font-black">
              <span>Pelanggan:</span>
              <span>
                {transaction.member.name} ({transaction.member.member_code})
              </span>
            </div>
          )}
        </div>

        {/* Pembatas Line */}
        <div className="border-t-2 border-dashed border-black my-2" />

        {/* Daftar Item */}
        <div className="space-y-2 text-[10.5px] font-bold text-black">
          {transaction.items?.map((item, index) => {
            const itemPrice = item.price || (item.qty > 0 ? item.subtotal / item.qty : 0);
            return (
              <div key={item.id || index} className="space-y-0.5">
                <div className="font-black text-[11.5px] text-black leading-tight">{item.product_name}</div>
                <div className="flex justify-between text-[10.5px]">
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

        {/* Pembatas Line */}
        <div className="border-t-2 border-dashed border-black my-2" />

        {/* Total & Rincian Pembayaran */}
        <div className="space-y-1 text-[10.5px] font-bold text-black">
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon Member:</span>
              <span className="font-black">-Rp {discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-sm text-black pt-1.5 border-t-2 border-dashed border-black">
            <span>TOTAL AKHIR:</span>
            <span>Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>

          {transaction.payment_method.toLowerCase() === "cash" && (
            <>
              <div className="flex justify-between pt-1 font-bold">
                <span>TUNAI:</span>
                <span className="font-black">Rp {cashPaid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>KEMBALIAN:</span>
                <span className="font-black">Rp {change.toLocaleString("id-ID")}</span>
              </div>
            </>
          )}
        </div>

        {/* Pembatas Line */}
        <div className="border-t-2 border-dashed border-black my-2.5" />

        {/* Footer */}
        <div className="text-center text-[10px] font-bold text-black space-y-1">
          <p className="font-black uppercase tracking-wider text-black text-[11px]">Terima Kasih</p>
          <p className="font-bold">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          <p className="text-[9px] font-bold text-neutral-600 mt-2">Powered by GoPOS</p>
        </div>
      </div>
    </div>
  );
};
