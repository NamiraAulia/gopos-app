import React from 'react';
import { useBluetoothPrinter } from '@/lib/useBluetoothPrinter';

export const BluetoothPrinterManager: React.FC = () => {
  const {
    status,
    deviceInfo,
    errorMessage,
    isConnected,
    connectPrinter,
    disconnectPrinter,
    sendTestData,
  } = useBluetoothPrinter();

  // Indikator visual status koneksi
  const renderStatusBadge = () => {
    switch (status) {
      case 'Connected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected
          </span>
        );
      case 'Connecting...':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Connecting...
          </span>
        );
      case 'Disconnected':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-rose-500"></span>
            Disconnected
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-5">
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Manajemen Printer Bluetooth
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thermal 58mm (C-Print CP-58B)
          </p>
        </div>
        {renderStatusBadge()}
      </div>

      {/* Detail Printer jika terhubung */}
      {deviceInfo && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
          <p><span className="font-semibold text-slate-900 dark:text-slate-100">Nama Perangkat:</span> {deviceInfo.name}</p>
          <p><span className="font-semibold text-slate-900 dark:text-slate-100">Cek Status (gatt.connected):</span> {isConnected() ? 'Active (true)' : 'Inactive (false)'}</p>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {status === 'Connected' ? (
          <>
            <button
              onClick={sendTestData}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition shadow-sm"
            >
              🖨️ Test Print Struk
            </button>
            <button
              onClick={disconnectPrinter}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Putuskan
            </button>
          </>
        ) : (
          <button
            onClick={connectPrinter}
            disabled={status === 'Connecting...'}
            className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
          >
            {status === 'Connecting...' ? 'Sedang Menghubungkan...' : '🔍 Cari & Hubungkan Printer'}
          </button>
        )}
      </div>
    </div>
  );
};