import { useState, useCallback, useRef } from 'react';

// Ambient types untuk WebUSB & Web Serial API
declare global {
  interface Navigator {
    usb?: {
      requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<USBDevice>;
      getDevices(): Promise<USBDevice[]>;
    };
    serial?: {
      requestPort(options?: any): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }

  interface USBOutTransferResult {
    bytesWritten: number;
    status: 'ok' | 'stall' | 'babble';
  }

  interface USBDevice {
    vendorId: number;
    productId: number;
    productName?: string;
    opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
    configuration?: {
      interfaces: Array<{
        interfaceNumber: number;
        alternate: {
          endpoints: Array<{
            endpointNumber: number;
            direction: 'in' | 'out';
            type: 'bulk' | 'interrupt' | 'isochronous';
          }>;
        };
      }>;
    };
  }

  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    writable: WritableStream<Uint8Array>;
  }
}

export function useUsbPrinter() {
  const [status, setStatus] = useState<string>('Disconnected');
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const usbDeviceRef = useRef<USBDevice | null>(null);
  const endpointRef = useRef<number | null>(null);

  /**
   * Menghubungkan printer via WebUSB API (Direct USB di Browser)
   */
  const connectWebUsb = useCallback(async () => {
    setErrorMessage(null);
    if (typeof window === 'undefined' || !navigator.usb) {
      setErrorMessage('WebUSB API tidak didukung di browser ini. Harap gunakan Chrome atau Edge.');
      return;
    }

    try {
      setStatus('Connecting...');
      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Mencari interface & bulk OUT endpoint untuk cetak
      let targetInterface = 0;
      let targetEndpoint = 1;

      if (device.configuration) {
        for (const iface of device.configuration.interfaces) {
          for (const ep of iface.alternate.endpoints) {
            if (ep.direction === 'out') {
              targetInterface = iface.interfaceNumber;
              targetEndpoint = ep.endpointNumber;
              break;
            }
          }
        }
      }

      await device.claimInterface(targetInterface);
      usbDeviceRef.current = device;
      endpointRef.current = targetEndpoint;

      setDeviceInfo(device.productName || `USB Device (VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)})`);
      setStatus('Connected');
    } catch (err: any) {
      console.error('[WebUSB] Error:', err);
      setStatus('Disconnected');
      if (err.name !== 'NotFoundError') {
        if (err.message?.includes('claimInterface') || err.name === 'SecurityError' || err.name === 'NetworkError') {
          setErrorMessage(
            'Port USB sedang dikunci oleh driver Windows (HaoYin CP-58 B). Untuk mencetak langsung dari Windows, disarankan menggunakan Browser Print (window.print()) atau driver WinUSB.'
          );
        } else {
          setErrorMessage(err.message || 'Gagal terhubung via WebUSB.');
        }
      }
    }
  }, []);

  /**
   * Mengirim data ESC/POS via WebUSB
   */
  const sendUsbTestData = useCallback(async () => {
    if (!usbDeviceRef.current || endpointRef.current === null) {
      setErrorMessage('Printer USB belum terhubung.');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const ESC = 0x1b;
      const GS = 0x1d;

      const commands: number[] = [
        ESC, 0x40,
        ESC, 0x61, 0x01,
        ...Array.from(encoder.encode("=== GOPOS USB TEST ===\n")),
        ...Array.from(encoder.encode("HaoYin CP-58 B / POS-58\n")),
        ...Array.from(encoder.encode("--------------------------------\n")),
        ESC, 0x61, 0x00,
        ...Array.from(encoder.encode("Koneksi USB : BERHASIL!\n")),
        ...Array.from(encoder.encode("--------------------------------\n\n\n")),
        GS, 0x56, 0x42, 0x00
      ];

      await usbDeviceRef.current.transferOut(endpointRef.current, new Uint8Array(commands));
      return true;
    } catch (err: any) {
      console.error('[WebUSB] Error print:', err);
      setErrorMessage('Gagal mencetak via WebUSB: ' + err.message);
      return false;
    }
  }, []);

  return {
    status,
    deviceInfo,
    errorMessage,
    connectWebUsb,
    sendUsbTestData,
  };
}
