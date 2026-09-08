"use client";

import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductsList,
  softDeleteProductService,
  bulkSoftDeleteProductsService,
} from "@/service/products.service";
import { useProductStore } from "../Store/useProductStore";
import { ProductView } from "../Component/ProductView";
import type { ProductDTO } from "../DTO/products.dto";

export default function ProductContainer() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    showProductModal,
    setShowProductModal,
    showDeleteModal,
    setShowDeleteModal,
    showCsvModal,
    setShowCsvModal,
    selectedProduct,
    setSelectedProduct,
    selectedIds,
    setSelectedIds,
    sortOrder,
    setSortOrder,
    filterStokKritis,
    setFilterStokKritis,
    filterDataIncomplete,
    setFilterDataIncomplete,
    page,
    setPage,
  } = useProductStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["productsList", page, searchQuery],
    queryFn: () => fetchProductsList({ page, limit: 20, search: searchQuery }),
  });

  const products = data?.products || [];
  const meta = data
    ? {
        page: data.page,
        limit: data.limit,
        total: data.total,
        total_pages: Math.ceil(data.total / (data.limit || 20)) || 1,
      }
    : null;

  const deleteMutation = useMutation({
    mutationFn: softDeleteProductService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productsList"] });
      setShowDeleteModal(false);
      setSelectedProduct(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkSoftDeleteProductsService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productsList"] });
      setSelectedIds([]);
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["productsList"] });
    refetch();
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleOpenEdit = (p: ProductDTO) => {
    setSelectedProduct(p);
    setShowProductModal(true);
  };

  const handleOpenDelete = (p: ProductDTO) => {
    setSelectedProduct(p);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.id) return;
    await deleteMutation.mutateAsync(selectedProduct.id);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setFilterStokKritis(false);
    setFilterDataIncomplete(false);
    setSortOrder("asc");
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id!).filter(Boolean));
    }
  };

  const handleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Nonaktifkan ${selectedIds.length} produk terpilih?`)) return;
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleTogglePromo = () => {};

  const handleExportCSV = () => {
    let csv = "ID,Barcode,Nama,Harga,Harga Member,Best Price,Stok,Satuan,Satuan Besar,Konversi\n";
    products.forEach((p) => {
      csv += `${p.id},"${p.barcode}","${p.name}",${p.price},${p.price_member || 0},${p.best_price || 0},${p.stock},"${p.unit}","${p.unit_big || ""}",${p.conversion || 1}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedProducts = products.filter((p) => {
    if (filterStokKritis && p.stock > (p.min_stock ?? 5)) return false;
    if (filterDataIncomplete && p.barcode && p.price > 0) return false;
    return true;
  });

  const incompleteCount = products.filter((p) => !p.barcode || p.price <= 0).length;

  return (
    <ProductView
      searchQuery={searchQuery}
      showProductModal={showProductModal}
      setShowProductModal={setShowProductModal}
      showDeleteModal={showDeleteModal}
      setShowDeleteModal={setShowDeleteModal}
      selectedProduct={selectedProduct}
      selectedIds={selectedIds}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      filterStokKritis={filterStokKritis}
      setFilterStokKritis={setFilterStokKritis}
      filterDataIncomplete={filterDataIncomplete}
      setFilterDataIncomplete={setFilterDataIncomplete}
      incompleteCount={incompleteCount}
      showCsvModal={showCsvModal}
      setShowCsvModal={setShowCsvModal}
      searchInputRef={searchInputRef}
      displayedProducts={displayedProducts}
      loading={isLoading}
      refresh={refresh}
      setPage={setPage}
      mutationLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
      handleSelectAll={handleSelectAll}
      handleSelectRow={handleSelectRow}
      handleBulkDeactivate={handleBulkDeactivate}
      handleOpenAdd={handleOpenAdd}
      handleOpenEdit={handleOpenEdit}
      handleOpenDelete={handleOpenDelete}
      handleConfirmDelete={handleConfirmDelete}
      handleSearch={handleSearch}
      handleResetSearch={handleResetSearch}
      handleTogglePromo={handleTogglePromo}
      handleExportCSV={handleExportCSV}
      meta={meta}
    />
  );
}
