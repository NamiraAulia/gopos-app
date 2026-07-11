import api from '@/lib/axios';
import type { ApiResponse, Product } from '@/types/api';

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api
      .get<ApiResponse<{ products: Product[]; total: number; page: number; limit: number }>>(
        '/products',
        { params }
      )
      .then((res) => res.data),

  getById: (id: number) =>
    api.get<ApiResponse<Product>>(`/products/${id}`).then((res) => res.data),

  create: (data: Partial<Product>) =>
    api.post<ApiResponse<Product>>('/products', data).then((res) => res.data),

  update: (id: number, data: Partial<Product>) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, data).then((res) => res.data),

  softDelete: (id: number) =>
    api.delete<ApiResponse<Product>>(`/products/${id}`).then((res) => res.data),

  importCsv: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post<ApiResponse<any>>('/products/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then((res) => res.data);
    }
};