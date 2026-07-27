"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { isRawBTInstalled, printViaRawBT, Printer, generateEscPosReceiptBytes } from "@/lib/printer";
import { Capacitor } from "@capacitor/core";
import { AlertCircle, CheckCircle, Download, Printer as PrinterIcon, RefreshCw, Monitor, HelpCircle, ShieldCheck } from "lucide-react";

// Convert Uint8Array to Base64 (local helper for settings test print)
function uint8ArrayToBase64(uint8: Uint8Array): string {
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return window.btoa(binary);
}

export default function SettingsPage() {
  const [isNative, setIsNative] = useState(false);
  const [rawBTInstalled, setRawBTInstalled] = useState<boolean | null>(null);
  
  // Native USB Printer States
  const [nativeConnected, setNativeConnected] = useState<boolean | null>(null);
  const [nativePermission, setNativePermission] = useState<boolean | null>(null);
  const [nativeMessage, setNativeMessage] = useState<string>("");

  const [checking, setChecking] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  // State for Customer Display
  const [customerDisplayEnabled, setCustomerDisplayEnabled] = useState(false);

  // Cek status instalasi printer & RawBT
  const checkStatus = async () => {
    setChecking(true);
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (native) {
      // 1. Cek status RawBT (backup)
      const installed = await isRawBTInstalled();
      setRawBTInstalled(installed);

      // 2. Cek status Direct USB Printer
      try {
        const status = await Printer.checkPrinterStatus();
        setNativeConnected(status.connected);
        setNativePermission(status.hasPermission);
        setNativeMessage(status.message || "");
      } catch (err: any) {
        console.error("Gagal mendeteksi printer native:", err);
        setNativeConnected(false);
        setNativePermission(false);
        setNativeMessage("Error deteksi native: " + err.message);
      }
    } else {
      setRawBTInstalled(null);
      setNativeConnected(null);
      setNativePermission(null);
      setNativeMessage("Bukan Platform Native (Web Browser)");
    }
    setChecking(false);
  };

  useEffect(() => {
    checkStatus();
    if (typeof window !== "undefined") {
      setCustomerDisplayEnabled(localStorage.getItem("gopos-customer-display-enabled") === "true");
    }
  }, []);

  const handleToggleCustomerDisplay = (val: boolean) => {
    setCustomerDisplayEnabled(val);
    localStorage.setItem("gopos-customer-display-enabled", String(val));
  };

  // Uji cetak menggunakan Direct USB Native
  const handleTestPrintNative = async () => {
    setPrinting(true);
    setPrintStatus(null);

    const testReceiptData = {
      storeName: "GoPOS STORE",
      storeAddress: "Jl. Pengujian POS No. 123",
      storePhone: "0812-3456-7890",
      transactionDate: new Date().toLocaleString("id-ID"),
      transactionCode: "TRX-TEST-0001",
      cashierName: "Penguji Sistem",
      paymentMethod: "TUNAI",
      items: [
        { name: "Susu Ultra Milk Cokelat 250ml", qty: 2, price: 9500, subtotal: 19000 },
        { name: "Roti Tawar Kupas Premium", qty: 1, price: 16000, subtotal: 16000 }
      ],
      subtotal: 35000,
      tax: 0,
      discount: 0,
      total: 35000,
      amountPaid: 50000,
      changeAmount: 15000,
      footerText: "Direct ESC/POS Native USB Print - Sukses!"
    };

    try {
      const bytes = generateEscPosReceiptBytes(testReceiptData);
      const base64Data = uint8ArrayToBase64(bytes);
      const res = await Printer.printReceipt({ receiptData: base64Data });

      setPrintStatus({
        success: res.success,
        message: res.message || "Berhasil mengirim data cetak langsung ke USB printer!",
        timestamp: new Date().toLocaleTimeString("id-ID")
      });
    } catch (err: any) {
      setPrintStatus({
        success: false,
        message: `Gagal mencetak secara native: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString("id-ID")
      });
    } finally {
      setPrinting(false);
    }
  };

  // Uji cetak menggunakan Direct USB Native Plain Text (No Formatting / No Cut)
  const handleTestPrintNativePlain = async () => {
    setPrinting(true);
    setPrintStatus(null);

    const testText = 
      "GOPOS SIMPLE DIRECT USB PRINT TEST\r\n" +
      "--------------------------------\r\n" +
      "Tanggal: " + new Date().toLocaleString("id-ID") + "\r\n" +
      "Koneksi: USB Murni (Plain Text Only)\r\n" +
      "Status : Sukses Terkirim\r\n" +
      "--------------------------------\r\n" +
      "Jika tulisan ini tercetak, maka hardware\r\n" +
      "printer Anda 100% berfungsi dengan baik!\r\n\r\n\r\n\r\n\r\n";

    try {
      const encoder = new TextEncoder();
      const textBytes = encoder.encode(testText);
      
      // Sisipkan ESC @ (0x1B, 0x40) di awal byte array untuk inisialisasi printer
      const bytes = new Uint8Array(textBytes.length + 2);
      bytes[0] = 0x1B;
      bytes[1] = 0x40;
      bytes.set(textBytes, 2);

      const base64Data = uint8ArrayToBase64(bytes);
      const res = await Printer.printReceipt({ receiptData: base64Data });

      setPrintStatus({
        success: res.success,
        message: res.message || "Berhasil mengirim teks polos langsung ke USB printer!",
        timestamp: new Date().toLocaleTimeString("id-ID")
      });
    } catch (err: any) {
      setPrintStatus({
        success: false,
        message: `Gagal mencetak teks polos secara native: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString("id-ID")
      });
    } finally {
      setPrinting(false);
    }
  };

  // Uji cetak menggunakan RawBT (legacy fallback)
  const handleTestPrintRawBT = async () => {
    setPrinting(true);
    setPrintStatus(null);
    
    const testText = 
      "================================================\n" +
      "          GOPOS PRINTER TEST (RAWBT)            \n" +
      "================================================\n" +
      "Tanggal: " + new Date().toLocaleString("id-ID") + "\n" +
      "Koneksi: BERHASIL MENGHUBUNGKAN KE RAWBT\n" +
      "Status : Printer Thermal 80mm via RawBT\n" +
      "================================================\n" +
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
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <PrinterIcon className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Pengaturan Perangkat & Layar</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Perangkat POS</h2>
              <p className="text-slate-500 text-sm mt-1">
                Kelola konfigurasi printer thermal internal (USB Host) dan layar eksternal untuk pelanggan.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Kolom 1: Konfigurasi Printer */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <PrinterIcon className="h-5 w-5 text-blue-600" /> Koneksi Printer Thermal 80mm
                </h3>

                {/* Bagian A: Printer Utama (Direct USB Native) */}
                <div className="space-y-3 bg-slate-50/50 border border-slate-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Printer Utama (Direct USB Native)
                    </span>
                    <span className="text-[9px] uppercase font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Rekomendasi
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Status Terhubung */}
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400 uppercase tracking-wider">Status USB</span>
                      {checking ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      ) : nativeConnected ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200 uppercase tracking-wider">
                          <CheckCircle className="h-3 w-3" /> Terdeteksi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2.5 py-0.5 rounded-full text-[10px] border border-red-200 uppercase tracking-wider">
                          <AlertCircle className="h-3 w-3" /> Tidak Terdeteksi
                        </span>
                      )}
                    </div>

                    {/* Izin Akses USB */}
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400 uppercase tracking-wider">Izin Akses USB</span>
                      {checking ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      ) : nativePermission ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200 uppercase tracking-wider">
                          <CheckCircle className="h-3 w-3" /> Diberikan
                        </span>
                      ) : isNative && nativeConnected ? (
                        <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2.5 py-0.5 rounded-full text-[10px] border border-orange-200 uppercase tracking-wider">
                          <AlertCircle className="h-3 w-3" /> Butuh Konfirmasi
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">N/A</span>
                      )}
                    </div>

                    {/* Detail Log/Pesan USB */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[10px] font-mono text-slate-600 break-all leading-normal">
                      <span className="font-bold text-slate-400 block mb-0.5 uppercase text-[8px] tracking-wider">Info Perangkat USB:</span>
                      {nativeMessage || "Mendeteksi status printer..."}
                    </div>
                  </div>

                  {/* Tombol Cetak Native */}
                  {isNative && (
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        onClick={handleTestPrintNative}
                        disabled={printing || checking || !nativeConnected}
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow"
                      >
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Cetak ESC/POS (Format Lengkap)</span>
                      </button>

                      <button
                        onClick={handleTestPrintNativePlain}
                        disabled={printing || checking || !nativeConnected}
                        className="w-full h-10 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100/50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Cetak Teks Polos (No Format/Cut)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bagian B: Printer Cadangan (RawBT Fallback) */}
                <div className="space-y-3 bg-slate-50/30 border border-slate-200/50 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-500 text-xs flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                      Printer Cadangan (RawBT Intent)
                    </span>
                    <span className="text-[8px] uppercase font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Fallback
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold pt-1">
                    <span className="text-slate-400 uppercase tracking-wider">Aplikasi RawBT</span>
                    {checking ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    ) : rawBTInstalled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[9px] border border-emerald-200">
                        Terinstall
                      </span>
                    ) : isNative ? (
                      <span className="inline-flex items-center gap-1 text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-[9px] border border-red-200">
                        Tidak Ada
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-normal">N/A (Web Browser)</span>
                    )}
                  </div>

                  {rawBTInstalled === false && isNative && (
                    <a
                      href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter"
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download RawBT dari Play Store</span>
                    </a>
                  )}

                  <button
                    onClick={handleTestPrintRawBT}
                    disabled={printing || checking}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PrinterIcon className="h-3.5 w-3.5" />
                    <span>Uji Cetak via RawBT (Fallback)</span>
                  </button>
                </div>

                {/* Tombol Segarkan Global */}
                <button
                  onClick={checkStatus}
                  disabled={checking}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                  <span>Segarkan Koneksi & Status</span>
                </button>

                {/* Status Cetak Terakhir */}
                {printStatus && (
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                    printStatus.success 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium" 
                      : "bg-rose-50 border-rose-200 text-rose-800 font-medium"
                  }`}>
                    <div className="flex justify-between items-center font-bold">
                      <span>{printStatus.success ? "Status: Sukses" : "Status: Gagal"}</span>
                      <span className="opacity-80 font-normal">{printStatus.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">{printStatus.message}</p>
                  </div>
                )}

                {/* Panduan Setup Awal */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 space-y-2.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" /> Catatan Konektivitas Printer:
                  </h4>
                  <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                    <li><b>Direct USB Native</b> terhubung langsung melalui komunikasi hardware internal tablet. Pengujian harus dilakukan di mesin POS fisik.</li>
                    <li>Jika Direct USB tidak terdeteksi, perhatikan panel <i>Info Perangkat USB</i> untuk melihat daftar Vendor ID (VID) dan Product ID (PID) periferal yang tercolok.</li>
                    <li>Pastikan kabel data printer internal terpasang dengan baik pada mainboard tablet POS.</li>
                  </ul>
                </div>
              </div>

              {/* Kolom 2: Layar Pelanggan (Customer Display) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-indigo-600" /> Layar Pelanggan (Customer Display)
                </h3>
                
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  {/* Toggle Aktifkan */}
                  <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Aktifkan Layar Pelanggan</span>
                      <span className="text-slate-400 text-[10px] mt-0.5 block">Kirim data transaksi real-time ke layar kedua</span>
                    </div>
                    <button
                      onClick={() => handleToggleCustomerDisplay(!customerDisplayEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        customerDisplayEnabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          customerDisplayEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Live Preview Layar Pelanggan */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Live Preview Layar Pelanggan</span>
                    <div className={`border rounded-2xl p-4 bg-slate-900 text-white font-sans text-[11px] shadow-inner relative overflow-hidden h-[152px] flex flex-col justify-between transition-opacity duration-300 ${
                      customerDisplayEnabled ? "opacity-100 border-slate-800" : "opacity-40 border-slate-200"
                    }`}>
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="font-black text-slate-200 text-[10px]">GoPOS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${customerDisplayEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase">
                            {customerDisplayEnabled ? "Tersambung" : "Terputus"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div className="space-y-1.5 my-2">
                        <div className="flex justify-between text-slate-300">
                          <span>Susu Ultra Milk Cokelat x2</span>
                          <span className="font-extrabold text-blue-400">Rp37.000</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Roti Tawar Kupas Premium x1</span>
                          <span className="font-extrabold text-blue-400">Rp16.000</span>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="border-t border-slate-800/80 pt-2 flex justify-between items-end">
                        <div>
                          <span className="text-[8px] text-slate-500 font-extrabold uppercase block tracking-wider">Total Belanja</span>
                          <span className="text-sm font-black text-emerald-400">Rp53.000</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Silakan Lakukan Pembayaran</span>
                      </div>

                      {!customerDisplayEnabled && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-wider gap-1">
                          <Monitor className="h-5 w-5 text-slate-500" />
                          <span>Layar Dinonaktifkan</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informasi Layar Kedua */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 space-y-2 leading-relaxed">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" /> Integrasi Layar Fisik Sekunder:
                    </h4>
                    <p>
                      Sistem akan mendeteksi layar fisik sekunder 4" pada tablet POS Anda secara otomatis menggunakan <b>Android Presentation API</b> saat aplikasi dibuka.
                    </p>
                    <p>
                      Layar ini akan menampilkan daftar barang belanjaan dan total harga secara real-time kepada pelanggan. Pastikan modul layar sekunder terhubung dengan benar ke mainboard perangkat tablet.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
