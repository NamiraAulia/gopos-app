"use client";

import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxIntervalMs = 65,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Jika jeda antar tombol terlalu lama (> maxIntervalMs), reset buffer
      if (timeDiff > maxIntervalMs) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();

          if (isInputFocused && target instanceof HTMLInputElement) {
            target.value = "";
          }

          onScanRef.current(barcode);
          bufferRef.current = "";
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [minChars, maxIntervalMs, enabled]);
}
