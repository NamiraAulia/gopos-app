import { registerPlugin, Capacitor } from '@capacitor/core';
import { ReceiptData } from './types/receipt';
import { convertImageToEscPosRaster } from './printer-image-helper';

export interface PrinterDevice {
  vendorId: number;
  productId: number;
  deviceName: string;
  productName: string;
}

export interface PrinterPlugin {
  printReceipt(options: { text?: string; receiptData?: string; printerType?: string }): Promise<{ success: boolean; message?: string }>;
  checkPrinterStatus(): Promise<{
    connected: boolean;
    hasPermission: boolean;
    message?: string;
    printerType?: 'usb' | 'telpo_internal';
    vendorId?: number;
    productId?: number;
    candidateCount?: number;
  }>;
  checkRawBTInstalled(): Promise<{ installed: boolean }>;
  listAvailablePrinters(): Promise<{ printers: PrinterDevice[]; count: number }>;
  setPreferredPrinter(options: { vendorId: number; productId: number }): Promise<{ success: boolean; preferredPrinter?: string }>;
}

export const Printer = registerPlugin<PrinterPlugin>('Printer');

export interface ShopSettings {
  name?: string;
  address?: string;
  phone?: string;
  footer?: string;
  logo?: string; // base64 or URL
}

export interface HandlePrintParams {
  transaction: any;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  cashierName?: string;
  paperSize?: '37mm' | '58mm' | '80mm';
  shopSettings?: ShopSettings;
}

// -------------------------------------------------------------
// ESC/POS Command Builder for Thermal Printer (58mm / 80mm) (Zero Dep)
// -------------------------------------------------------------
export class EscPosBuilder {
  private buffer: number[] = [];
  private encoder = new TextEncoder();

  constructor() {
    this.initialize();
  }

  initialize() {
    this.buffer.push(0x1B, 0x40); // ESC @ (Initialize printer)
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02); // ESC a 2
    return this;
  }

  bold(on = true) {
    this.buffer.push(0x1B, 0x45, on ? 0x01 : 0x00); // ESC E n
    return this;
  }

  fontSizeLarge() {
    this.buffer.push(0x1D, 0x21, 0x11); // GS ! 0x11 (Double Width & Double Height)
    return this;
  }

  fontSizeNormal() {
    this.buffer.push(0x1D, 0x21, 0x00); // GS ! 0x00
    return this;
  }

  text(value: string) {
    const bytes = this.encoder.encode(value);
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  textLine(value: string) {
    this.text(value);
    this.buffer.push(0x0D, 0x0A); // CR LF (Carriage Return + Line Feed)
    return this;
  }

  lineFeed(lines = 1) {
    this.buffer.push(0x1B, 0x64, lines); // ESC d n (Print and feed n lines)
    return this;
  }

  cut() {
    this.buffer.push(0x1D, 0x56, 0x42, 0x00); // GS V 66 0 (Feed and partial cut)
    return this;
  }

  raw(bytes: Uint8Array | number[]) {
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// -------------------------------------------------------------
// Formatters and String Layout Utilities for 37mm (20 columns) / 58mm (32 columns) / 80mm (48 columns)
// -------------------------------------------------------------
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

function formatTwoColumns(label: string, value: string, width = 20): string {
  const spaces = width - label.length - value.length;
  if (spaces < 0) {
    const maxLabelLen = width - value.length - 1;
    if (maxLabelLen > 0) {
      return label.substring(0, maxLabelLen) + " " + value;
    }
    return label.substring(0, 1) + " " + value.substring(0, width - 2);
  }
  return label + " ".repeat(spaces) + value;
}

export function generateEscPosReceiptBytes(data: ReceiptData, width = 48): Uint8Array {
  const builder = new EscPosBuilder();

  // 0. Print Logo if present
  if (data.logoBytes && data.logoBytes.length > 0) {
    builder.alignCenter()
           .raw(data.logoBytes)
           .lineFeed(1);
  }

  // 1. Header (Store Name - Bold, Center, Large)
  builder.alignCenter()
         .fontSizeLarge()
         .bold(true)
         .textLine(data.storeName)
         .fontSizeNormal();

  if (data.storeAddress) {
    const wrappedAddr = wrapText(data.storeAddress, width);
    for (const line of wrappedAddr) {
      builder.textLine(line);
    }
  }
  if (data.storePhone) {
    builder.textLine(`Telp: ${data.storePhone}`);
  }
  builder.bold(false);

  // Divider
  builder.textLine("=".repeat(width));

  // Transaction Info
  builder.alignLeft();
  if (data.transactionCode) {
    builder.bold(true).textLine(formatTwoColumns("No. Struk:", data.transactionCode, width)).bold(false);
  }
  builder.textLine(formatTwoColumns("Tanggal:", data.transactionDate, width));
  builder.textLine(formatTwoColumns("Kasir:", data.cashierName, width));
  builder.textLine(formatTwoColumns("Pembayaran:", data.paymentMethod.toUpperCase(), width));
  
  if (data.member) {
    builder.bold(true).textLine(formatTwoColumns("Pelanggan:", `${data.member.name} (${data.member.memberCode})`, width)).bold(false);
  }

  // Divider
  builder.textLine("-".repeat(width));

  // 2. Items List (Clean 2-line layout in bold)
  builder.bold(true).textLine(formatTwoColumns("ITEM / BELANJAAN", "SUBTOTAL", width)).bold(false);
  builder.textLine("-".repeat(width));

  for (const item of data.items) {
    const priceStr = item.price.toLocaleString("id-ID");
    const totalStr = item.subtotal.toLocaleString("id-ID");

    builder.bold(true).textLine(item.name).bold(false);
    const detailLine = `  ${item.qty} x Rp ${priceStr}`;
    const subtotalLine = `Rp ${totalStr}`;
    builder.textLine(formatTwoColumns(detailLine, subtotalLine, width));
  }

  // Divider
  builder.textLine("-".repeat(width));

  // 3. Totals (Bold for Total Akhir)
  if (data.discount > 0) {
    builder.textLine(formatTwoColumns("Subtotal:", `Rp ${data.subtotal.toLocaleString("id-ID")}`, width));
    builder.bold(true).textLine(formatTwoColumns("Diskon Member:", `-Rp ${data.discount.toLocaleString("id-ID")}`, width)).bold(false);
  }
  if (data.tax > 0) {
    builder.textLine(formatTwoColumns("Pajak:", `Rp ${data.tax.toLocaleString("id-ID")}`, width));
  }

  // Grand Total in Bold & Large
  builder.textLine("=".repeat(width));
  builder.bold(true)
         .textLine(formatTwoColumns("TOTAL AKHIR:", `Rp ${data.total.toLocaleString("id-ID")}`, width))
         .bold(false);
  builder.textLine("=".repeat(width));

  if (data.paymentMethod.toLowerCase() === "cash" || data.paymentMethod.toLowerCase() === "tunai") {
    const paid = data.amountPaid ?? data.total;
    const change = data.changeAmount ?? 0;
    builder.bold(true);
    builder.textLine(formatTwoColumns("TUNAI:", `Rp ${paid.toLocaleString("id-ID")}`, width));
    builder.textLine(formatTwoColumns("KEMBALIAN:", `Rp ${change.toLocaleString("id-ID")}`, width));
    builder.bold(false);
  }

  // Divider
  builder.textLine("-".repeat(width));

  // 4. Footer
  builder.alignCenter().bold(true);
  const footerStr = data.footerText || "Terima Kasih";
  const wrappedFooter = wrapText(footerStr, width);
  for (const line of wrappedFooter) {
    builder.textLine(line);
  }
  builder.bold(false);

  // Feed 4 lines and cut
  builder.lineFeed(4);
  builder.cut();

  return builder.build();
}

// -------------------------------------------------------------
// PCL Command Builder & Receipt Generator for PCL thermal printer
// -------------------------------------------------------------
export function generatePclReceiptBytes(data: ReceiptData, width = 20): Uint8Array {
  let receipt = "";

  const centerPcl = (text: string) => {
    const lines = wrapText(text, width);
    return lines.map(line => centerAlign(line, width)).join("\r\n");
  };

  receipt += centerPcl(data.storeName) + "\r\n";
  if (data.storeAddress) {
    receipt += centerPcl(data.storeAddress) + "\r\n";
  }
  if (data.storePhone) {
    receipt += centerPcl(`Telp: ${data.storePhone}`) + "\r\n";
  }

  receipt += "-".repeat(width) + "\r\n";

  if (data.transactionCode) {
    receipt += formatTwoColumns("No. Struk:", data.transactionCode, width) + "\r\n";
  }
  receipt += formatTwoColumns("Tanggal:", data.transactionDate, width) + "\r\n";
  receipt += formatTwoColumns("Kasir:", data.cashierName, width) + "\r\n";
  receipt += formatTwoColumns("Pembayaran:", data.paymentMethod.toUpperCase(), width) + "\r\n";
  
  if (data.member) {
    receipt += formatTwoColumns("Pelanggan:", `${data.member.name} (${data.member.memberCode})`, width) + "\r\n";
  }

  // 2. Items List (Ritgrow Table Column Format)
  if (width >= 48) {
    const colHeader = "Barang".padEnd(23, " ") + " " + "Qty".padStart(5, " ") + " " + "Harga".padStart(8, " ") + " " + "Total".padStart(9, " ");
    receipt += colHeader + "\r\n";
    receipt += "-".repeat(width) + "\r\n";
  } else if (width >= 45) {
    receipt += "Barang                    Qty   Harga   Total\r\n";
    receipt += "-".repeat(width) + "\r\n";
  } else {
    receipt += "Barang             Qty  Harga  Total\r\n";
    receipt += "-".repeat(width) + "\r\n";
  }

  for (const item of data.items) {
    const qty = item.qty.toString();
    const price = item.price.toLocaleString("id-ID");
    const total = item.subtotal.toLocaleString("id-ID");

    if (width >= 48) {
      const nameLines = wrapText(item.name, 23);
      if (nameLines.length > 0) {
        const firstLine = nameLines[0].padEnd(23, " ") + " " + qty.padStart(5, " ") + " " + price.padStart(8, " ") + " " + total.padStart(9, " ");
        receipt += firstLine + "\r\n";
        for (let i = 1; i < nameLines.length; i++) {
          receipt += nameLines[i].padEnd(width, " ") + "\r\n";
        }
      }
    } else if (width >= 45) {
      const nameLines = wrapText(item.name, 20);
      if (nameLines.length > 0) {
        const firstLine = nameLines[0].padEnd(20, " ") + " " + qty.padStart(6, " ") + " " + price.padStart(8, " ") + " " + total.padStart(8, " ");
        receipt += firstLine + "\r\n";
        for (let i = 1; i < nameLines.length; i++) {
          receipt += nameLines[i].padEnd(width, " ") + "\r\n";
        }
      }
    } else {
      const nameLines = wrapText(item.name, 12);
      if (nameLines.length > 0) {
        const firstLine = nameLines[0].padEnd(12, " ") + " " + qty.padStart(3, " ") + " " + price.padStart(6, " ") + " " + total.padStart(7, " ");
        receipt += firstLine + "\r\n";
        for (let i = 1; i < nameLines.length; i++) {
          receipt += nameLines[i].padEnd(width, " ") + "\r\n";
        }
      }
    }
  }

  receipt += "-".repeat(width) + "\r\n";

  if (data.discount > 0) {
    receipt += formatTwoColumns("Subtotal:", `Rp${data.subtotal.toLocaleString("id-ID")}`, width) + "\r\n";
    receipt += formatTwoColumns("Diskon:", `-Rp${data.discount.toLocaleString("id-ID")}`, width) + "\r\n";
  }
  if (data.tax > 0) {
    receipt += formatTwoColumns("Pajak:", `Rp${data.tax.toLocaleString("id-ID")}`, width) + "\r\n";
  }
  
  receipt += formatTwoColumns("TOTAL AKHIR:", `Rp${data.total.toLocaleString("id-ID")}`, width) + "\r\n";
  
  if (data.paymentMethod.toLowerCase() === "cash" || data.paymentMethod.toLowerCase() === "tunai") {
    const paid = data.amountPaid ?? data.total;
    const change = data.changeAmount ?? 0;
    receipt += formatTwoColumns("TUNAI:", `Rp${paid.toLocaleString("id-ID")}`, width) + "\r\n";
    receipt += formatTwoColumns("KEMBALIAN:", `Rp${change.toLocaleString("id-ID")}`, width) + "\r\n";
  }

  receipt += "-".repeat(width) + "\r\n";

  const footerStr = data.footerText || "Terima Kasih";
  receipt += centerPcl(footerStr) + "\r\n";
  receipt += "\r\n\r\n\r\n\r\n\r\n";

  const encoder = new TextEncoder();
  const textBytes = encoder.encode(receipt);

  const bytes = new Uint8Array(2 + textBytes.length + 1 + 2);
  
  // ESC E (Init)
  bytes[0] = 0x1B;
  bytes[1] = 0x45;
  
  // Text Data
  bytes.set(textBytes, 2);
  
  // Form Feed (0x0C) to trigger printing of buffer
  bytes[2 + textBytes.length] = 0x0C;
  
  // ESC E (End)
  bytes[2 + textBytes.length + 1] = 0x1B;
  bytes[2 + textBytes.length + 2] = 0x45;

  return bytes;
}


// -------------------------------------------------------------
// Legacy text helper for Web / RawBT fallback
// -------------------------------------------------------------
function centerAlign(text: string, width = 20): string {
  if (text.length >= width) {
    return text.substring(0, width);
  }
  const totalSpaces = width - text.length;
  const leftSpaces = Math.floor(totalSpaces / 2);
  const rightSpaces = totalSpaces - leftSpaces;
  return " ".repeat(leftSpaces) + text + " ".repeat(rightSpaces);
}

function centerAlignWrapped(text: string, width = 20): string {
  const lines = wrapText(text, width);
  return lines.map(line => centerAlign(line, width)).join("%0A");
}

export function generatePlainTextReceipt(data: ReceiptData, width = 20): string {
  let receipt = "";

  receipt += centerAlignWrapped(data.storeName, width) + "%0A";
  if (data.storeAddress) {
    receipt += centerAlignWrapped(data.storeAddress, width) + "%0A";
  }
  if (data.storePhone) {
    receipt += centerAlignWrapped(`Telp: ${data.storePhone}`, width) + "%0A";
  }

  receipt += "-".repeat(width) + "%0A";

  if (data.transactionCode) {
    receipt += formatTwoColumns("No. Struk:", data.transactionCode, width) + "%0A";
  }
  receipt += formatTwoColumns("Tanggal:", data.transactionDate, width) + "%0A";
  receipt += formatTwoColumns("Kasir:", data.cashierName, width) + "%0A";
  receipt += formatTwoColumns("Pembayaran:", data.paymentMethod.toUpperCase(), width) + "%0A";
  
  if (data.member) {
    receipt += formatTwoColumns("Pelanggan:", `${data.member.name} (${data.member.memberCode})`, width) + "%0A";
  }

  // 2. Items List (Ritgrow Table Column Format)
  if (width >= 48) {
    const colHeader = "Barang".padEnd(23, " ") + " " + "Qty".padStart(5, " ") + " " + "Harga".padStart(8, " ") + " " + "Total".padStart(9, " ");
    receipt += colHeader + "%0A";
    receipt += "-".repeat(width) + "%0A";
  } else if (width >= 45) {
    receipt += "Barang                    Qty   Harga   Total%0A";
    receipt += "-".repeat(width) + "%0A";
  } else {
    receipt += "Barang             Qty  Harga  Total%0A";
    receipt += "-".repeat(width) + "%0A";
  }

  for (const item of data.items) {
    const qty = item.qty.toString();
    const price = item.price.toLocaleString("id-ID");
    const total = item.subtotal.toLocaleString("id-ID");

    if (width >= 48) {
      const nameLines = wrapText(item.name, 23);
      if (nameLines.length > 0) {
        const firstLine = nameLines[0].padEnd(23, " ") + " " + qty.padStart(5, " ") + " " + price.padStart(8, " ") + " " + total.padStart(9, " ");
        receipt += firstLine + "%0A";
        for (let i = 1; i < nameLines.length; i++) {
          receipt += nameLines[i].padEnd(width, " ") + "%0A";
        }
      }
    } else if (width >= 45) {
      const nameLines = wrapText(item.name, 20);
      if (nameLines.length > 0) {
        const firstLine = nameLines[0].padEnd(20, " ") + " " + qty.padStart(6, " ") + " " + price.padStart(8, " ") + " " + total.padStart(8, " ");
        receipt += firstLine + "%0A";
        for (let i = 1; i < nameLines.length; i++) {
          receipt += nameLines[i].padEnd(width, " ") + "%0A";
        }
      }
    } else {
      const nameLines = wrapText(item.name, 12);
      if (nameLines.length > 0) {
        const firstLine = nameLines[0].padEnd(12, " ") + " " + qty.padStart(3, " ") + " " + price.padStart(6, " ") + " " + total.padStart(7, " ");
        receipt += firstLine + "%0A";
        for (let i = 1; i < nameLines.length; i++) {
          receipt += nameLines[i].padEnd(width, " ") + "%0A";
        }
      }
    }
  }

  receipt += "-".repeat(width) + "%0A";

  if (data.discount > 0) {
    receipt += formatTwoColumns("Subtotal:", `Rp${data.subtotal.toLocaleString("id-ID")}`, width) + "%0A";
    receipt += formatTwoColumns("Diskon:", `-Rp${data.discount.toLocaleString("id-ID")}`, width) + "%0A";
  }
  if (data.tax > 0) {
    receipt += formatTwoColumns("Pajak:", `Rp${data.tax.toLocaleString("id-ID")}`, width) + "%0A";
  }
  
  receipt += formatTwoColumns("TOTAL AKHIR:", `Rp${data.total.toLocaleString("id-ID")}`, width) + "%0A";
  
  if (data.paymentMethod.toLowerCase() === "cash" || data.paymentMethod.toLowerCase() === "tunai") {
    const paid = data.amountPaid ?? data.total;
    const change = data.changeAmount ?? 0;
    receipt += formatTwoColumns("TUNAI:", `Rp${paid.toLocaleString("id-ID")}`, width) + "%0A";
    receipt += formatTwoColumns("KEMBALIAN:", `Rp${change.toLocaleString("id-ID")}`, width) + "%0A";
  }

  receipt += "-".repeat(width) + "%0A";

  const footerStr = data.footerText || "Terima Kasih";
  receipt += centerAlignWrapped(footerStr, width) + "%0A";
  receipt += "%0A%0A%0A%0A%0A";

  return receipt;
}

function utf8ToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return uint8ArrayToBase64(bytes);
}

function uint8ArrayToBase64(uint8: Uint8Array): string {
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return window.btoa(binary);
}

export function printViaRawBT(text: string): void {
  if (typeof window === "undefined") return;

  const isAndroid = /Android/i.test(navigator.userAgent) || Capacitor.getPlatform() === "android";

  if (isAndroid) {
    const cleanText = text.replace(/%0A/g, "\n").replace(/\r\n/g, "\n");
    const base64Data = utf8ToBase64(cleanText);
    const url = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    console.log("DEBUG - rawbt intent url:", url);
    window.location.href = url;

    if (!Capacitor.isNativePlatform()) {
      const start = Date.now();
      let hasNavigated = false;
      const handleVisibilityChange = () => {
        if (document.hidden) {
          hasNavigated = true;
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      setTimeout(() => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (!hasNavigated && !document.hidden && Date.now() - start < 1500) {
          if (confirm("Gagal membuka RawBT. Apakah Anda ingin mengunduh aplikasi RawBT dari Google Play Store?")) {
            window.open("https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter", "_blank");
          }
        }
      }, 1000);
    }
  } else {
    // Pada Windows / Desktop Browser, panggil window.print() untuk cetak via Windows Print Spooler (POS-58)
    console.log("Pencetakan Desktop: Menggunakan Browser Print (window.print())");
    window.print();
  }
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

export async function getAvailablePrinters(): Promise<{ printers: PrinterDevice[]; count: number }> {
  if (!Capacitor.isNativePlatform()) {
    return { printers: [], count: 0 };
  }
  try {
    return await Printer.listAvailablePrinters();
  } catch (err) {
    console.error("Gagal mendeteksi listAvailablePrinters:", err);
    return { printers: [], count: 0 };
  }
}

export async function setPreferredPrinterDevice(vendorId: number, productId: number): Promise<{ success: boolean; preferredPrinter?: string }> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_printer_vid_pid", `${vendorId}:${productId}`);
    }
    return { success: true, preferredPrinter: `${vendorId}:${productId}` };
  }
  try {
    return await Printer.setPreferredPrinter({ vendorId, productId });
  } catch (err: any) {
    console.error("Gagal menyimpan preferensi printer:", err);
    throw err;
  }
}

export async function handleReceiptPrint(params: HandlePrintParams): Promise<{ success: boolean; isNative: boolean; message?: string }> {
  const { transaction, cashierName = "Kasir" } = params;
  if (!transaction) {
    throw new Error("Data transaksi tidak ditemukan.");
  }

  // Retrieve settings from localStorage as fallback
  let localShopName = "";
  let localShopAddress = "";
  let localShopPhone = "";
  let localShopFooter = "";
  let localPaperSize = "58mm";
  let localLogo = "";

  if (typeof window !== "undefined") {
    try {
      localShopName = localStorage.getItem("gopos_shop_name") || "";
      localShopAddress = localStorage.getItem("gopos_shop_address") || "";
      localShopPhone = localStorage.getItem("gopos_shop_phone") || "";
      localShopFooter = localStorage.getItem("gopos_shop_footer") || "";
      localPaperSize = localStorage.getItem("gopos_paper_size") || "58mm";
      localLogo = localStorage.getItem("gopos_shop_logo") || "";
    } catch (e) {
      console.error("Gagal membaca settings dari localStorage:", e);
    }
  }

  // Resolve final values
  const paperSize = params.paperSize || localPaperSize || "58mm";
  const cols = paperSize === "37mm" ? 20 : paperSize === "58mm" ? 32 : 48;

  const storeName = params.shopSettings?.name || params.shopName || localShopName || "KURNIA TELUR";
  const storeAddress = params.shopSettings?.address || params.shopAddress || localShopAddress || "Jl. Perumnas Raya Blok X No.7, Jakarta";
  const storePhone = params.shopSettings?.phone || params.shopPhone || localShopPhone || "";
  const footerText = params.shopSettings?.footer || localShopFooter || "Terima Kasih";
  const logoSrc = params.shopSettings?.logo || localLogo || "";

  // Process logo asynchronously if present
  let logoBytes: Uint8Array | undefined = undefined;
  if (logoSrc) {
    try {
      const logoWidth = paperSize === "37mm" ? 160 : paperSize === "58mm" ? 256 : 384;
      logoBytes = await convertImageToEscPosRaster(logoSrc, logoWidth);
    } catch (logoErr) {
      console.warn("Gagal memproses logo struk, mencetak tanpa logo:", logoErr);
    }
  }

  const receiptPayload: ReceiptData = {
    transactionCode: transaction.transaction_code || "-",
    storeName,
    storeAddress,
    storePhone,
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
    footerText,
    amountPaid: transaction.amount_paid ?? transaction.total_amount,
    changeAmount: transaction.change_amount ?? 0,
    member: transaction.member
      ? {
          name: transaction.member.name,
          memberCode: transaction.member.phone || transaction.member.member_code || `#${transaction.member.id}`,
        }
      : null,
    logoBytes,
  };

  if (Capacitor.isNativePlatform()) {
    const plainText = generatePlainTextReceipt(receiptPayload, cols).replace(/%0A/g, "\n");
    try {
      const printerType = typeof window !== "undefined"
        ? localStorage.getItem("gopos-printer-type") || "pcl"
        : "pcl";

      let bytes: Uint8Array;
      if (printerType === "pcl") {
        bytes = generatePclReceiptBytes(receiptPayload, cols);
      } else {
        bytes = generateEscPosReceiptBytes(receiptPayload, cols);
      }
      
      const base64Data = uint8ArrayToBase64(bytes);
      const result = await Printer.printReceipt({ text: plainText, receiptData: base64Data, printerType });
      return { success: result.success, isNative: true, message: result.message || "Berhasil dicetak secara native" };
    } catch (err: any) {
      console.error("Gagal cetak native Telpo, fallback ke RawBT:", err);
      printViaRawBT(plainText);
      return { success: true, isNative: true, message: "Gagal cetak native, dialihkan ke RawBT: " + (err.message || err) };
    }
  } else {
    const plainText = generatePlainTextReceipt(receiptPayload, cols).replace(/%0A/g, "\n");
    printViaRawBT(plainText);
    return { success: true, isNative: false, message: "Pencetakan diproses via Browser / Windows Print Spooler" };
  }
}

export type { ReceiptData };