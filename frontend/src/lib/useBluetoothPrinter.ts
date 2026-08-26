import { useState, useCallback, useEffect, useRef } from 'react';

// Ambient Type Definitions untuk Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
    filters?: Array<{ name?: string; namePrefix?: string; services?: string[] }>;
  }

  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService {
    uuid: string;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    uuid: string;
    properties: {
      write: boolean;
      writeWithoutResponse: boolean;
    };
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }
}

export type ConnectionStatus = 'Disconnected' | 'Connecting...' | 'Connected';

export interface BluetoothPrinterDevice {
  name: string;
  id: string;
}

export interface UseBluetoothPrinterOptions {
  /**
   * Prefix nama device untuk mempersempit hasil pencarian di dialog pairing
   * (opsional). Contoh: "CP-" akan membuat browser hanya menampilkan device
   * dengan nama yang diawali "CP-". Jika tidak diisi, semua device BLE di
   * sekitar akan ditampilkan (acceptAllDevices).
   */
  namePrefix?: string;
}

// Service UUID standar untuk printer thermal Bluetooth (ESC/POS & SPP)
const KNOWN_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  '0000e0ff-0000-1000-8000-00805f9b34fb', // Common Thermal Printer Service (C-Print, dll)
  '0000ff00-0000-1000-8000-00805f9b34fb', // ESC/POS Service
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP) - lihat catatan di README
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC / Microchip Transparent Service
];

// UUID yang tergolong "Classic Bluetooth only" (tidak akan pernah muncul
// lewat GATT). Dipakai untuk memberi pesan error yang lebih membantu.
const CLASSIC_ONLY_SERVICE_HINTS = [
  '00001101-0000-1000-8000-00805f9b34fb', // SPP
];

export function useBluetoothPrinter(options: UseBluetoothPrinterOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('Disconnected');
  const [deviceInfo, setDeviceInfo] = useState<BluetoothPrinterDevice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  /**
   * 3. Event Listener: Pendeteksi otomatis ketika printer terputus secara tiba-tiba.
   * Event 'gattserverdisconnected' dipanggil oleh Web Bluetooth API jika koneksi GATT terputus,
   * baik karena printer dimatikan, baterai habis, di luar jangkauan, atau diambil-alih app lain.
   * Karena event-driven, kita tidak perlu polling status secara manual.
   */
  const handleDisconnected = useCallback((event: Event) => {
    const dev = event.target as BluetoothDevice;
    console.warn(`[Bluetooth] Printer ${dev.name || 'Device'} terputus secara mendadak!`);
    setStatus('Disconnected');
    setDeviceInfo(null);
    characteristicRef.current = null;
  }, []);

  /**
   * 4. Logika untuk mengecek status koneksi printer saat ini secara mendasar.
   * Memeriksa apakah `device.gatt.connected === true`. Sengaja membaca dari
   * ref (bukan state React) supaya nilainya selalu real-time, bukan snapshot lama.
   */
  const isConnected = useCallback((): boolean => {
    if (!deviceRef.current || !deviceRef.current.gatt) {
      return false;
    }
    return deviceRef.current.gatt.connected === true;
  }, []);

  /**
   * 1. Fungsi "Cari & Hubungkan Printer"
   * Menggunakan Web Bluetooth API (navigator.bluetooth.requestDevice & device.gatt.connect)
   */
  const connectPrinter = useCallback(async () => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.bluetooth) {
      setErrorMessage('Web Bluetooth API tidak didukung di browser ini. Harap gunakan Google Chrome / Edge di Desktop atau Android.');
      return;
    }

    try {
      setStatus('Connecting...');

      // Membuka dialog pencarian Bluetooth browser.
      // Jika namePrefix diisi, hasil pencarian dipersempit ke device dengan
      // nama yang diawali prefix tersebut (UX lebih rapi untuk kasir).
      const requestOptions: RequestDeviceOptions = options.namePrefix
        ? { filters: [{ namePrefix: options.namePrefix }], optionalServices: KNOWN_SERVICES }
        : { acceptAllDevices: true, optionalServices: KNOWN_SERVICES };

      const device = await navigator.bluetooth.requestDevice(requestOptions);

      deviceRef.current = device;

      // Mendaftarkan event listener gattserverdisconnected
      device.addEventListener('gattserverdisconnected', handleDisconnected);

      // Hubungkan ke GATT Server printer
      const gattServer = await device.gatt?.connect();
      if (!gattServer) {
        throw new Error('Gagal terhubung ke GATT Server printer.');
      }

      // Mencari Characteristic yang mendukung pengiriman data (Write / WriteWithoutResponse)
      let targetCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
      const services = await gattServer.getPrimaryServices();

      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
        } catch (e) {
          // Lanjutkan jika service tertentu tidak dapat diakses
        }
        if (targetCharacteristic) break;
      }

      if (!targetCharacteristic) {
        // Kalau tidak ada characteristic yang cocok DAN tidak ada satupun
        // service yang berhasil ditemukan, kemungkinan besar printer ini
        // Bluetooth Classic (SPP) yang tidak kompatibel dengan Web Bluetooth (BLE/GATT only).
        if (services.length === 0) {
          throw new Error(
            'Tidak ada GATT service yang ditemukan pada printer ini. ' +
            'Kemungkinan besar printer menggunakan Bluetooth Classic (SPP), yang TIDAK didukung oleh Web Bluetooth API. ' +
            'Web Bluetooth hanya mendukung perangkat BLE. Cek spesifikasi printer, atau gunakan Web Serial API / aplikasi native sebagai alternatif.'
          );
        }
        throw new Error('Tidak ditemukan characteristic Bluetooth yang mendukung pengiriman data pada printer.');
      }

      characteristicRef.current = targetCharacteristic;
      setDeviceInfo({
        name: device.name || 'Bluetooth Thermal Printer (CP-58B)',
        id: device.id,
      });
      setStatus('Connected');
    } catch (err: any) {
      console.error('[Bluetooth] Error saat menghubungkan:', err);
      setStatus('Disconnected');

      if (err.name === 'NotFoundError') {
        // User menutup dialog pairing tanpa memilih device — bukan error, jadi diamkan saja.
        return;
      }

      // SecurityError sering muncul saat mencoba GATT connect ke device yang
      // sebenarnya hanya broadcast Classic Bluetooth (bukan BLE beneran).
      if (err.name === 'NetworkError' || err.name === 'SecurityError') {
        setErrorMessage(
          'Gagal terhubung ke printer. Jika printer Anda hanya mendukung Bluetooth Classic (SPP) dan bukan BLE, ' +
          'Web Bluetooth API tidak akan bisa digunakan. Pastikan printer mendukung BLE, atau gunakan Web Serial API sebagai alternatif.'
        );
        return;
      }

      setErrorMessage(err.message || 'Gagal menghubungkan ke printer Bluetooth.');
    }
  }, [handleDisconnected, options.namePrefix]);

  /**
   * Menghentikan koneksi printer secara manual
   */
  const disconnectPrinter = useCallback(() => {
    if (deviceRef.current && deviceRef.current.gatt?.connected) {
      deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnected);
      deviceRef.current.gatt.disconnect();
    }
    setStatus('Disconnected');
    setDeviceInfo(null);
    characteristicRef.current = null;
  }, [handleDisconnected]);

  /**
   * 5. Contoh fungsi kirim data / test print sederhana (ESC/POS 58mm)
   */
  const sendTestData = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null);

    // Cek status koneksi realtime
    if (!isConnected() || !characteristicRef.current) {
      setErrorMessage('Printer belum terhubung atau koneksi terputus.');
      setStatus('Disconnected');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const ESC = 0x1b;
      const GS = 0x1d;

      // Perintah ESC/POS sederhana disesuaikan untuk Thermal Printer 58mm (C-Print CP-58B)
      const commands: number[] = [
        ESC, 0x40,                                           // Reset/Initialize Printer
        ESC, 0x61, 0x01,                                     // Align Center
        ...Array.from(encoder.encode("=== GOPOS APP ===\n")),
        ...Array.from(encoder.encode("TEST PRINT SUCCESS\n")),
        ...Array.from(encoder.encode("--------------------------------\n")),
        ESC, 0x61, 0x00,                                     // Align Left
        ...Array.from(encoder.encode("Printer : C-Print CP-58B\n")),
        ...Array.from(encoder.encode("Paper   : Thermal 58mm\n")),
        ...Array.from(encoder.encode("Status  : Connected (OK)\n")),
        ...Array.from(encoder.encode("--------------------------------\n")),
        ESC, 0x61, 0x01,                                     // Align Center
        ...Array.from(encoder.encode("Siap digunakan transaksi!\n\n\n")),
        GS, 0x56, 0x42, 0x00                                 // Feed & Cut Paper (jika ada pemotong)
      ];

      const dataBuffer = new Uint8Array(commands);

      // Membagi data menjadi chunk kecil (100 byte) agar aman dari batas Bluetooth MTU
      const chunkSize = 100;
      for (let i = 0; i < dataBuffer.length; i += chunkSize) {
        const chunk = dataBuffer.slice(i, i + chunkSize);
        if (characteristicRef.current.properties.writeWithoutResponse) {
          await characteristicRef.current.writeValueWithoutResponse(chunk);
        } else {
          await characteristicRef.current.writeValue(chunk);
        }
      }

      return true;
    } catch (err: any) {
      console.error('[Bluetooth] Error saat cetak data:', err);
      setErrorMessage('Gagal mengirim data ke printer: ' + err.message);
      return false;
    }
  }, [isConnected]);

  // Cleanup event listener saat unmount
  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnected);
      }
    };
  }, [handleDisconnected]);

  return {
    status,
    deviceInfo,
    errorMessage,
    isConnected,
    connectPrinter,
    disconnectPrinter,
    sendTestData,
  };
}