"use client";

import { useState, useRef } from "react";
import { 
  ChevronRight, 
  Package, 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  Download,
  Upload
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { ProductModal } from "@/features/products/components/ProductModal";
import { DeleteModal } from "@/features/products/components/DeleteModal";
import type { Product } from "@/types/api";
import { useProducts, useMutationProducts } from "@/features/products/hooks";

export default function ProductManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { products, meta, loading, refresh, setSearch, setPage, setParams } = useProducts();
  const { deleteProduct, loading: mutationLoading } = useMutationProducts();

  // ── Handlers Modal & Aksi ──────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleOpenDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.id) return;
    const res = await deleteProduct(selectedProduct.id);
    if (res?.success) {
      setShowDeleteModal(false);
      refresh();
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSearch(value);
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setParams({ search: "", page: 1 });
  };

  // ── Fitur Export CSV (Client-Side) ──────────────────────────────────────────
  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      alert("Tidak ada data produk yang bisa diexport.");
      return;
    }

    // 1. Definisikan header kolom CSV
    const headers = ["ID", "Nama Produk", "Barcode", "Harga Eceran", "Stok", "Min Stok", "Satuan"];
    
    // 2. Petakan data produk menjadi baris string CSV
    const csvRows = [
      headers.join(","), // Baris pertama (header)
      ...products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`, // Bungkus dengan kutip dua jika nama produk mengandung koma
        `"${p.barcode ?? ""}"`,
        p.price,
        p.stock,
        p.min_stock ?? 0,
        `"${p.unit ?? "pcs"}"`
      ].join(","))
    ];

    // 3. Buat file blob dan trigger unduhan di browser
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventori_produk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Fitur Import CSV Massal (Simulasi Form Data ke Backend) ─────────────────
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ekstensi file harus .csv
    if (!file.name.endsWith(".csv")) {
      alert("Format file salah. Mohon unggah file dengan format .csv");
      return;
    }

    const confirmImport = confirm(`Apakah Anda yakin ingin mengimport produk dari file "${file.name}"?`);
    if (!confirmImport) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    try {
      // Di sini kamu tinggal sesuaikan dengan endpoint backend Go kamu jika sudah ada.
      // Contoh implementasi FormData biasa:
      // const formData = new FormData();
      // formData.append("file", file);
      // await api.post("/products/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
      
      // Simulasi loading transmisi data 1 detik
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Berhasil mengimport data produk massal!");
      refresh();
    } catch (err) {
      console.error("Gagal mengimport file CSV:", err);
      alert("Terjadi kesalahan saat memproses file CSV.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input file
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Package className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Manajemen Produk</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          
          {/* Section Atas: Judul & Action Buttons */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Inventori Produk</h2>
              <p className="text-slate-500 text-sm mt-1">
                {meta ? `${meta.total.toLocaleString("id-ID")} produk terdaftar` : "Kelola stok dan harga."}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Input File CSV Hidden */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
                accept=".csv" 
                className="hidden" 
              />
              
              {/* Tombol Import CSV */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting || loading}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm transition-colors"
                title="Unggah berkas CSV massal"
              >
                <Upload className="h-4 w-4 text-slate-500" />
                {isImporting ? "Mengimport..." : "Import CSV"}
              </button>

              {/* Tombol Export CSV */}
              <button
                onClick={handleExportCSV}
                disabled={loading || products.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm transition-colors"
                title="Unduh seluruh tabel ke CSV"
              >
                <Download className="h-4 w-4 text-slate-500" />
                Export CSV
              </button>

              {/* Tombol Tambah Manual */}
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tambah Produk
              </button>
            </div>
          </div>

          {/* Bar Pencarian */}
          <div className="bg-white border rounded-xl p-4 mb-6 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Cari nama barang atau barcode..."
              />
            </div>
            {searchQuery && (
              <button
                onClick={handleResetSearch}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Tabel Kontainer */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                    Harga Eceran
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                    Stok
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right w-28">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <p className="text-sm font-medium">Memuat data inventori...</p>
                      </div>
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product: Product) => {
                    const isLowStock = product.min_stock != null && product.stock <= product.min_stock;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-slate-400 font-mono mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded w-max">
                                {product.barcode}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-blue-600">
                            Rp {product.price.toLocaleString("id-ID")}
                          </span>
                          {product.unit_big && product.price_big > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {product.unit_big}: Rp {product.price_big.toLocaleString("id-ID")}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold ${
                              isLowStock
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            {isLowStock && <span className="text-xs">⚠</span>}
                            {product.stock.toLocaleString("id-ID")} {product.unit ?? "pcs"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-0.5">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit produk"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(product)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus produk"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="p-4 bg-slate-100 rounded-full text-slate-400 mb-4">
                          <Package className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {searchQuery ? "Produk tidak ditemukan" : "Inventori Kosong"}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 mb-6">
                          {searchQuery
                            ? `Tidak ada produk yang cocok dengan "${searchQuery}".`
                            : "Belum ada produk yang terdaftar di sistem GoPOS."}
                        </p>
                        {searchQuery ? (
                          <button
                            onClick={handleResetSearch}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                          >
                            Reset Pencarian
                          </button>
                        ) : (
                          <button
                            onClick={handleOpenAdd}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                          >
                            Mulai Tambah Produk
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Kontrol */}
            {meta && meta.total_pages > 1 && (
              <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Halaman {meta.page} dari {meta.total_pages} •{" "}
                  {meta.total.toLocaleString("id-ID")} produk
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}
                    className="px-3 py-1.5 border bg-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50/80 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={meta.page >= meta.total_pages}
                    onClick={() => setPage(meta.page + 1)}
                    className="px-3 py-1.5 border bg-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50/80 transition-colors"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL FORMS */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        existingProduct={selectedProduct}
        onSuccess={refresh}
      />

      {/* MODAL CONFIRM DELETE KUSTOM */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        product={selectedProduct}
        isDeleting={mutationLoading}
      />
    </div>
  );
}