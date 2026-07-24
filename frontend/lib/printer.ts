import { registerPlugin, Capacitor } from '@capacitor/core';
import { ReceiptData } from './types/receipt';

export interface PrinterPlugin {
  printReceipt(options: { receiptData: string }): Promise<{ success: boolean; message?: string }>;
  checkPrinterStatus(): Promise<{ connected: boolean; message?: string }>;
  checkRawBTInstalled(): Promise<{ installed: boolean }>;
}

export const Printer = registerPlugin<PrinterPlugin>('Printer');

export interface HandlePrintParams {
  transaction: any;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  cashierName?: string;
}

// Helpers for plain text receipt formatting (48 columns)
function wrapText(text: string, limit: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + (currentLine ? " " : "") + word).length <= limit) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
      while (currentLine.length > limit) {
        lines.push(currentLine.substring(0, limit));
        currentLine = currentLine.substring(limit);
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function centerAlign(text: string, width = 48): string {
  if (text.length >= width) {
    return text.substring(0, width);
  }
  const totalSpaces = width - text.length;
  const leftSpaces = Math.floor(totalSpaces / 2);
  const rightSpaces = totalSpaces - leftSpaces;
  return " ".repeat(leftSpaces) + text + " ".repeat(rightSpaces);
}

function centerAlignWrapped(text: string, width = 48): string {
  const lines = wrapText(text, width);
  return lines.map(line => centerAlign(line, width)).join("\n");
}

function formatTwoColumns(label: string, value: string, width = 48): string {
  const totalLen = label.length + value.length;
  if (totalLen >= width) {
    return label + " " + value;
  }
  const spaces = width - totalLen;
  return label + " ".repeat(spaces) + value;
}

function formatItemRow(name: string, qty: number, price: number, subtotal: number, width = 48): string {
  const priceStr = `Rp ${subtotal.toLocaleString("id-ID")}`;
  const qtyStr = `  ${qty} x Rp ${price.toLocaleString("id-ID")}`;
  
  const rightWidth = priceStr.length;
  const firstLineLimit = width - rightWidth - 1; // 1 space separation
  const indent = "  ";
  const indentLimit = width - indent.length;

  const nameLines = wrapText(name, firstLineLimit);
  let result = "";

  if (nameLines.length > 0) {
    const firstLineName = nameLines[0];
    const spacesNeeded = width - firstLineName.length - rightWidth;
    result += firstLineName + " ".repeat(spacesNeeded) + priceStr + "\n";

    for (let i = 1; i < nameLines.length; i++) {
      const subWrapped = wrapText(nameLines[i], indentLimit);
      for (const line of subWrapped) {
        result += indent + line + "\n";
      }
    }
  }

  result += qtyStr + "\n";
  return result;
}

export function generatePlainTextReceipt(data: ReceiptData): string {
  const width = 48;
  let receipt = "";

  // 1. Header toko center-aligned
  receipt += centerAlignWrapped(data.storeName, width) + "\n";
  if (data.storeAddress) {
    receipt += centerAlignWrapped(data.storeAddress, width) + "\n";
  }
  if (data.storePhone) {
    receipt += centerAlignWrapped(`Telp: ${data.storePhone}`, width) + "\n";
  }

  // Separator
  receipt += "-".repeat(width) + "\n";

  // Info Transaksi
  if (data.transactionCode) {
    receipt += formatTwoColumns("No. Struk:", data.transactionCode, width) + "\n";
  }
  receipt += formatTwoColumns("Tanggal:", data.transactionDate, width) + "\n";
  receipt += formatTwoColumns("Kasir:", data.cashierName, width) + "\n";
  receipt += formatTwoColumns("Pembayaran:", data.paymentMethod.toUpperCase(), width) + "\n";
  
  if (data.member) {
    receipt += formatTwoColumns("Pelanggan:", `${data.member.name} (${data.member.memberCode})`, width) + "\n";
  }

  // Separator
  receipt += "-".repeat(width) + "\n";

  // 2. Baris item
  for (const item of data.items) {
    receipt += formatItemRow(item.name, item.qty, item.price, item.subtotal, width);
  }

  // Separator
  receipt += "-".repeat(width) + "\n";

  // 3. Totals
  if (data.discount > 0) {
    receipt += formatTwoColumns("Subtotal:", `Rp ${data.subtotal.toLocaleString("id-ID")}`, width) + "\n";
    receipt += formatTwoColumns("Diskon:", `-Rp ${data.discount.toLocaleString("id-ID")}`, width) + "\n";
  }
  if (data.tax > 0) {
    receipt += formatTwoColumns("Pajak:", `Rp ${data.tax.toLocaleString("id-ID")}`, width) + "\n";
  }
  
  receipt += formatTwoColumns("TOTAL AKHIR:", `Rp ${data.total.toLocaleString("id-ID")}`, width) + "\n";
  
  if (data.paymentMethod.toLowerCase() === "cash" || data.paymentMethod.toLowerCase() === "tunai") {
    const paid = data.amountPaid ?? data.total;
    const change = data.changeAmount ?? 0;
    receipt += formatTwoColumns("TUNAI:", `Rp ${paid.toLocaleString("id-ID")}`, width) + "\n";
    receipt += formatTwoColumns("KEMBALIAN:", `Rp ${change.toLocaleString("id-ID")}`, width) + "\n";
  }

  // Separator
  receipt += "-".repeat(width) + "\n";

  // 4. Footer
  if (data.footerText) {
    receipt += centerAlignWrapped(data.footerText, width) + "\n";
  }
  receipt += centerAlignWrapped("Powered by GoPOS", width) + "\n";

  // 5. Newlines
  receipt += "\n\n\n\n\n";

  return receipt;
}

export function printViaRawBT(text: string): void {
  const encodedText = encodeURIComponent(text);
  const url = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a43.rawbt;end;`;

  const start = Date.now();
  
  let hasNavigated = false;
  const handleVisibilityChange = () => {
    if (document.hidden) {
      hasNavigated = true;
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  window.location.href = url;

  setTimeout(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    
    if (!hasNavigated && !document.hidden && Date.now() - start < 1500) {
      if (confirm("Gagal membuka RawBT. Apakah Anda ingin mengunduh aplikasi RawBT dari Google Play Store?")) {
        window.open("https://play.google.com/store/apps/details?id=ru.a43.rawbt", "_blank");
      }
    }
  }, 1000);
}

export async function isRawBTInstalled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const result = await Printer.checkRawBTInstalled();
    return result.installed;
  } catch (err) {
    console.error("Gagal memeriksa installasi RawBT:", err);
    return false;
  }
}

export async function handleReceiptPrint({
  transaction,
  shopName = "GoPOS STORE",
  shopAddress = "Jl. Raya Utama No. 123, Jakarta",
  shopPhone = "0812-3456-7890",
  cashierName = "Kasir",
}: HandlePrintParams): Promise<{ success: boolean; isNative: boolean; message?: string }> {
  if (!transaction) {
    throw new Error("Data transaksi tidak ditemukan.");
  }

  // Format data struk ke struktur ReceiptData JSON
  const receiptPayload: ReceiptData = {
    transactionCode: transaction.transaction_code || "-",
    storeName: shopName,
    storeAddress: shopAddress,
    storePhone: shopPhone,
    items: (transaction.items || []).map((item: any) => ({
      name: item.product_name || item.name || "Item",
      qty: item.qty || 1,
      price: item.price || (item.qty > 0 ? item.subtotal / item.qty : 0),
      subtotal: item.subtotal || 0,
    })),
    subtotal: (transaction.items || []).reduce((sum: number, i: any) => sum + (i.subtotal || 0), 0) || transaction.total_amount || 0,
    tax: 0,
    discount: transaction.discount_amount || 0,
    total: transaction.total_amount || 0,
    paymentMethod: transaction.payment_method || "CASH",
    cashierName: cashierName !== "Kasir" ? cashierName : (transaction.user?.name || "Kasir"),
    transactionDate: transaction.created_at
      ? new Date(transaction.created_at).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : new Date().toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    footerText: "Terima Kasih - Barang yang sudah dibeli tidak dapat ditukar/dikembalikan",
    amountPaid: transaction.amount_paid ?? transaction.total_amount,
    changeAmount: transaction.change_amount ?? 0,
    member: transaction.member
      ? {
          name: transaction.member.name,
          memberCode: transaction.member.phone || transaction.member.member_code || `#${transaction.member.id}`,
        }
      : null,
  };

  const plainText = generatePlainTextReceipt(receiptPayload);
  printViaRawBT(plainText);

  return { success: true, isNative: Capacitor.isNativePlatform(), message: "Struk dikirim ke RawBT" };
}

export type { ReceiptData };