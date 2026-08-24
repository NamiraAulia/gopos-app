"use client";

import Sidebar from "@/components/Sidebar";
import { BluetoothPrinterManager } from "@/components/BluetoothPrinterManager";
import type { PrinterDeviceDAO, PrintStatusDAO } from "../DAO/settings.dao";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Printer as PrinterIcon,
  RefreshCw,
  Monitor,
  HelpCircle,
  ShieldCheck,
  Loader2,
  Usb,
  Check,
} from "lucide-react";

interface SettingsViewProps {
  isNative: boolean;
  rawBTInstalled: boolean | null;
  logs: string[];
  addLog: (msg: string) => void;
  clearLogs: () => void;
  nativeConnected: boolean | null;
  nativePermission: boolean | null;
  nativeMessage: string;
  printerTypeState: string;
  checking: boolean;
  printing: boolean;
  printStatus: PrintStatusDAO | null;
  availablePrinters: PrinterDeviceDAO[];
  loadingPrinters: boolean;
  preferredVidPid: string;
  toastNotif: { message: string; type: "success" | "error" } | null;
  customerDisplayEnabled: boolean;
  printerType: "escpos" | "pcl";
  shopName: string;
  setShopName: (val: string) => void;
  shopAddress: string;
  setShopAddress: (val: string) => void;
  shopPhone: string;
  setShopPhone: (val: string) => void;
  footerText: string;
  setFooterText: (val: string) => void;
  paperSize: "37mm" | "58mm" | "80mm";
  setPaperSize: (size: "37mm" | "58mm" | "80mm") => void;
  logoBase64: string;
  handleSaveShopSettings: () => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearLogo: () => void;
  handleToggleCustomerDisplay: (val: boolean) => void;
  handleSetPrinterType: (type: "escpos" | "pcl") => void;
  fetchAvailablePrinters: () => void;
  handleSelectPreferredPrinter: (vendorId: number, productId: number) => void;
  handleQuickTestPrint: () => void;
  checkStatus: () => void;
  handleTestPrintNative: () => void;
  handleTestPrintNativePlain: () => void;
  handleMinimalFeed: () => void;
  handleTestPrintRawBT: () => void;
}

export function SettingsView({
  isNative,
  rawBTInstalled,
  logs,
  clearLogs,
  nativeConnected,
  nativePermission,
  nativeMessage,
  checking,
  printing,
  printStatus,
  availablePrinters,
  loadingPrinters,
  preferredVidPid,
  toastNotif,
  customerDisplayEnabled,
  printerType,
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
  handleSaveShopSettings,
  handleLogoUpload,
  handleClearLogo,
  handleToggleCustomerDisplay,
  handleSetPrinterType,
  fetchAvailablePrinters,
  handleSelectPreferredPrinter,
  handleQuickTestPrint,
  checkStatus,
  handleTestPrintNative,
  handleTestPrintNativePlain,
  handleMinimalFeed,
  handleTestPrintRawBT,
}: SettingsViewProps) {
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
                  <PrinterIcon className="h-5 w-5 text-blue-600" /> Koneksi Printer Thermal ({paperSize})
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

                    {/* Tipe Protokol Printer */}
                    <div className="flex justify-between items-center text-xs font-semibold py-1">
                      <span className="text-slate-400 uppercase tracking-wider">Protokol Printer</span>
                      <select
                        value={printerType}
                        onChange={(e) => handleSetPrinterType(e.target.value as "escpos" | "pcl")}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-bold cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[11px]"
                      >
                        <option value="escpos">ESC/POS (Eksternal)</option>
                        <option value="pcl">PCL (Internal/Thermal)</option>
                      </select>
                    </div>

                    {/* Detail Log/Pesan USB */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[10px] font-mono text-slate-600 break-all leading-normal">
                      <span className="font-bold text-slate-400 block mb-0.5 uppercase text-[8px] tracking-wider">Info Perangkat USB:</span>
                      {nativeMessage || "Mendeteksi status printer..."}
                    </div>
                  </div>

                  {/* Tombol Cetak Native / Web Browser */}
                  {isNative ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        onClick={handleTestPrintNative}
                        disabled={printing || checking || !nativeConnected}
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow"
                      >
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Cetak {printerType === "pcl" ? "PCL" : "ESC/POS"} (Format Lengkap)</span>
                      </button>

                      <button
                        onClick={handleTestPrintNativePlain}
                        disabled={printing || checking || !nativeConnected}
                        className="w-full h-10 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100/50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Cetak Teks Polos (No Format/Cut)</span>
                      </button>

                      <button
                        onClick={handleMinimalFeed}
                        disabled={printing || checking || !nativeConnected}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Pakan Kertas (Feed/LF)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        onClick={() => window.print()}
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow"
                      >
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Cetak Struk (Windows / Browser Print)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Section Bluetooth Printer (Web Bluetooth API) */}
                <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <BluetoothPrinterManager />
                </div>

                {/* Section: Pemilihan Printer USB Terdeteksi */}
                <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Usb className="h-4 w-4 text-blue-600" />
                      Daftar Printer USB Terdeteksi
                    </span>
                    <button
                      onClick={fetchAvailablePrinters}
                      disabled={loadingPrinters}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingPrinters ? "animate-spin" : ""}`} />
                      Segarkan
                    </button>
                  </div>

                  {/* Toast Notification Banner */}
                  {toastNotif && (
                    <div className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                      toastNotif.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      <span>{toastNotif.message}</span>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingPrinters ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Memindai printer USB...
                    </div>
                  ) : availablePrinters.length === 0 ? (
                    /* Empty State */
                    <div className="py-4 px-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-2">
                      <p className="text-xs text-slate-600 font-medium">
                        Tidak ada printer USB terdeteksi. Pastikan printer sudah tercolok dan tersambung dengan benar.
                      </p>
                      <button
                        onClick={fetchAvailablePrinters}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Coba lagi
                      </button>
                    </div>
                  ) : (
                    /* List of Printers */
                    <div className="space-y-2">
                      {availablePrinters.map((dev, idx) => {
                        const isSelected = preferredVidPid === `${dev.vendorId}:${dev.productId}`;
                        const name = dev.productName || dev.deviceName || `USB Printer ${idx + 1}`;
                        return (
                          <div
                            key={`${dev.vendorId}-${dev.productId}-${idx}`}
                            className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                              isSelected ? "bg-blue-50/70 border-blue-300" : "bg-slate-50/40 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <PrinterIcon className="h-3.5 w-3.5 text-slate-500" />
                                {name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                VID: {dev.vendorId} | PID: {dev.productId} {dev.deviceName && `(${dev.deviceName})`}
                              </div>
                            </div>

                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md text-[10px] font-extrabold border border-blue-200">
                                <Check className="h-3 w-3" /> Terpilih
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectPreferredPrinter(dev.vendorId, dev.productId)}
                                className="px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                              >
                                Pilih
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Test Print Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={handleQuickTestPrint}
                      disabled={printing || loadingPrinters}
                      className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {printing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Mencetak Struk Test...</span>
                        </>
                      ) : (
                        <>
                          <PrinterIcon className="h-3.5 w-3.5" />
                          <span>Test Print Struk Quick</span>
                        </>
                      )}
                    </button>
                  </div>
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

                {/* Box Konsol Log Debug */}
                <div className="bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl p-4 shadow-inner space-y-2 font-mono">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-[10px] text-slate-200 tracking-wider">LOG DEBUG (ON-SCREEN CONSOLE)</span>
                    <button
                      onClick={clearLogs}
                      className="text-[9px] text-slate-400 hover:text-slate-200 transition-colors uppercase font-bold cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </div>
                  <div className="h-44 overflow-y-auto text-[9px] space-y-1 scrollbar-thin scrollbar-thumb-slate-800 select-all leading-normal">
                    {logs.length === 0 ? (
                      <span className="text-slate-500 italic">Belum ada aktivitas...</span>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="break-all">{log}</div>
                      ))
                    )}
                  </div>
                </div>

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

              {/* Kolom 2: Layar Pelanggan (Customer Display) & Struk */}
              <div className="space-y-8">
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

                {/* Pengaturan Struk Belanja */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <PrinterIcon className="h-5 w-5 text-indigo-600" /> Pengaturan Struk Belanja
                  </h3>

                  <div className="space-y-4">
                    {/* Nama Toko */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Toko</label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="GoPOS STORE"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Alamat Toko */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Toko</label>
                      <textarea
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        placeholder="Jl. Raya Utama No. 123, Jakarta"
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>

                    {/* Nomor Telepon */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">No. Telepon Toko</label>
                      <input
                        type="text"
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        placeholder="0812-3456-7890"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Teks Footer */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teks Footer Struk</label>
                      <input
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Terima Kasih - Barang yang sudah dibeli..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Ukuran Kertas Printer */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ukuran Kertas & Kolom</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as "37mm" | "58mm" | "80mm")}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="37mm">37mm (Sangat Kecil - 20 Kolom)</option>
                        <option value="58mm">58mm (Kecil - 32 Kolom)</option>
                        <option value="80mm">80mm (Lebar - 48 Kolom)</option>
                      </select>
                    </div>

                    {/* Logo Toko */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Logo Struk (Hitam Putih / Monochrome)</label>
                      <div className="flex items-center gap-3">
                        {logoBase64 ? (
                          <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center h-16 w-16 group shrink-0">
                            <img
                              src={logoBase64}
                              alt="Preview Logo"
                              className="max-h-full max-w-full object-contain filter grayscale"
                            />
                            <button
                              type="button"
                              onClick={handleClearLogo}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow hover:bg-red-600 transition-colors cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="h-16 w-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 shrink-0 text-slate-400">
                            <PrinterIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            id="logo-upload-input"
                            className="hidden"
                          />
                          <label
                            htmlFor="logo-upload-input"
                            className="inline-flex h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            Pilih Gambar Logo
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1">Logo akan otomatis disesuaikan & diubah menjadi monochrome (hitam putih) untuk dicetak.</p>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Simpan */}
                    <button
                      type="button"
                      onClick={handleSaveShopSettings}
                      className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow"
                    >
                      Simpan Pengaturan Struk
                    </button>
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
