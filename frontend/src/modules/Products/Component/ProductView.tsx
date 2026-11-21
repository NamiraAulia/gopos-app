"use client";

import { RefObject } from "react";
import {
  ChevronRight,
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  ArrowUpDown,
  Percent,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { ProductModal } from "./ProductModal";
import { DeleteModal } from "./DeleteModal";
import { CsvImportModal } from "./CsvImportModal";
import type { ProductDTO } from "../DTO/products.dto";

interface ProductViewProps {
  searchQuery: string;
  showProductModal: boolean;
  setShowProductModal: (val: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  selectedProduct: ProductDTO | null;
  selectedIds: number[];
  sortOrder: "asc" | "desc";
  setSortOrder: (fn: any) => void;
  filterStokKritis: boolean;
  setFilterStokKritis: (val: boolean) => void;
  filterDataIncomplete: boolean;
  setFilterDataIncomplete: (val: boolean) => void;
  incompleteCount: number;
  showCsvModal: boolean;
  setShowCsvModal: (val: boolean) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  displayedProducts: ProductDTO[];
  loading: boolean;
  refresh: () => void;
  setPage: (p: number) => void;
  mutationLoading: boolean;
  handleSelectAll: () => void;
  handleSelectRow: (id: number) => void;
  handleBulkDeactivate: () => void;
  handleOpenAdd: () => void;
  handleOpenEdit: (p: ProductDTO) => void;
  handleOpenDelete: (p: ProductDTO) => void;
  handleConfirmDelete: () => Promise<void>;
  handleSearch: (q: string) => void;
  handleResetSearch: () => void;
  handleTogglePromo: () => void;
  handleExportCSV: () => void;
  meta: { page: number; limit: number; total: number; total_pages: number } | null;
}

export function ProductView({
  searchQuery,
  showProductModal,
  setShowProductModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedProduct,
  selectedIds,
  sortOrder,
  setSortOrder,
  filterStokKritis,
  setFilterStokKritis,
  filterDataIncomplete,
  setFilterDataIncomplete,
  incompleteCount,
  showCsvModal,
  setShowCsvModal,
  searchInputRef,
  displayedProducts,
  loading,
  refresh,
  setPage,
  mutationLoading,
  handleSelectAll,
  handleSelectRow,
  handleBulkDeactivate,
  handleOpenAdd,
  handleOpenEdit,
  handleOpenDelete,
  handleConfirmDelete,
  handleSearch,
  handleResetSearch,
  handleTogglePromo,
  handleExportCSV,
  meta,
}: ProductViewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 sm:h-18 bg-white border-b flex items-center px-6 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-sm">
              <Package className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              <span className="text-base sm:text-lg font-black text-slate-900">Manajemen Produk</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Inventori Produk</h2>
              <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                {meta ? `${meta.total.toLocaleString("id-ID")} produk terdaftar` : "Kelola stok dan harga."}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowCsvModal(true)}
                className="h-12 px-4 border-2 border-slate-200 bg-white text-slate-800 rounded-xl text-sm sm:text-base font-black shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="h-5 w-5 text-blue-600 stroke-[2.5]" /> Import CSV
              </button>
              <button
                onClick={handleExportCSV}
                className="h-12 px-4 border-2 border-slate-200 bg-white text-slate-800 rounded-xl text-sm sm:text-base font-black shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="h-5 w-5 text-slate-600 stroke-[2.5]" /> Export CSV
              </button>
              <button
                onClick={handleOpenAdd}
                className="h-12 px-5 bg-blue-600 text-white rounded-xl text-sm sm:text-base font-black hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" /> Tambah Produk
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6 stroke-[2.5]" />
              <input
                ref={searchInputRef as any}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none placeholder:text-slate-400 transition-all"
                placeholder="Cari barang atau scan barcode..."
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setFilterStokKritis(!filterStokKritis)}
                className={`h-12 px-4 border-2 rounded-xl text-sm sm:text-base font-black transition-all flex items-center gap-2 cursor-pointer ${
                  filterStokKritis ? "bg-red-50 border-red-300 text-red-700 shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle className="h-5 w-5 stroke-[2.5]" /> Stok Kritis
              </button>
              <button
                onClick={() => setFilterDataIncomplete(!filterDataIncomplete)}
                className={`h-12 px-4 border-2 rounded-xl text-sm sm:text-base font-black transition-all flex items-center gap-2 cursor-pointer ${
                  filterDataIncomplete ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <AlertCircle className="h-5 w-5 text-amber-600 stroke-[2.5]" /> Data Belum Lengkap ({incompleteCount})
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDeactivate}
                  className="h-12 px-4 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-black rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Kosongkan {selectedIds.length} Stok Terpilih
                </button>
              )}
              {(searchQuery || filterStokKritis || filterDataIncomplete || sortOrder !== "asc") && (
                <button
                  onClick={handleResetSearch}
                  className="h-12 px-4 text-sm sm:text-base text-slate-600 hover:text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b-2 border-slate-200">
                  <tr>
                    <th className="p-4 w-14 text-center">
                      <button onClick={handleSelectAll} className="text-slate-600 hover:text-slate-900 cursor-pointer p-1">
                        {selectedIds.length === displayedProducts.length && displayedProducts.length > 0 ? (
                          <CheckSquare className="h-5 w-5 text-blue-600 stroke-[2.5]" />
                        ) : (
                          <Square className="h-5 w-5 stroke-[2.5]" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">Nama Produk / Supplier</th>
                    <th className="px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider text-right">
                      <button onClick={() => setSortOrder((p: any) => p === "asc" ? "desc" : "asc")} className="inline-flex items-center gap-1.5 justify-end ml-auto font-black hover:text-slate-900 cursor-pointer">
                        Harga Jual / Margin
                        <ArrowUpDown className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider text-center w-28">Promo</th>
                    <th className="px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider text-right w-36">Stok</th>
                    <th className="px-6 py-4 text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse bg-white">
                        <td className="p-4"><div className="h-5 w-5 bg-slate-200 rounded mx-auto" /></td>
                        <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-2/3 mb-2" /><div className="h-4 bg-slate-100 rounded w-1/3" /></td>
                        <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-1/2 ml-auto mb-2" /><div className="h-4 bg-slate-100 rounded w-1/4 ml-auto" /></td>
                        <td className="px-6 py-4"><div className="h-8 w-10 bg-slate-200 rounded mx-auto" /></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded w-20 ml-auto" /></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded w-14 ml-auto" /></td>
                      </tr>
                    ))
                  ) : displayedProducts.length > 0 ? (
                    displayedProducts.map((product: ProductDTO) => {
                      const isLowStock = product.min_stock != null && product.stock <= product.min_stock;
                      const hpp = product.best_price || 0;
                      const marginPercent = product.price > 0 ? Math.round(((product.price - hpp) / product.price) * 100) : 0;

                      return (
                        <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(product.id!) ? "bg-blue-50/40" : ""}`}>
                          <td className="p-4 text-center">
                            <button onClick={() => handleSelectRow(product.id!)} className="text-slate-400 hover:text-blue-600 cursor-pointer p-1">
                              {selectedIds.includes(product.id!) ? (
                                <CheckSquare className="h-5 w-5 text-blue-600 stroke-[2.5]" />
                              ) : (
                                <Square className="h-5 w-5 stroke-[2.5]" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-base sm:text-lg">{product.name}</span>
                                {product.is_promo && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-black rounded-md border border-amber-300">
                                    PROMO
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 text-xs sm:text-sm text-slate-500 font-mono mt-1 font-bold">
                                <span>{product.barcode || "-"}</span>
                                <span>•</span>
                                <span className="text-slate-600 font-sans font-extrabold">Supplier: {product.supplier_name || 'Umum'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-black text-blue-700 text-base sm:text-lg">
                              Eceran: Rp {product.price.toLocaleString("id-ID")}
                            </p>
                            <p className="text-xs sm:text-sm text-purple-700 font-black mt-0.5">
                              Member: Rp {(product.price_member || 0).toLocaleString("id-ID")}
                            </p>
                            <p className={`text-xs sm:text-sm font-bold mt-0.5 ${marginPercent < 10 ? "text-red-600 font-black" : "text-slate-500"}`}>
                              Margin: {marginPercent}% <span className="text-slate-400 font-normal">(HPP: Rp {hpp.toLocaleString("id-ID")})</span>
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTogglePromo()}
                              className={`p-2 rounded-xl border-2 text-sm transition-all cursor-pointer ${
                                product.is_promo ? "bg-amber-500 border-amber-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              <Percent className="h-4 w-4 stroke-[2.5]" />
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm sm:text-base font-black ${
                              isLowStock ? "bg-red-50 text-red-700 border-2 border-red-200" : "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                            }`}>
                              {isLowStock && <AlertTriangle className="h-4 w-4 stroke-[2.5]" />} {product.stock.toLocaleString("id-ID")} {product.unit ?? "pcs"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="h-10 w-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                                title="Edit Produk"
                              >
                                <Pencil className="h-4 w-4 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(product)}
                                className="h-10 w-10 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                                title="Hapus Produk"
                              >
                                <Trash2 className="h-4 w-4 stroke-[2.5]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-600 text-base font-bold">
                        Data produk kosong atau kriteria pencarian tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.total_pages > 1 && (
              <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">
                  Halaman {meta.page} dari {meta.total_pages} • {meta.total.toLocaleString("id-ID")} produk
                </p>
                <div className="flex gap-2.5">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}
                    className="h-11 px-4 border-2 border-slate-300 bg-white rounded-xl text-sm font-black disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={meta.page >= meta.total_pages}
                    onClick={() => setPage(meta.page + 1)}
                    className="h-11 px-4 border-2 border-slate-300 bg-white rounded-xl text-sm font-black disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          existingProduct={selectedProduct}
          onSuccess={refresh}
        />

        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          product={selectedProduct}
          isDeleting={mutationLoading}
        />

        <CsvImportModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          onSuccess={refresh}
        />
      </main>
    </div>
  );
}
