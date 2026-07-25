"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { isRawBTInstalled, printViaRawBT } from "@/lib/printer";
import { Capacitor } from "@capacitor/core";
import { AlertCircle, CheckCircle, Download, Printer as PrinterIcon, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [isNative, setIsNative] = useState(false);
  const [rawBTInstalled, setRawBTInstalled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

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
  }, []);

  // Uji cetak teks dummy
  const handleTestPrint = () => {
    const testText = 
      "================================================\n" +
      "               GOPOS PRINTER TEST               \n" +
      "================================================\n" +
      "Tanggal: " + new Date().toLocaleString("id-ID") + "\n" +
      "Koneksi: BERHASIL MENGHUBUNGKAN KE RAWBT\n" +
      "Status : Printer Thermal 80mm Siap Digunakan\n" +
      "================================================\n" +
      "             Powered by GoPOS app\n\n\n\n\n";
    printViaRawBT(testText);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-2 text-slate-500">
            <PrinterIcon className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Pengaturan Printer</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Perangkat</h2>
              <p className="text-slate-500 text-sm mt-1">
                Kelola printer thermal eksternal, periksa status modul RawBT, dan lakukan pengujian printer di sini.
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <PrinterIcon className="h-5 w-5 text-blue-600" /> Printer Thermal 80mm (RawBT)
              </h3>
              
              <div className="border-t border-slate-100 pt-4 space-y-4">
                {/* Deteksi Platform */}
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400 uppercase tracking-wider">Platform Aplikasi</span>
                  <span className="font-bold uppercase text-slate-800 bg-slate-150 px-2 py-0.5 rounded border border-slate-200">
                    {isNative ? "Capacitor Native APK" : "Web Browser (Fully Kiosk)"}
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
                    <span className="text-slate-400 italic">Bukan Platform Native (Web)</span>
                  )}
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                {rawBTInstalled === false && isNative && (
                  <a
                    href="https://play.google.com/store/apps/details?id=ru.a43.rawbt"
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
                  className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>Uji Cetak (Test Print)</span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
