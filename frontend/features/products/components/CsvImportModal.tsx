"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { 
  X, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  Ban
} from "lucide-react";
import { 
  useBatchImport, 
  BatchProductItem, 
  safeParseInt, 
  safeParseFloat 
} from "../hooks/useBatchImport";
import { productsApi } from "../api";

export interface ParsedCsvRow {
  id: string; // unique internal row id
  originalIndex: number;
  barcode: string;
  nama_barang: string;
  harga_jual_eceran: number | string;
  harga_khusus_member: number | string;
  harga_modal_hpp: number | string;
  satuan_eceran: string;
  min_stok: number | string;
  total_stok: number | string;
  satuan_besar: string;
  isi_per_satuan_besar: number | string;
  harga_per_grosir: number | string;
  
  // Validation status
  status: "valid" | "warning" | "db_duplicate" | "csv_duplicate" | "error";
  action: "create" | "update" | "skip";
  errorMessages: string[];
  appliedDefaults: string[];
  isDbDuplicate: boolean;
  isCsvDuplicate: boolean;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PAGE_SIZE = 50;

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [existingBarcodes, setExistingBarcodes] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<ParsedCsvRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "importable" | "db_dup" | "csv_dup" | "error">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { progress, startBatchImport, cancelBatchImport, resetBatchImport, CHUNK_SIZE } = useBatchImport();

  // Load existing barcodes from DB when modal opens
  useEffect(() => {
    if (isOpen) {
      productsApi.getBarcodes().then((res: any) => {
        if ((res?.ok || res?.success) && Array.isArray(res.data)) {
          setExistingBarcodes(new Set(res.data.map((b: string) => String(b).trim())));
        }
      }).catch(() => {});
    } else {

      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    setFile(null);
    setIsParsing(false);
    setRows([]);
    setActiveFilter("all");
    setCurrentPage(1);
    resetBatchImport();
  };

  // Helper validation function for a set of raw parsed rows
  const validateRows = (rawRows: any[], dbBarcodes: Set<string>): ParsedCsvRow[] => {
    const seenCsvBarcodes = new Set<string>();

    // Helper to normalize base product names (collapsing spaces & stripping suffixes)
    const getCleanNameKey = (rawName: string): string => {
      let upper = String(rawName || "").trim().toUpperCase();
      upper = upper.replace(/\s+(DUS|BOX|PAK|RCG|RENCENG|SLOP|BAL|PCS|BUNGKUS|BOTOL|IKAT|TRAY)$/i, "").trim();
      upper = upper.replace(/\s+/g, ""); // Collapse all spaces "KUS KUS" -> "KUSKUS"
      return upper;
    };

    // Pre-pass: map rows by normalized base name to detect Pak vs Pcs price ratios
    const nameMap = new Map<string, { parentIdx: number; retailPrice: number; pakPrice: number }>();
    
    rawRows.forEach((raw, idx) => {
      const nama = String(raw.nama_barang || raw.nama_produk || raw.nama || raw.Name || "").trim();
      if (!nama) return;
      const key = getCleanNameKey(nama);
      const price = Number(raw.harga_jual_eceran ?? raw.harga_jual ?? raw.harga ?? raw.price ?? 0);
      
      if (!nameMap.has(key)) {
        nameMap.set(key, { parentIdx: idx, retailPrice: price, pakPrice: 0 });
      } else {
        const existing = nameMap.get(key)!;
        if (price > 0 && existing.retailPrice > 0) {
          if (price >= existing.retailPrice * 1.5) {
            existing.pakPrice = Math.max(existing.pakPrice, price);
          } else if (existing.retailPrice >= price * 1.5) {
            existing.pakPrice = Math.max(existing.pakPrice, existing.retailPrice);
            existing.retailPrice = price;
            existing.parentIdx = idx;
          }
        }
      }
    });

    const seenNameKeys = new Set<string>();

    return rawRows.map((raw, idx) => {
      const barcode = String(raw.barcode || raw.Barcode || "").trim();
      const nama_barang = String(raw.nama_barang || raw.nama_produk || raw.nama || raw.Name || "").trim();
      const rawPrice = raw.harga_jual_eceran ?? raw.harga_jual ?? raw.harga ?? raw.price ?? "";
      let harga_jual_eceran = rawPrice;
      const harga_khusus_member = raw.harga_khusus_member ?? raw.harga_member ?? raw.price_member ?? "";
      const harga_modal_hpp = raw.harga_modal_hpp ?? raw.hpp ?? raw.best_price ?? "";
      let satuan_eceran = String(raw.satuan_eceran || raw.satuan || raw.unit || "").trim();
      const min_stok = raw.min_stok ?? raw.min_stock ?? "";
      const total_stok = raw.total_stok ?? raw.stok ?? raw.stock ?? "";
      let satuan_besar = String(raw.satuan_besar || raw.unit_big || "").trim();
      let isi_per_satuan_besar = raw.isi_per_satuan_besar ?? raw.conversion ?? "";
      let harga_per_grosir = raw.harga_per_grosir ?? raw.harga_grosir ?? raw.price_big ?? "";

      const errors: string[] = [];
      const defaults: string[] = [];

      const cleanKey = getCleanNameKey(nama_barang);
      const groupInfo = nameMap.get(cleanKey);

      let isCsvDuplicate = false;

      // Smart Name Deduplication: If this row is the higher-priced Pak row of a duplicate group
      if (groupInfo && groupInfo.pakPrice > 0) {
        const currentPrice = Number(rawPrice);
        if (idx === groupInfo.parentIdx) {
          // This is the parent retail row! Merge grosir fields from the Pak row
          if (!satuan_besar || satuan_besar === "-") satuan_besar = "PAK";
          if (!harga_per_grosir || Number(harga_per_grosir) <= 0) harga_per_grosir = groupInfo.pakPrice;
          if (!isi_per_satuan_besar || Number(isi_per_satuan_besar) <= 0) {
            if (groupInfo.retailPrice > 0) {
              isi_per_satuan_besar = Math.floor(groupInfo.pakPrice / groupInfo.retailPrice);
            }
          }
          defaults.push(`Otomatis gabung Grosir ${satuan_besar} Rp ${groupInfo.pakPrice.toLocaleString()}`);
        } else if (currentPrice >= groupInfo.retailPrice * 1.5) {
          // This is the Pak duplicate row! Mark as CSV Duplicate so it's skipped
          isCsvDuplicate = true;
          defaults.push("Digabung ke varian eceran");
        }
      }

      const parsedPrice = Number(harga_jual_eceran);

      if (!nama_barang) {
        errors.push("Nama barang wajib diisi");
      }
      if (harga_jual_eceran === "" || isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push("Harga jual eceran wajib diisi & > 0");
      }

      // Check intra-CSV barcode duplicate
      if (barcode !== "") {
        if (seenCsvBarcodes.has(barcode)) {
          isCsvDuplicate = true;
        } else {
          seenCsvBarcodes.add(barcode);
        }
      }

      // Check DB duplicate
      const isDbDuplicate = barcode !== "" && dbBarcodes.has(barcode);

      // Determine default values info
      if (satuan_eceran === "") defaults.push("Satuan default 'Pcs'");
      if (min_stok === "" || Number(min_stok) <= 0) defaults.push("Min stok default 5");
      if (total_stok === "") defaults.push("Stok default 0");
      if (harga_modal_hpp === "") defaults.push("HPP default 0");

      if (satuan_besar !== "" && satuan_besar !== "-") {
        const conv = Number(isi_per_satuan_besar);
        const pBig = Number(harga_per_grosir);
        if (!conv || conv <= 0 || !pBig || pBig <= 0) {
          defaults.push("Field grosir tidak lengkap -> diabaikan");
        }
      }

      let status: ParsedCsvRow["status"] = "valid";
      let action: ParsedCsvRow["action"] = "create";

      if (errors.length > 0) {
        status = "error";
        action = "skip";
      } else if (isCsvDuplicate) {
        status = "csv_duplicate";
        action = "skip";
      } else if (isDbDuplicate) {
        status = "db_duplicate";
        action = "skip";
      } else if (defaults.length > 0) {
        status = "warning";
        action = "create";
      }

      return {
        id: `row-${idx}-${Date.now()}`,
        originalIndex: idx + 1,
        barcode,
        nama_barang,
        harga_jual_eceran,
        harga_khusus_member,
        harga_modal_hpp,
        satuan_eceran,
        min_stok,
        total_stok,
        satuan_besar,
        isi_per_satuan_besar,
        harga_per_grosir,
        status,
        action,
        errorMessages: errors,
        appliedDefaults: defaults,
        isDbDuplicate,
        isCsvDuplicate,
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        setIsParsing(false);
        const parsed = validateRows(results.data, existingBarcodes);
        setRows(parsed);
      },
      error: (err) => {
        setIsParsing(false);
        alert(`Gagal membaca berkas CSV: ${err.message}`);
      },
    });
  };

  // Cell edit handler
  const handleCellEdit = (id: string, field: keyof ParsedCsvRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      const index = copy.findIndex((r) => r.id === id);
      if (index === -1) return prev;

      const updatedRow = { ...copy[index], [field]: value };
      
      // Re-validate all rows to ensure intra-CSV duplicate detection stays accurate
      const rawData = copy.map((r, idx) => idx === index ? updatedRow : r);
      return validateRows(rawData, existingBarcodes);
    });
  };

  // Toggle update action for DB duplicate rows
  const handleToggleDbUpdate = (id: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id && r.isDbDuplicate && r.status !== "error") {
          const nextAction = r.action === "update" ? "skip" : "update";
          return { ...r, action: nextAction };
        }
        return r;
      })
    );
  };

  // Summary counts
  const summary = useMemo(() => {
    let total = rows.length;
    let validCount = 0;
    let warningCount = 0;
    let dbDupCount = 0;
    let dbUpdateCount = 0;
    let csvDupCount = 0;
    let errorCount = 0;
    let importableCount = 0;

    rows.forEach((r) => {
      if (r.status === "error") errorCount++;
      else if (r.status === "csv_duplicate") csvDupCount++;
      else if (r.status === "db_duplicate") {
        dbDupCount++;
        if (r.action === "update") dbUpdateCount++;
      } else if (r.status === "warning") warningCount++;
      else validCount++;

      if (r.action === "create" || r.action === "update") {
        importableCount++;
      }
    });

    return {
      total,
      validCount,
      warningCount,
      dbDupCount,
      dbUpdateCount,
      csvDupCount,
      errorCount,
      importableCount,
    };
  }, [rows]);

  // Filtered rows for paginated table
  const filteredRows = useMemo(() => {
    switch (activeFilter) {
      case "importable":
        return rows.filter((r) => r.action === "create" || r.action === "update");
      case "db_dup":
        return rows.filter((r) => r.isDbDuplicate);
      case "csv_dup":
        return rows.filter((r) => r.isCsvDuplicate);
      case "error":
        return rows.filter((r) => r.status === "error");
      default:
        return rows;
    }
  }, [rows, activeFilter]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Submit batch import
  const handleSubmitBatch = () => {
    const importableItems: BatchProductItem[] = rows
      .filter((r) => r.action === "create" || r.action === "update")
      .map((r) => {
        const itemLabel = r.nama_barang || r.barcode || `Baris #${r.originalIndex}`;
        return {
          name: r.nama_barang ? String(r.nama_barang).trim() : "",
          barcode: r.barcode ? String(r.barcode).trim() : "",
          price: safeParseInt(r.harga_jual_eceran, "price", itemLabel),
          price_member: safeParseInt(r.harga_khusus_member, "price_member", itemLabel),
          best_price: safeParseInt(r.harga_modal_hpp, "best_price", itemLabel),
          unit: r.satuan_eceran ? String(r.satuan_eceran).trim() : "Pcs",
          min_stock: r.min_stok !== "" && r.min_stok !== undefined && r.min_stok !== null
            ? safeParseInt(r.min_stok, "min_stock", itemLabel)
            : 5,
          stock: safeParseFloat(r.total_stok, "stock", itemLabel),
          unit_big: r.satuan_besar ? String(r.satuan_besar).trim() : "",
          conversion: safeParseInt(r.isi_per_satuan_besar, "conversion", itemLabel),
          price_big: safeParseInt(r.harga_per_grosir, "price_big", itemLabel),
          supplier_name: "",
          action: r.action,
        };
      });

    if (importableItems.length === 0) return;
    startBatchImport(importableItems);
  };

  const handleFinishSuccess = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Import Data Produk CSV</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Upload & pratinjau data produk skala besar dengan batch processing
              </p>
            </div>
          </div>

          {progress.status === "idle" && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: FILE UPLOAD ZONE (if no file loaded or idle) */}
          {rows.length === 0 && (
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-12 text-center transition-all bg-slate-50/30">
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="csv-file-input"
                className="flex flex-col items-center justify-center cursor-pointer space-y-3"
              >
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    {isParsing ? "Membaca & Memvalidasi File CSV..." : "Pilih atau Drag File CSV di Sini"}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Struktur header yang didukung: <span className="font-mono text-slate-600">barcode, nama_barang, harga_jual_eceran, harga_khusus_member, harga_modal_hpp, satuan_eceran, min_stok, total_stok, satuan_besar, isi_per_satuan_besar, harga_per_grosir</span>
                  </p>
                </div>
                <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
                  Cari Berkas CSV
                </span>
              </label>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION TABLE (When file parsed & progress idle) */}
          {rows.length > 0 && progress.status === "idle" && (
            <div className="space-y-4">
              
              {/* SUMMARY STATS BANNER */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-slate-50 border rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Baris</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{summary.total}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Siap Buat Baru</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{summary.validCount + summary.warningCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Update DB</p>
                  <p className="text-xl font-black text-amber-800 mt-0.5">{summary.dbUpdateCount}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-orange-600 uppercase">Duplikat DB (Dilewati)</p>
                  <p className="text-xl font-black text-orange-700 mt-0.5">{summary.dbDupCount - summary.dbUpdateCount}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-purple-600 uppercase">Duplikat File</p>
                  <p className="text-xl font-black text-purple-700 mt-0.5">{summary.csvDupCount}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-red-600 uppercase">Error (Dilewati)</p>
                  <p className="text-xl font-black text-red-700 mt-0.5">{summary.errorCount}</p>
                </div>
              </div>

              {/* FILTER TABS & PAGINATION CONTROLS */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 border rounded-xl">
                <div className="flex gap-1 overflow-x-auto">
                  <button
                    onClick={() => { setActiveFilter("all"); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Semua Baris ({summary.total})
                  </button>
                  <button
                    onClick={() => { setActiveFilter("importable"); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "importable" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-100/50"}`}
                  >
                    Akan Diimport ({summary.importableCount})
                  </button>
                  <button
                    onClick={() => { setActiveFilter("db_dup"); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "db_dup" ? "bg-orange-500 text-white shadow-sm" : "text-orange-700 hover:bg-orange-100/50"}`}
                  >
                    Duplikat DB ({summary.dbDupCount})
                  </button>
                  <button
                    onClick={() => { setActiveFilter("csv_dup"); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "csv_dup" ? "bg-purple-600 text-white shadow-sm" : "text-purple-700 hover:bg-purple-100/50"}`}
                  >
                    Duplikat File ({summary.csvDupCount})
                  </button>
                  <button
                    onClick={() => { setActiveFilter("error"); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "error" ? "bg-red-600 text-white shadow-sm" : "text-red-700 hover:bg-red-100/50"}`}
                  >
                    Error ({summary.errorCount})
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 ml-auto">
                  <span>Halaman {currentPage} dari {totalPages} ({filteredRows.length} baris)</span>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-1 rounded-lg border bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-1 rounded-lg border bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="border rounded-xl overflow-x-auto shadow-sm max-h-[50vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3 w-28">Status / Aksi</th>
                      <th className="p-3 min-w-[140px]">Barcode</th>
                      <th className="p-3 min-w-[200px]">Nama Barang *</th>
                      <th className="p-3 min-w-[120px] text-right">Harga Jual *</th>
                      <th className="p-3 min-w-[120px] text-right">HPP (Modal)</th>
                      <th className="p-3 min-w-[100px] text-right">Stok</th>
                      <th className="p-3 min-w-[90px]">Satuan</th>
                      <th className="p-3 min-w-[200px]">Catatan / Defaults</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                          Tidak ada baris data pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => {
                        let rowBg = "hover:bg-slate-50";
                        if (row.status === "error") rowBg = "bg-red-50/60 hover:bg-red-50";
                        else if (row.status === "csv_duplicate") rowBg = "bg-purple-50/60 hover:bg-purple-50";
                        else if (row.status === "db_duplicate") rowBg = row.action === "update" ? "bg-amber-50 hover:bg-amber-100/60" : "bg-orange-50/60 hover:bg-orange-50";
                        else if (row.status === "warning") rowBg = "bg-yellow-50/40 hover:bg-yellow-50";

                        return (
                          <tr key={row.id} className={`${rowBg} transition-colors`}>
                            <td className="p-3 text-center text-slate-400 font-mono">{row.originalIndex}</td>

                            {/* STATUS & ACTION BADGE */}
                            <td className="p-3">
                              {row.status === "error" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[10px]">
                                  <AlertCircle className="h-3 w-3" /> Error
                                </span>
                              ) : row.status === "csv_duplicate" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-600 text-white font-bold text-[10px]">
                                  <Ban className="h-3 w-3" /> Dup File
                                </span>
                              ) : row.status === "db_duplicate" ? (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.action === "update"}
                                    onChange={() => handleToggleDbUpdate(row.id)}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                                  />
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${row.action === "update" ? "bg-amber-500 text-white" : "bg-orange-200 text-orange-800"}`}>
                                    {row.action === "update" ? "Update DB" : "Lewati"}
                                  </span>
                                </label>
                              ) : row.status === "warning" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Impor (Default)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                                  <CheckCircle2 className="h-3 w-3" /> Impor Baru
                                </span>
                              )}
                            </td>

                            {/* BARCODE (INLINE EDIT) */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.barcode}
                                placeholder="Auto PRD-..."
                                onChange={(e) => handleCellEdit(row.id, "barcode", e.target.value)}
                                className="w-full px-2 py-1 border rounded font-mono bg-white outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* NAMA BARANG (INLINE EDIT) */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.nama_barang}
                                placeholder="Nama barang..."
                                onChange={(e) => handleCellEdit(row.id, "nama_barang", e.target.value)}
                                className={`w-full px-2 py-1 border rounded bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold ${!row.nama_barang ? "border-red-400 bg-red-50" : ""}`}
                              />
                            </td>

                            {/* HARGA JUAL (INLINE EDIT) */}
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={row.harga_jual_eceran}
                                placeholder="Rp 0"
                                onChange={(e) => handleCellEdit(row.id, "harga_jual_eceran", e.target.value)}
                                className={`w-full px-2 py-1 border rounded bg-white text-right outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-blue-600 ${Number(row.harga_jual_eceran) <= 0 ? "border-red-400 bg-red-50" : ""}`}
                              />
                            </td>

                            {/* HPP MODAL (INLINE EDIT) */}
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={row.harga_modal_hpp}
                                placeholder="0"
                                onChange={(e) => handleCellEdit(row.id, "harga_modal_hpp", e.target.value)}
                                className="w-full px-2 py-1 border rounded bg-white text-right outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-600"
                              />
                            </td>

                            {/* TOTAL STOK (INLINE EDIT) */}
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={row.total_stok}
                                placeholder="0"
                                onChange={(e) => handleCellEdit(row.id, "total_stok", e.target.value)}
                                className="w-full px-2 py-1 border rounded bg-white text-right outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                              />
                            </td>

                            {/* SATUAN ECERAN */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.satuan_eceran}
                                placeholder="Pcs"
                                onChange={(e) => handleCellEdit(row.id, "satuan_eceran", e.target.value)}
                                className="w-full px-2 py-1 border rounded bg-white outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                              />
                            </td>

                            {/* CATATAN / ERROR / DEFAULTS */}
                            <td className="p-3 text-[11px]">
                              {row.errorMessages.length > 0 ? (
                                <span className="text-red-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  {row.errorMessages.join(", ")}
                                </span>
                              ) : row.isCsvDuplicate ? (
                                <span className="text-purple-700 font-semibold flex items-center gap-1">
                                  <Ban className="h-3 w-3 shrink-0" />
                                  Duplikat dalam file ini (dilewati)
                                </span>
                              ) : row.isDbDuplicate ? (
                                <span className="text-orange-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  {row.action === "update" ? "Akan memperbarui data existing" : "Barcode ada di DB (Centang untuk update)"}
                                </span>
                              ) : row.appliedDefaults.length > 0 ? (
                                <span className="text-slate-500 italic flex items-center gap-1">
                                  <Info className="h-3 w-3 text-blue-500 shrink-0" />
                                  {row.appliedDefaults.join("; ")}
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Valid & Lengkap</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: PROGRESS BAR & BATCH STATUS SCREEN */}
          {progress.status !== "idle" && (
            <div className="py-8 px-4 max-w-xl mx-auto space-y-6">
              
              {/* PROGRESS TITLE */}
              <div className="text-center space-y-2">
                {progress.status === "importing" && (
                  <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-full animate-spin">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                )}
                {progress.status === "completed" && (
                  <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                )}
                {progress.status === "cancelled" && (
                  <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-full">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                )}
                
                <h4 className="text-xl font-bold text-slate-900">
                  {progress.status === "importing" && "Mengimpor Produk ke Database..."}
                  {progress.status === "completed" && "Proses Import Selesai!"}
                  {progress.status === "cancelled" && "Proses Import Dibatalkan"}
                </h4>
                
                <p className="text-sm font-medium text-slate-500">
                  Mengimpor: <span className="font-bold text-slate-800">{progress.processedCount} / {progress.totalCount}</span> produk 
                  ({Math.round((progress.processedCount / (progress.totalCount || 1)) * 100)}%)
                </p>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border">
                <div
                  className={`h-full transition-all duration-300 ${
                    progress.status === "completed"
                      ? "bg-emerald-500"
                      : progress.status === "cancelled"
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${Math.round((progress.processedCount / (progress.totalCount || 1)) * 100)}%`,
                  }}
                />
              </div>

              {/* STATS COUNTER SUMMARY */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 border rounded-2xl p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Dibuat</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">{progress.successCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase">Diperbarui</p>
                  <p className="text-lg font-black text-amber-700 mt-0.5">{progress.updatedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Dilewati</p>
                  <p className="text-lg font-black text-slate-600 mt-0.5">{progress.skippedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-600 uppercase">Gagal</p>
                  <p className="text-lg font-black text-red-700 mt-0.5">{progress.failedCount}</p>
                </div>
              </div>

              {/* FAILED DETAILS & RETRY OPTION */}
              {progress.failedCount > 0 && progress.status === "completed" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-red-800">
                      Terdapat {progress.failedCount} produk gagal diimpor:
                    </p>
                    {progress.failedChunkItems.length > 0 && (
                      <button
                        onClick={() => startBatchImport(progress.failedChunkItems)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Coba Lagi Chunk Gagal
                      </button>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto text-[11px] font-mono text-red-700 space-y-1 divide-y divide-red-100">
                    {progress.details
                      .filter((d) => d.status === "failed")
                      .map((d, i) => (
                        <div key={i} className="pt-1 flex justify-between gap-2">
                          <span>{d.name || d.barcode || `Baris ${d.index + 1}`}</span>
                          <span className="font-bold">{d.error || "Gagal"}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* CANCEL BUTTON DURING IMPORT */}
              {progress.status === "importing" && (
                <div className="text-center pt-2">
                  <button
                    onClick={cancelBatchImport}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Batalkan Import
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div>
            {rows.length > 0 && progress.status === "idle" && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Ganti File CSV
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {progress.status === "idle" ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  disabled={summary.importableCount === 0}
                  onClick={handleSubmitBatch}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Simpan Semua Ke Database ({summary.importableCount} baris)
                </button>
              </>
            ) : progress.status === "completed" || progress.status === "cancelled" ? (
              <button
                onClick={handleFinishSuccess}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
