"use client";

import { useEffect, useState } from "react";
import { isRawBTInstalled, printViaRawBT, Printer, generateEscPosReceiptBytes, generatePclReceiptBytes, getAvailablePrinters, setPreferredPrinterDevice } from "@/lib/printer";
import { convertImageToEscPosRaster } from "@/lib/printer-image-helper";
import { Capacitor } from "@capacitor/core";
import { useSettingsStore } from "../Store/useSettingsStore";
import { SettingsView } from "../Component/SettingsView";
import type { PrinterDeviceDAO, PrintStatusDAO } from "../DAO/settings.dao";
import { loadShopSettingsFromStorage, saveShopSettingsToStorage } from "@/service/settings.service";

function uint8ArrayToBase64(uint8: Uint8Array): string {
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return window.btoa(binary);
}

export default function SettingsContainer() {
  const [isNative, setIsNative] = useState(false);
  const [rawBTInstalled, setRawBTInstalled] = useState<boolean | null>(null);

  const {
    logs,
    addLog,
    clearLogs,
    customerDisplayEnabled,
    setCustomerDisplayEnabled,
    printerType,
    setPrinterType,
    shopName,
    setShopName,
    shopAddress,
    setShopAddress,
    shopPhone,
    setShopPhone,
    footerText,
    setFooterText,
    paperSize,
    setPaperSize,
    logoBase64,
    setLogoBase64,
  } = useSettingsStore();

  const [nativeConnected, setNativeConnected] = useState<boolean | null>(null);
  const [nativePermission, setNativePermission] = useState<boolean | null>(null);
  const [nativeMessage, setNativeMessage] = useState<string>("");
  const [printerTypeState, setPrinterTypeState] = useState<string>("");

  const [checking, setChecking] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<PrintStatusDAO | null>(null);

  const [availablePrinters, setAvailablePrinters] = useState<PrinterDeviceDAO[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState<boolean>(false);
  const [preferredVidPid, setPreferredVidPid] = useState<string>("");
  const [toastNotif, setToastNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastNotif({ message, type });
    setTimeout(() => setToastNotif(null), 4000);
  };

  const fetchAvailablePrinters = async () => {
    setLoadingPrinters(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const res = await Printer.listAvailablePrinters();
        setAvailablePrinters(res.printers || []);
      } else {
        const res = await getAvailablePrinters();
        setAvailablePrinters(res.printers || []);
      }
    } catch (err: any) {
      console.error("Gagal memuat listAvailablePrinters:", err);
      setAvailablePrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleSelectPreferredPrinter = async (vendorId: number, productId: number) => {
    try {
      await setPreferredPrinterDevice(vendorId, productId);
      const vidPidStr = `${vendorId}:${productId}`;
      setPreferredVidPid(vidPidStr);
      if (typeof window !== "undefined") {
        localStorage.setItem("preferred_printer_vid_pid", vidPidStr);
      }
      showToast(`Berhasil memilih printer (VID: ${vendorId}, PID: ${productId})`, "success");
    } catch (err: any) {
      showToast(`Gagal menyimpan preferensi printer: ${err.message || err}`, "error");
    }
  };

  const handleQuickTestPrint = async () => {
    setPrinting(true);
    setPrintStatus(null);
    try {
      const testText = "=== TEST PRINT ===\nGoPOS POS System\nTanggal: " + new Date().toLocaleString("id-ID") + "\nStatus: Koneksi Printer USB Berhasil!\n\n\n\n";
      const res = await Printer.printReceipt({ text: testText });
      if (res.success) {
        showToast("Struk test print berhasil dicetak", "success");
        setPrintStatus({
          success: true,
          message: res.message || "Struk test print berhasil dicetak ke printer!",
          timestamp: new Date().toLocaleTimeString("id-ID"),
        });
      } else {
        throw new Error(res.message || "Gagal mencetak test print");
      }
    } catch (err: any) {
      const errMsg = `Gagal mencetak struk test print: ${err.message || err}. Periksa koneksi printer.`;
      showToast(errMsg, "error");
      setPrintStatus({
        success: false,
        message: errMsg,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setPrinting(false);
    }
  };

  const checkStatus = async () => {
    addLog("Memeriksa status koneksi printer...");
    setChecking(true);
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    addLog(`Platform isNative: ${native}`);

    if (native) {
      const installed = await isRawBTInstalled();
      setRawBTInstalled(installed);
      addLog(`Status RawBT Installed: ${installed}`);

      try {
        addLog("Memanggil Printer.checkPrinterStatus()...");
        const status = await Printer.checkPrinterStatus();
        addLog(`checkPrinterStatus respon: connected=${status.connected}, hasPermission=${status.hasPermission}, type=${status.printerType}, msg=${status.message}`);
        setNativeConnected(status.connected);
        setNativePermission(status.hasPermission);
        setNativeMessage(status.message || "");
        setPrinterTypeState(status.printerType || "");
        if (status.vendorId && status.productId) {
          setPreferredVidPid(`${status.vendorId}:${status.productId}`);
        }
      } catch (err: any) {
        addLog(`ERROR checkPrinterStatus: ${err.message || err}`);
        console.error("Gagal mendeteksi printer native:", err);
        setNativeConnected(false);
        setNativePermission(false);
        setNativeMessage("Error deteksi native: " + err.message);
      }
    } else {
      setRawBTInstalled(null);
      setNativeConnected(true);
      setNativePermission(true);
      setNativeMessage("Windows OS Printer Spooler Aktif (Printer USB POS-58 terdaftar di Windows)");
    }
    await fetchAvailablePrinters();
    setChecking(false);
    addLog("Selesai memeriksa status.");
  };

  useEffect(() => {
    checkStatus();
    if (typeof window !== "undefined") {
      const stored = loadShopSettingsFromStorage();
      setShopName(stored.shopName);
      setShopAddress(stored.shopAddress);
      setShopPhone(stored.shopPhone);
      setFooterText(stored.footerText);
      setPaperSize(stored.paperSize);
      setLogoBase64(stored.logoBase64);

      setCustomerDisplayEnabled(localStorage.getItem("gopos-customer-display-enabled") === "true");
      setPrinterType((localStorage.getItem("gopos-printer-type") as "escpos" | "pcl") || "escpos");
      setPreferredVidPid(localStorage.getItem("preferred_printer_vid_pid") || "");
    }
  }, []);

  const handleSaveShopSettings = () => {
    saveShopSettingsToStorage({
      shopName,
      shopAddress,
      shopPhone,
      footerText,
      paperSize,
      logoBase64,
    });
    alert("Pengaturan struk berhasil disimpan!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = () => {
    setLogoBase64("");
  };

  const handleToggleCustomerDisplay = (val: boolean) => {
    setCustomerDisplayEnabled(val);
    localStorage.setItem("gopos-customer-display-enabled", String(val));
  };

  const handleSetPrinterType = (type: "escpos" | "pcl") => {
    setPrinterType(type);
    localStorage.setItem("gopos-printer-type", type);
  };

  const handleTestPrintNative = async () => {
    addLog("Uji cetak native dimulai.");
    setPrinting(true);
    setPrintStatus(null);

    let logoBytes: Uint8Array | undefined = undefined;
    if (logoBase64) {
      try {
        addLog("Memproses gambar logo...");
        const logoWidth = paperSize === "58mm" ? 256 : 384;
        logoBytes = await convertImageToEscPosRaster(logoBase64, logoWidth);
        addLog("Logo berhasil diproses.");
      } catch (err: any) {
        addLog("Gagal memproses logo: " + (err.message || err));
        console.warn("Gagal memproses logo uji cetak:", err);
      }
    }

    const cols = paperSize === "58mm" ? 32 : 48;
    addLog(`Resolving cols: ${cols}, printerType: ${printerType}`);

    const testReceiptData = {
      storeName: shopName || "GoPOS STORE",
      storeAddress: shopAddress || "Jl. Pengujian POS No. 123",
      storePhone: shopPhone || "0812-3456-7890",
      transactionDate: new Date().toLocaleString("id-ID"),
      transactionCode: "TRX-TEST-0001",
      cashierName: "Penguji Sistem",
      paymentMethod: "TUNAI",
      items: [
        { name: "Susu Ultra Milk Cokelat 250ml", qty: 2, price: 9500, subtotal: 19000 },
        { name: "Roti Tawar Kupas Premium", qty: 1, price: 16000, subtotal: 16000 },
      ],
      subtotal: 35000,
      tax: 0,
      discount: 0,
      total: 35000,
      amountPaid: 50000,
      changeAmount: 15000,
      footerText: footerText || `Direct ${printerType === "pcl" ? "PCL" : "ESC/POS"} Native USB Print - Sukses!`,
      logoBytes,
    };

    try {
      addLog("Menghasilkan payload byte...");
      const bytes = printerType === "pcl"
        ? generatePclReceiptBytes(testReceiptData, cols)
        : generateEscPosReceiptBytes(testReceiptData, cols);
      addLog(`Byte berhasil dibuat (${bytes.length} bytes). Mengonversi ke Base64...`);
      const base64Data = uint8ArrayToBase64(bytes);

      const testText =
        `========== ${testReceiptData.storeName} ==========\n` +
        `${testReceiptData.storeAddress}\n` +
        `Telp: ${testReceiptData.storePhone}\n` +
        `------------------------------------------------\n` +
        `No. Struk: ${testReceiptData.transactionCode}\n` +
        `Tanggal  : ${testReceiptData.transactionDate}\n` +
        `Kasir    : ${testReceiptData.cashierName}\n` +
        `------------------------------------------------\n` +
        `Susu Ultra Milk Cokelat 250ml x 2      Rp19.000\n` +
        `Roti Tawar Kupas Premium x 1           Rp16.000\n` +
        `------------------------------------------------\n` +
        `TOTAL AKHIR:                           Rp35.000\n` +
        `TUNAI:                                 Rp50.000\n` +
        `KEMBALIAN:                             Rp15.000\n` +
        `------------------------------------------------\n` +
        `${testReceiptData.footerText}\n\n\n`;

      addLog("Memanggil Printer.printReceipt via Capacitor...");
      const res = await Printer.printReceipt({ text: testText, receiptData: base64Data, printerType: printerType });
      addLog(`Respon printReceipt: success=${res.success}, message=${res.message}`);

      setPrintStatus({
        success: res.success,
        message: res.message || "Berhasil mengirim data cetak langsung ke USB printer!",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } catch (err: any) {
      addLog(`ERROR printReceipt: ${err.message || err}`);
      setPrintStatus({
        success: false,
        message: `Gagal mencetak secara native: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleTestPrintNativePlain = async () => {
    setPrinting(true);
    setPrintStatus(null);

    const testText =
      "GOPOS SIMPLE DIRECT USB PRINT TEST (PCL MODE)\r\n" +
      "---------------------------------------------\r\n" +
      "Tanggal: " + new Date().toLocaleString("id-ID") + "\r\n" +
      "Koneksi: USB Murni (PCL Command Set)\r\n" +
      "Status : Sukses Terkirim\r\n" +
      "---------------------------------------------\r\n" +
      "Jika tulisan ini tercetak, maka hardware\r\n" +
      "printer Anda 100% berfungsi dalam mode PCL!\r\n\r\n\r\n\r\n\r\n";

    try {
      const encoder = new TextEncoder();
      const textBytes = encoder.encode(testText);

      const bytes = new Uint8Array(2 + textBytes.length + 1 + 2);
      bytes[0] = 0x1b;
      bytes[1] = 0x45;
      bytes.set(textBytes, 2);
      bytes[2 + textBytes.length] = 0x0c;
      bytes[2 + textBytes.length + 1] = 0x1b;
      bytes[2 + textBytes.length + 2] = 0x45;

      const base64Data = uint8ArrayToBase64(bytes);
      const res = await Printer.printReceipt({ receiptData: base64Data });

      setPrintStatus({
        success: res.success,
        message: res.message || "Berhasil mengirim teks polos PCL langsung ke printer!",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } catch (err: any) {
      setPrintStatus({
        success: false,
        message: `Gagal mencetak teks PCL: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleMinimalFeed = async () => {
    setPrinting(true);
    setPrintStatus(null);

    try {
      const printerMode = typeof window !== "undefined"
        ? localStorage.getItem("gopos-printer-type") || "escpos"
        : "escpos";

      let bytes: Uint8Array;
      if (printerMode === "pcl") {
        bytes = new Uint8Array([0x0c]);
      } else {
        bytes = new Uint8Array([0x0a, 0x0a]);
      }

      const base64Data = uint8ArrayToBase64(bytes);
      const res = await Printer.printReceipt({ receiptData: base64Data });

      setPrintStatus({
        success: res.success,
        message: res.message || "Berhasil mengirim pakan kertas minimal!",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } catch (err: any) {
      setPrintStatus({
        success: false,
        message: `Gagal pakan kertas: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleTestPrintRawBT = async () => {
    setPrinting(true);
    setPrintStatus(null);

    const cols = paperSize === "37mm" ? 20 : paperSize === "58mm" ? 32 : 48;
    const lineDivider = "-".repeat(cols) + "\n";
    const testText =
      lineDivider +
      "          GOPOS PRINTER TEST (RAWBT)            \n" +
      lineDivider +
      "Tanggal: " + new Date().toLocaleString("id-ID") + "\n" +
      "Koneksi: BERHASIL MENGHUBUNGKAN KE RAWBT\n" +
      `Status : Printer Thermal ${paperSize} via RawBT\n` +
      lineDivider +
      "             Powered by GoPOS app\n\n\n\n\n";

    try {
      if (isNative) {
        const installed = await isRawBTInstalled();
        if (!installed) {
          setPrintStatus({
            success: false,
            message: "Aplikasi RawBT tidak terinstall di tablet POS ini.",
            timestamp: new Date().toLocaleTimeString("id-ID"),
          });
          setPrinting(false);
          return;
        }
      }

      printViaRawBT(testText);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPrintStatus({
        success: true,
        message: "Berhasil mengirim data ke RawBT. Jika printer tidak merespon, pastikan koneksi Bluetooth/USB aktif di RawBT.",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } catch (err: any) {
      setPrintStatus({
        success: false,
        message: `Gagal mengirim ke RawBT: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <SettingsView
      isNative={isNative}
      rawBTInstalled={rawBTInstalled}
      logs={logs}
      addLog={addLog}
      clearLogs={clearLogs}
      nativeConnected={nativeConnected}
      nativePermission={nativePermission}
      nativeMessage={nativeMessage}
      printerTypeState={printerTypeState}
      checking={checking}
      printing={printing}
      printStatus={printStatus}
      availablePrinters={availablePrinters}
      loadingPrinters={loadingPrinters}
      preferredVidPid={preferredVidPid}
      toastNotif={toastNotif}
      customerDisplayEnabled={customerDisplayEnabled}
      printerType={printerType}
      shopName={shopName}
      setShopName={setShopName}
      shopAddress={shopAddress}
      setShopAddress={setShopAddress}
      shopPhone={shopPhone}
      setShopPhone={setShopPhone}
      footerText={footerText}
      setFooterText={setFooterText}
      paperSize={paperSize}
      setPaperSize={setPaperSize}
      logoBase64={logoBase64}
      handleSaveShopSettings={handleSaveShopSettings}
      handleLogoUpload={handleLogoUpload}
      handleClearLogo={handleClearLogo}
      handleToggleCustomerDisplay={handleToggleCustomerDisplay}
      handleSetPrinterType={handleSetPrinterType}
      fetchAvailablePrinters={fetchAvailablePrinters}
      handleSelectPreferredPrinter={handleSelectPreferredPrinter}
      handleQuickTestPrint={handleQuickTestPrint}
      checkStatus={checkStatus}
      handleTestPrintNative={handleTestPrintNative}
      handleTestPrintNativePlain={handleTestPrintNativePlain}
      handleMinimalFeed={handleMinimalFeed}
      handleTestPrintRawBT={handleTestPrintRawBT}
    />
  );
}
