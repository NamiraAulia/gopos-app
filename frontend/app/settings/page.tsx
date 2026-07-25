"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { isRawBTInstalled, printViaRawBT } from "@/lib/printer";
import { Capacitor } from "@capacitor/core";
import { AlertCircle, CheckCircle, Download, Printer as PrinterIcon, RefreshCw, Monitor } from "lucide-react";

export default function SettingsPage() {
  const [isNative, setIsNative] = useState(false);
  const [rawBTInstalled, setRawBTInstalled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  // State for Customer Display
  const [customerDisplayEnabled, setCustomerDisplayEnabled] = useState(false);

  // Fungsi untuk cek status instalasi RawBT
  const checkStatus = async () => {
    setChecking(true);
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (native) {
      const installed = await isRawBTInstalled();
      setRawBTInstalled(installed);
    } else {
      setRawBTInstalled(null); // Web biasa
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

  // Uji cetak teks dummy
  const handleTestPrint = async () => {
    setPrinting(true);
    setPrintStatus(null);
    
    const testText = 
      "================================================\n" +
      "               GOPOS PRINTER TEST               \n" +
      "================================================\n" +
      "Tanggal: " + new Date().toLocaleString("id-ID") + "\n" +
      "Koneksi: BERHASIL MENGHUBUNGKAN KE RAWBT\n" +
      "Status : Printer Thermal 80mm Siap Digunakan\n" +
      "================================================\n" +
      "             Powered by GoPOS app\n\n\n\n\n";

    try {
      if (isNative) {
        const installed = await isRawBTInstalled();
        if (!installed) {
          setPrintStatus({
            success: false,
            message: "Aplikasi RawBT tidak terinstall di tablet POS ini. Silakan unduh melalui link di bawah.",
            timestamp: new Date().toLocaleTimeString("id-ID"),
          });
          setPrinting(false);
          return;
        }
      }

      printViaRawBT(testText);

      // Simulasikan durasi proses cetak selama 2 detik
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPrintStatus({
        success: true,
        message: "Berhasil mengirim data ke RawBT. Jika printer tidak merespon, pastikan kertas terisi, printer menyala, dan koneksi bluetooth/USB aktif.",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      });
    } catch (err: any) {
      setPrintStatus({
        success: false,
        message: `Gagal mengirim data cetak: ${err.message || err}`,
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
                Kelola printer thermal eksternal, periksa modul RawBT, dan konfigurasikan layar eksternal untuk pelanggan.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Kolom 1: Printer Thermal (RawBT) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <PrinterIcon className="h-5 w-5 text-blue-600" /> Printer Thermal 80mm (RawBT)
                </h3>
                
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  {/* Deteksi Platform */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400 uppercase tracking-wider">Platform Aplikasi</span>
                    <span className="font-bold uppercase text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {isNative ? "Capacitor Native APK" : "Web Browser"}
                    </span>
                  </div>

                  {/* Status RawBT */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400 uppercase tracking-wider">Status Aplikasi RawBT</span>
                    {checking ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    ) : rawBTInstalled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200 uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3" /> Terinstall
                      </span>
                    ) : isNative ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2.5 py-0.5 rounded-full text-[10px] border border-red-200 uppercase tracking-wider">
                        <AlertCircle className="h-3 w-3" /> Tidak Terinstall
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-normal">Bukan Platform Native (Web)</span>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  {rawBTInstalled === false && isNative && (
                    <a
                      href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter"
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download RawBT dari Play Store</span>
                    </a>
                  )}
                  
                  <button
                    onClick={handleTestPrint}
                    disabled={printing}
                    className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {printing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Mencetak (2s)...</span>
                      </>
                    ) : (
                      <>
                        <PrinterIcon className="h-4 w-4" />
                        <span>Uji Cetak (Test Print)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={checkStatus}
                    disabled={checking}
                    className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                    <span>Segarkan Status</span>
                  </button>
                </div>

                {/* Status Cetak Terakhir */}
                {printStatus && (
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                    printStatus.success 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium" 
                      : "bg-rose-50 border-rose-200 text-rose-800 font-medium"
                  }`}>
                    <div className="flex justify-between items-center font-bold">
                      <span>{printStatus.success ? "Status: Cetak Sukses" : "Status: Cetak Gagal"}</span>
                      <span className="opacity-80 font-normal">{printStatus.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">{printStatus.message}</p>
                  </div>
                )}

                {/* Panduan Setup Awal */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 space-y-2.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" /> Panduan Setup Awal Printer:
                  </h4>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Unduh & pasang aplikasi <b>RawBT Printer</b> dari Google Play Store.</li>
                    <li>Pastikan printer thermal Bluetooth/USB Anda terhubung ke tablet.</li>
                    <li>Pada aplikasi RawBT, pilih koneksi printer Anda sebagai printer default.</li>
                    <li>Di setelan RawBT, pastikan setelan lebar kertas diatur ke <b>80mm (48 columns)</b>.</li>
                    <li>Pastikan tombol service (pojok kanan atas) di aplikasi RawBT berstatus aktif/berjalan.</li>
                  </ol>
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
