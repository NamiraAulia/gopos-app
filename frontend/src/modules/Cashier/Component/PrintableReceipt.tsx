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
  shopName = "KURNIA TELUR",
  shopAddress = "Jl. Perumnas Raya Blok X No.7, Jakarta",
  shopPhone = "",
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
  const widthClass = activePaperSize === "37mm" ? "max-w-[35mm]" : activePaperSize === "58mm" ? "max-w-[52mm]" : "max-w-[70mm] w-[70mm]";
  const printWidthMm = activePaperSize === "37mm" ? "35mm" : activePaperSize === "58mm" ? "52mm" : "70mm";

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
            width: ${printWidthMm} !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 8.5pt !important;
            -webkit-font-smoothing: antialiased !important;
          }
          .struk-thermal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printWidthMm} !important;
            max-width: ${printWidthMm} !important;
            margin: 0 auto !important;
            padding: 2mm !important;
            box-sizing: border-box !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 8.5pt !important;
            line-height: 1.25 !important;
            color: #000000 !important;
            box-shadow: none !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
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

      {/* Tampilan Struk Thermal 80x50 Format Rapi & High-Contrast */}
      <div
        className={`struk-thermal font-mono text-[8.5pt] leading-tight text-black w-full ${widthClass} mx-auto p-[2mm] bg-white select-none border border-slate-200 shadow-sm print:border-none print:shadow-none box-sizing: border-box`}
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "8.5pt",
          lineHeight: "1.25",
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {/* Header Toko */}
        <div className="text-center mb-2">
          <h2 className="font-black text-[10.5pt] uppercase tracking-wider text-black break-words">{shopName}</h2>
          <p className="text-[8pt] font-bold leading-tight text-black mt-0.5 break-words">{shopAddress}</p>
          {shopPhone && <p className="text-[8pt] font-bold text-black break-words">Telp: {shopPhone}</p>}
        </div>

        {/* Pembatas Line Terang & Jelas */}
        <div className="border-t-2 border-dashed border-black my-1.5" />

        {/* Info Transaksi Rapi */}
        <div className="space-y-0.5 text-[8pt] font-bold text-black">
          <div className="flex justify-between items-start gap-1 min-w-0">
            <span className="font-bold shrink-0">No. Struk:</span>
            <span className="font-black tracking-wide text-right break-words min-w-0">{transaction.transaction_code}</span>
          </div>
          <div className="flex justify-between items-start gap-1 min-w-0">
            <span className="font-bold shrink-0">Tanggal:</span>
            <span className="font-black text-right break-words min-w-0">{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between items-start gap-1 min-w-0">
            <span className="font-bold shrink-0">Pembayaran:</span>
            <span className="uppercase font-black text-right break-words min-w-0">{transaction.payment_method}</span>
          </div>
          {transaction.member && (
            <div className="flex justify-between items-start gap-1 border-2 border-dashed border-black p-1 my-1 rounded font-black text-[8pt] min-w-0">
              <span className="shrink-0">Pelanggan:</span>
              <span className="text-right break-words min-w-0">
                {transaction.member.name} ({transaction.member.member_code})
              </span>
            </div>
          )}
        </div>

        {/* Pembatas Line */}
        {/* <div className="border-t-2 border-dashed border-black my-1.5" /> */}

        {/* Tabel Barang (table-layout: fixed agar subtotal tidak terdorong keluar) */}
        <table className="w-full table-fixed border-collapse my-1 text-[8pt]">
          <thead>
            <tr className="border-b border-black text-black">
              <th className="w-[58%] text-left py-0.5 font-black uppercase break-words">ITEM / BELANJAAN</th>
              <th className="w-[42%] text-right py-0.5 font-black uppercase break-words">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items?.map((item, index) => {
              const itemPrice = item.price || (item.qty > 0 ? item.subtotal / item.qty : 0);
              return (
                <tr key={item.id || index} className="align-top border-b border-dashed border-slate-200 last:border-none">
                  <td className="py-1 text-left break-words pr-1">
                    <div className="font-black text-[8.5pt] leading-tight text-black">{item.product_name}</div>
                    <div className="text-[7.5pt] text-black font-bold mt-0.5">
                      {item.qty} x Rp {itemPrice.toLocaleString("id-ID")}
                    </div>
                  </td>
                  <td className="py-1 text-right font-black text-[8pt] text-black break-words align-top">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pembatas Line */}
        {/* <div className="border-t border-dashed border-black my-1.5" /> */}

        {/* Total & Rincian Pembayaran Bold */}
        <div className="space-y-0.5 text-[8pt] font-bold text-black">
          {discount > 0 && (
            <div className="flex justify-between items-start gap-1 min-w-0">
              <span className="font-bold shrink-0">Diskon Member:</span>
              <span className="font-black text-right break-words min-w-0">-Rp {discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-black text-[9.5pt] text-black pt-1 pb-0.5 border-y-2 border-black my-1 min-w-0">
            <span className="shrink-0">TOTAL AKHIR:</span>
            <span className="text-right break-words min-w-0">Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>

          {transaction.payment_method.toLowerCase() === "cash" && (
            <>
              <div className="flex justify-between items-start gap-1 pt-0.5 font-bold min-w-0">
                <span className="shrink-0">TUNAI:</span>
                <span className="font-black text-right break-words min-w-0">Rp {cashPaid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-start gap-1 font-bold min-w-0">
                <span className="shrink-0">KEMBALIAN:</span>
                <span className="font-black text-right break-words min-w-0">Rp {change.toLocaleString("id-ID")}</span>
              </div>
            </>
          )}
        </div>

        {/* Pembatas Line */}
        {/* <div className="border-t-2 border-dashed border-black my-1.5" /> */}

        {/* Footer Struk */}
        <div className="text-center text-[8.5pt] font-bold text-black space-y-1">
          <p className="font-black uppercase tracking-wider text-black text-[8.5pt]">Terima Kasih</p>
        </div>
      </div>
    </div>
  );
};
