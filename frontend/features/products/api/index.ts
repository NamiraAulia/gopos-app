import { supabase } from "@/utils/supabaseClient";
import type { ApiResponse, Product } from '@/types/api';

export const productsApi = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        try {
            const page = params?.page || 1;
            const limit = params?.limit || 10;
            const search = params?.search || "";

            let query = supabase.from("products").select("*", { count: "exact" }).eq("is_active", true);

            if (search) {
                query = query.ilike("name", `%${search}%`);
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query
                .order("id", { ascending: true })
                .range(from, to);

            if (error) throw error;

            return {
                success: true,
                message: "Berhasil memuat produk",
                data: {
                    products: (data as Product[]) || [],
                    total: count || 0,
                    page,
                    limit
                }
            };
        } catch (err: any) {
            return {
                success: false,
                message: err.message || "Gagal memuat produk",
                data: {
                    products: [],
                    total: 0,
                    page: params?.page || 1,
                    limit: params?.limit || 10
                }
            };
        }
    },

    getById: async (id: number) => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            return {
                success: true,
                message: "Detail produk ditemukan",
                data: data as Product
            };
        } catch (err: any) {
            return {
                success: false,
                message: err.message || "Detail produk tidak ditemukan",
                data: null
            };
        }
    },

    create: async (data: Partial<Product>) => {
        try {
            const { min_stock, unit_choice, ...dbPayload } = data as any;
            const { data: newProduct, error } = await supabase
                .from("products")
                .insert(dbPayload)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: "Produk berhasil ditambahkan",
                data: newProduct as Product
            };
        } catch (err: any) {
            return {
                success: false,
                message: err.message || "Gagal menambahkan produk",
                data: null
            };
        }
    },

    update: async (id: number, data: Partial<Product>) => {
        try {
            const { min_stock, unit_choice, ...dbPayload } = data as any;
            const { data: updatedProduct, error } = await supabase
                .from("products")
                .update(dbPayload)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: "Produk berhasil diperbarui",
                data: updatedProduct as Product
            };
        } catch (err: any) {
            return {
                success: false,
                message: err.message || "Gagal memperbarui produk",
                data: null
            };
        }
    },

    softDelete: async (id: number) => {
        try {
            const { data: deactivatedProduct, error } = await supabase
                .from("products")
                .update({ is_active: false })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: "Produk berhasil dinonaktifkan",
                data: deactivatedProduct as Product
            };
        } catch (err: any) {
            return {
                success: false,
                message: err.message || "Gagal menonaktifkan produk",
                data: null
            };
        }
    },

    importCsv: async (file: File) => {
        return new Promise<ApiResponse<any>>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
                    const headers = lines[0].split(",");
                    
                    const rows = lines.slice(1).map(line => {
                        const values = line.split(",");
                        const row: any = {};
                        headers.forEach((header, index) => {
                            const val = values[index];
                            if (val === "true") row[header] = true;
                            else if (val === "false") row[header] = false;
                            else if (!isNaN(Number(val)) && val !== "") row[header] = Number(val);
                            else row[header] = val;
                        });
                        return row;
                    });

                    const { data, error } = await supabase
                        .from("products")
                        .upsert(rows, { onConflict: "barcode" })
                        .select();

                    if (error) throw error;

                    resolve({
                        success: true,
                        message: `Berhasil mengimpor ${data?.length} produk`,
                        data: data,
                        meta: null,
                    });
                } catch (err: any) {
                    resolve({
                        success: false,
                        message: err.message || "Gagal mengimpor CSV",
                        data: null,
                        meta: null,
                    });
                }
            };
            reader.readAsText(file);
        });
    },

    batchImport: async (products: any[], signal?: AbortSignal) => {
        try {
            let success_count = 0;
            let updated_count = 0;
            let skipped_count = 0;
            let failed_count = 0;
            const details: any[] = [];

            for (let i = 0; i < products.length; i++) {
                if (signal?.aborted) break;
                const item = products[i];
                if (item.action === "skip") {
                    skipped_count++;
                    details.push({
                        index: i,
                        status: "skipped",
                        name: item.name,
                        barcode: item.barcode,
                    });
                    continue;
                }

                const dbPayload: any = {
                    name: item.name,
                    barcode: item.barcode || `PRD-${Date.now()}-${i}`,
                    price: item.price || 0,
                    price_member: item.price_member || null,
                    best_price: item.best_price || 0,
                    unit: item.unit || "Pcs",
                    stock: item.stock || 0,
                    unit_big: item.unit_big || null,
                    conversion: item.conversion || null,
                    price_big: item.price_big || null,
                    is_active: true,
                };

                if (item.action === "update" && item.barcode) {
                    const { error } = await supabase
                        .from("products")
                        .update(dbPayload)
                        .eq("barcode", item.barcode);
                    if (error) {
                        failed_count++;
                        details.push({ index: i, status: "failed", name: item.name, barcode: item.barcode, error: error.message });
                    } else {
                        updated_count++;
                        details.push({ index: i, status: "updated", name: item.name, barcode: item.barcode });
                    }
                } else {
                    const { error } = await supabase
                        .from("products")
                        .insert(dbPayload);
                    if (error) {
                        failed_count++;
                        details.push({ index: i, status: "failed", name: item.name, barcode: item.barcode, error: error.message });
                    } else {
                        success_count++;
                        details.push({ index: i, status: "success", name: item.name, barcode: item.barcode });
                    }
                }
            }

            return {
                ok: true,
                success: true,
                data: {
                    processed: products.length,
                    success_count,
                    updated_count,
                    skipped_count,
                    failed_count,
                    details,
                },
            };
        } catch (err: any) {
            return {
                ok: false,
                success: false,
                message: err.message || "Gagal memproses batch import",
                data: null,
            };
        }
    },

    getBarcodes: async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("barcode");
            if (error) throw error;
            const barcodes = (data || []).map((p: any) => p.barcode).filter(Boolean);
            return {
                success: true,
                ok: true,
                data: barcodes,
            };
        } catch (err: any) {
            return {
                success: false,
                ok: false,
                data: [],
            };
        }
    }
};
