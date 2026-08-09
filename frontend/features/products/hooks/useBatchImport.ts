import { useState, useRef, useCallback } from "react";
import { productsApi } from "../api";

export const CHUNK_SIZE = 100;

export interface BatchProductItem {
  name: string;
  barcode: string;
  price: number;
  price_member?: number;
  best_price?: number;
  unit?: string;
  min_stock?: number;
  stock?: number;
  unit_big?: string;
  conversion?: number;
  price_big?: number;
  supplier_name?: string;
  action: "create" | "update" | "skip";
}

export interface BatchItemResult {
  index: number;
  status: "success" | "updated" | "skipped" | "failed";
  name: string;
  barcode: string;
  error?: string;
}

export interface BatchProgressState {
  status: "idle" | "importing" | "completed" | "cancelled" | "error";
  processedCount: number;
  totalCount: number;
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  currentChunkIndex: number;
  totalChunks: number;
  details: BatchItemResult[];
  failedChunkItems: BatchProductItem[];
}

export function useBatchImport() {
  const [progress, setProgress] = useState<BatchProgressState>({
    status: "idle",
    processedCount: 0,
    totalCount: 0,
    successCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    currentChunkIndex: 0,
    totalChunks: 0,
    details: [],
    failedChunkItems: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startBatchImport = useCallback(async (items: BatchProductItem[]) => {
    if (!items || items.length === 0) return;

    // Split items into chunks of CHUNK_SIZE (100)
    const chunks: BatchProductItem[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setProgress({
      status: "importing",
      processedCount: 0,
      totalCount: items.length,
      successCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      currentChunkIndex: 0,
      totalChunks: chunks.length,
      details: [],
      failedChunkItems: [],
    });

    let currentProcessed = 0;
    let currentSuccess = 0;
    let currentUpdated = 0;
    let currentSkipped = 0;
    let currentFailed = 0;
    const accumulatedDetails: BatchItemResult[] = [];
    const failedChunksAcc: BatchProductItem[] = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      if (signal.aborted) {
        setProgress((prev) => ({ ...prev, status: "cancelled" }));
        return;
      }

      const chunk = chunks[chunkIdx];

      try {
        const res = await productsApi.batchImport(chunk, signal);
        if (signal.aborted) return;

        if (res && res.ok && res.data) {
          const { success_count, updated_count, skipped_count, failed_count, details } = res.data;
          currentSuccess += success_count || 0;
          currentUpdated += updated_count || 0;
          currentSkipped += skipped_count || 0;
          currentFailed += failed_count || 0;

          if (details && Array.isArray(details)) {
            accumulatedDetails.push(
              ...details.map((d) => ({
                ...d,
                index: currentProcessed + d.index,
              }))
            );
          }
        } else {
          // Chunk call didn't return success payload -> treat chunk items as failed
          const errorMsg = res?.errorDetail || res?.message || "Gagal memproses batch di server";
          currentFailed += chunk.length;
          failedChunksAcc.push(...chunk);
          chunk.forEach((item, i) => {
            accumulatedDetails.push({
              index: currentProcessed + i,
              status: "failed",
              name: item.name,
              barcode: item.barcode,
              error: errorMsg,
            });
          });
        }
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.name === "AbortError" || signal.aborted) {
          setProgress((prev) => ({ ...prev, status: "cancelled" }));
          return;
        }

        // Network or server error on this chunk -> capture failed items and continue
        currentFailed += chunk.length;
        failedChunksAcc.push(...chunk);
        chunk.forEach((item, i) => {
          accumulatedDetails.push({
            index: currentProcessed + i,
            status: "failed",
            name: item.name,
            barcode: item.barcode,
            error: err?.message || "Koneksi terputus saat memproses chunk ini",
          });
        });
      }

      currentProcessed += chunk.length;

      setProgress((prev) => ({
        ...prev,
        processedCount: currentProcessed,
        successCount: currentSuccess,
        updatedCount: currentUpdated,
        skippedCount: currentSkipped,
        failedCount: currentFailed,
        currentChunkIndex: chunkIdx + 1,
        details: [...accumulatedDetails],
        failedChunkItems: [...failedChunksAcc],
      }));
    }

    setProgress((prev) => ({
      ...prev,
      status: "completed",
    }));
  }, []);

  const cancelBatchImport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setProgress((prev) => ({ ...prev, status: "cancelled" }));
    }
  }, []);

  const resetBatchImport = useCallback(() => {
    setProgress({
      status: "idle",
      processedCount: 0,
      totalCount: 0,
      successCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      currentChunkIndex: 0,
      totalChunks: 0,
      details: [],
      failedChunkItems: [],
    });
  }, []);

  return {
    progress,
    startBatchImport,
    cancelBatchImport,
    resetBatchImport,
    CHUNK_SIZE,
  };
}
