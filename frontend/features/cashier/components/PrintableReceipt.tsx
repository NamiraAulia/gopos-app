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
}

export const PrintableReceipt = ({
  transaction,
  shopName = "GoPOS STORE",
  shopAddress = "Jl. Raya Utama No. 123, Jakarta",
  shopPhone = "0812-3456-7890",
  showPrintButton = false,
}: PrintableReceiptProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

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

    try {
      if (Capacitor.isNativePlatform()) {
        // Cek status printer thermal
        const status = await Printer.checkPrinterStatus();
        if (!status.connected) {
          throw new Error(status.message || "Printer thermal internal tidak terhubung atau tidak siap.");
        }
      }

      await handleReceiptPrint({
        transaction,
        shopName,
        shopAddress,
        shopPhone,
      });
    } catch (err: any) {
      console.error("Gagal mencetak struk:", err);
      setPrintError(err.message || "Gagal mencetak struk. Pastikan printer terhubung.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Pesan Error / Alert jika print gagal */}
      {printError && (
        <div className="w-full max-w-[58mm] mb-3 print:hidden">
          <Alert type="error" message={printError} />
        </div>
      )}

      {/* Tombol Cetak jika dipanggil sebagai komponen aktif */}
      {showPrintButton && (
        <div className="mb-4 print:hidden w-full max-w-[58mm]">
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

      {/* Tampilan Struk Thermal */}
      <div className="struk-thermal font-mono text-[11px] leading-relaxed text-black w-full max-w-[58mm] mx-auto p-4 bg-white select-none">
        {/* Header */}
        <div className="text-center mb-3">
          <h2 className="font-bold text-sm uppercase tracking-wide">{shopName}</h2>
          <p className="text-[9px] leading-tight text-neutral-700 mt-1">{shopAddress}</p>
          <p className="text-[9px] text-neutral-700">Telp: {shopPhone}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Info Transaksi */}
        <div className="space-y-0.5 text-[9px] text-neutral-800">
          <div className="flex justify-between">
            <span>No. Struk:</span>
            <span className="font-bold">{transaction.transaction_code}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pembayaran:</span>
            <span className="uppercase font-bold">{transaction.payment_method}</span>
          </div>
          {transaction.member && (
            <div className="flex justify-between border border-dashed border-black/40 p-1 mt-1 rounded bg-slate-50 font-bold">
              <span>Pelanggan:</span>
              <span>
                {transaction.member.name} ({transaction.member.member_code})
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Daftar Item */}
        <div className="space-y-1.5 text-[9px] text-neutral-800">
          {transaction.items?.map((item, index) => {
            const itemPrice = item.price || (item.qty > 0 ? item.subtotal / item.qty : 0);
            return (
              <div key={item.id || index} className="space-y-0.5">
                <div className="font-semibold text-neutral-900">{item.product_name}</div>
                <div className="flex justify-between">
                  <span>
                    {item.qty} x Rp {itemPrice.toLocaleString("id-ID")}
                  </span>
                  <span className="font-semibold">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Total & Rincian Pembayaran */}
        <div className="space-y-1 text-[9px] text-neutral-800">
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon Member:</span>
              <span>-Rp {discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black/20">
            <span>TOTAL AKHIR:</span>
            <span>Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>

          {transaction.payment_method.toLowerCase() === "cash" && (
            <>
              <div className="flex justify-between pt-1">
                <span>TUNAI:</span>
                <span>Rp {cashPaid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>KEMBALIAN:</span>
                <span className="font-bold">Rp {change.toLocaleString("id-ID")}</span>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-3" />

        {/* Footer */}
        <div className="text-center text-[9px] text-neutral-700 space-y-1">
          <p className="font-bold uppercase tracking-wider text-black">Terima Kasih</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          <p className="text-[8px] text-neutral-400 mt-2">Powered by GoPOS</p>
        </div>
      </div>
    </div>
  );
};
