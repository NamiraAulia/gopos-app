import type { Product } from "@/interface/api";

export type ProductDTO = Product;

export interface CreateProductInputDTO {
  name: string;
  barcode: string;
  price: number;
  price_member?: number;
  best_price?: number;
  unit: string;
  stock: number;
  unit_big?: string;
  conversion?: number;
  price_big?: number;
}

export interface BatchImportItemDTO {
  name: string;
  barcode?: string;
  price?: number;
  price_member?: number;
  best_price?: number;
  unit?: string;
  stock?: number;
  unit_big?: string;
  conversion?: number;
  price_big?: number;
  action?: "insert" | "update" | "skip";
}

export interface BatchImportResultDTO {
  processed: number;
  success_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  details: Array<{
    index: number;
    status: string;
    name: string;
    barcode?: string;
    error?: string;
  }>;
}
