"use client";

import { useState, useRef, useEffect } from "react";
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
  Square 
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

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");
  const [filterStokKritis, setFilterStokKritis] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { products, meta, loading, refresh, setSearch, setPage, setParams } = useProducts();
  const { deleteProduct, updateProduct, uploadCsv, loading: mutationLoading } = useMutationProducts();

  let displayedProducts = [...products];

  if (filterStokKritis) {
    displayedProducts = displayedProducts.filter(
      (p) => p.min_stock != null && p.stock <= p.min_stock
    );
  }

  if (sortOrder !== "none") {
    displayedProducts.sort((a, b) => 
      sortOrder === "asc" ? a.price - b.price : b.price - a.price
    );
  }

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 40) buffer = ""; 
      lastKeyTime = currentTime;

      if (e.key === "Enter" && buffer.length > 3) {
        e.preventDefault();
        setSearchQuery(buffer);
        setSearch(buffer);
        buffer = "";
        searchInputRef.current?.focus();
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setSearch]);

  const handleSelectAll = () => {
    if (selectedIds.length === displayedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        displayedProducts
          .map((p) => p.id)
          .filter((id): id is number => id !== undefined)
      );
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Apakah Anda yakin ingin menonaktifkan/mengosongkan stok ${selectedIds.length} produk terpilih?`)) {
      await Promise.all(
        selectedIds.map((id) => updateProduct(id, { stock: 0, unit_choice: "small" } as any))
      );
      setSelectedIds([]);
      refresh();
    }
  };

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
    setFilterStokKritis(false);
    setSortOrder("none");
    setParams({ search: "", page: 1 });
  };

  const handleTogglePromo = async (product: Product) => {
    const res = await updateProduct(product.id, {
      ...product,
      is_promo: !(product as any).is_promo,
      unit_choice: "small"
    } as any);
    if (res?.success) refresh();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadCsv(file);
      if (res?.success) {
        alert(`Berhasil mengimpor data! ${res.message || ''}`);
        refresh();
      }
    } catch (err: any) {
      alert(`Gagal impor berkas: ${err.message || "Periksa keselarasan kolom CSV"}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ["ID", "Nama", "Supplier", "HPP", "Harga Jual", "Stok"];
    const rows = [
      headers.join(","),
      ...products.map((p) => [
        p.id, 
        `"${p.name}"`, 
        `"${(p as any).supplier_name || '-'}"`, 
        (p as any).best_price || 0, 
        p.price, 
        p.stock
      ].join(","))
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventori_gopos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Inventori Produk</h2>
              <p className="text-slate-500 text-sm mt-1">
                {meta ? `${meta.total.toLocaleString("id-ID")} produk terdaftar` : "Kelola stok dan harga."}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 border bg-white text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
                <Upload className="h-4 w-4 text-slate-500" /> Import CSV
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 border bg-white text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
                <Download className="h-4 w-4 text-slate-500" /> Export CSV
              </button>
              <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
                <Plus className="h-4 w-4" /> Tambah Produk
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 mb-6 flex gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-400" placeholder="Cari barang atau scan barcode..." />
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterStokKritis(!filterStokKritis)} className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs font-bold transition-all ${filterStokKritis ? "bg-red-50 border-red-200 text-red-600" : "bg-white text-slate-600"}`}>
                <AlertTriangle className="h-3.5 w-3.5" /> Stok Kritis
              </button>
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDeactivate} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                  Kosongkan {selectedIds.length} Stok Terpilih
                </button>
              )}
              {(searchQuery || filterStokKritis || sortOrder !== "none") && (
                <button onClick={handleResetSearch} className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-800">
                      {selectedIds.length === displayedProducts.length && displayedProducts.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Nama Produk / Supplier</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">
                    <button onClick={() => setSortOrder(p => p === "asc" ? "desc" : "asc")} className="inline-flex items-center gap-1 justify-end ml-auto font-black hover:text-slate-900">
                      Harga Jual / Margin
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center w-24">Promo</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right w-32">Stok</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse bg-white">
                      <td className="p-4"><div className="h-4 w-4 bg-slate-200 rounded mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-2/3 mb-2" /><div className="h-3 bg-slate-100 rounded w-1/3" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-1/2 ml-auto mb-2" /><div className="h-3 bg-slate-100 rounded w-1/4 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-8 bg-slate-200 rounded mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : displayedProducts.length > 0 ? (
                  displayedProducts.map((product: Product) => {
                    const isLowStock = product.min_stock != null && product.stock <= product.min_stock;
                    const hpp = (product as any).best_price || 0;
                    const marginPercent = product.price > 0 ? Math.round(((product.price - hpp) / product.price) * 100) : 0;
                    
                    return (
                      <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(product.id!) ? "bg-blue-50/30" : ""}`}>
                        <td className="p-4 text-center">
                          <button onClick={() => handleSelectRow(product.id!)} className="text-slate-400 hover:text-blue-600">
                            {selectedIds.includes(product.id!) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-slate-900">{product.name}</span>
                            {(product as any).is_promo && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded">PROMO</span>}
                            <div className="flex gap-2 text-xs text-slate-400 font-mono mt-0.5">
                              <span>{product.barcode || "-"}</span>
                              <span>•</span>
                              <span className="text-slate-500 font-sans font-medium">Supplier: {(product as any).supplier_name || 'Umum'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-blue-600">Eceran: Rp {product.price.toLocaleString("id-ID")}</p>
                          <p className="text-[10px] text-purple-600 font-black mt-0.5">Member: Rp {(product.price_member || 0).toLocaleString("id-ID")}</p>
                          <p className={`text-[11px] font-medium mt-0.5 ${marginPercent < 10 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                            Margin: {marginPercent}% <span className="text-slate-300">(HPP: Rp {hpp.toLocaleString("id-ID")})</span>
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleTogglePromo(product)} className={`p-1.5 rounded-lg border text-xs transition-all ${ (product as any).is_promo ? "bg-amber-500 border-amber-600 text-white shadow-sm" : "bg-white text-slate-400 hover:bg-slate-50" }`}>
                            <Percent className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${isLowStock ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                            {isLowStock && <AlertTriangle className="h-3.5 w-3.5" />} {product.stock.toLocaleString("id-ID")} {product.unit ?? "pcs"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleOpenEdit(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleOpenDelete(product)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 text-sm font-medium">
                      Data produk kosong atau kriteria pencarian tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta && meta.total_pages > 1 && (
              <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Halaman {meta.page} dari {meta.total_pages} • {meta.total.toLocaleString("id-ID")} produk
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}
                    className="px-3 py-1.5 border bg-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={meta.page >= meta.total_pages}
                    onClick={() => setPage(meta.page + 1)}
                    className="px-3 py-1.5 border bg-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ProductModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} existingProduct={selectedProduct} onSuccess={refresh} />
      
      <DeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleConfirmDelete} product={selectedProduct} isDeleting={mutationLoading} />
    </div>
  );
}