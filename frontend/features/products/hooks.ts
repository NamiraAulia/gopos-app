import { useState, useEffect, useCallback } from "react";
import { productsApi } from "./api";
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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getAll({
        ...params,
        search: debouncedSearch 
      });

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
      const message = err instanceof Error ? err.message : "Gagal mengambil data produk";
      setError(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProducts();
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