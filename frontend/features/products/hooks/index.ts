import { useState, useEffect, useCallback, useRef } from "react";
import { productsApi } from "../api";
import type { Product, ApiMeta } from "@/types/api";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useProducts(initialParams?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(initialParams ?? {});

  const debouncedSearch = useDebounce(params.search, 300);

  const fetchProducts = useCallback(async (activeSignal?: { active: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getAll({
        ...params,
        search: debouncedSearch 
      });

      if (activeSignal && !activeSignal.active) return;

      if (res?.success && res.data) {
        setProducts(res.data.products ?? []);
        setMeta({
          page: res.data.page,
          limit: res.data.limit,
          total: res.data.total,
          total_pages: Math.ceil(res.data.total / res.data.limit),
        });
      } else {
        setProducts([]);
      }
    } catch (err: unknown) {
      if (activeSignal && !activeSignal.active) return;
      const message = err instanceof Error ? err.message : "Gagal mengambil data produk";
      setError(message);
      setProducts([]);
    } finally {
      if (!activeSignal || activeSignal.active) {
        setLoading(false);
      }
    }
  }, [params, debouncedSearch]);

  useEffect(() => {
    const activeSignal = { active: true };
    fetchProducts(activeSignal);
    return () => {
      activeSignal.active = false;
    };
  }, [fetchProducts]);

  const setSearch = useCallback((keyword: string) => {
    setParams((prev) => ({ ...prev, search: keyword, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  return {
    products,
    meta,
    loading,
    error,
    refresh: fetchProducts,
    setSearch,
    setPage,
    setParams,
  };
}

export function useMutationProducts() {
  const [loading, setLoading] = useState(false);

  const createProduct = async (data: Partial<Product>) => {
    setLoading(true);
    try {
      return await productsApi.create(data);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: number, data: Partial<Product>) => {
    setLoading(true);
    try {
      return await productsApi.update(id, data);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    setLoading(true);
    try {
      return await productsApi.softDelete(id);
    } finally {
      setLoading(false);
    }
  };

  const uploadCsv = async (file: File) => {
    try {
      setLoading(true);
      return await productsApi.importCsv(file);
    } finally {
      setLoading(false);
    }
  };

  return { createProduct, updateProduct, deleteProduct, uploadCsv, loading };
}

export function useProductManagement() {
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
      is_promo: !product.is_promo,
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
        `"${p.supplier_name || '-'}"`, 
        p.best_price || 0, 
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

  return {
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
    fileInputRef,
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
    handleImportCSV,
    handleExportCSV,
    meta,
  };
}
