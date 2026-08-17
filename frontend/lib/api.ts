import api from '@/lib/axios';
import { handleResponse, handleFormResponse } from '@/lib/handleResponse';
import type {
  Product,
  Transaction,
  Shift,
  Refund,
  ActivityLog,
  CheckoutPayload,
  RefundPayload,
  OpenShiftPayload,
  CloseShiftPayload,
  User,
} from '@/types/api';

// AUTH

export const authApi = {
  login: (username: string, password: string) =>
    handleResponse<{ token: string; user: User }>(
      api.post('/auth/login', { username, password })
    ),
};

// PRODUCTS

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  barcode?: string;
}

export const productsApi = {
  getAll: (params?: GetProductsParams) =>
    handleResponse<Product[]>(api.get('/products', { params })),

  getById: (id: number) =>
    handleResponse<Product>(api.get(`/products/${id}`)),

  create: (data: Partial<Product>) =>
    handleFormResponse<Product>(api.post('/products', data)),

  update: (id: number, data: Partial<Product>) =>
    handleFormResponse<Product>(api.put(`/products/${id}`, data)),

  softDelete: (id: number) =>
    handleResponse<Product>(api.delete(`/products/${id}`)),

  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return handleResponse<{ imported: number; skipped: number; errors: string[] }>(
      api.post('/products/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  batchImport: (products: any[], signal?: AbortSignal) =>
    handleResponse<{
      processed: number;
      success_count: number;
      updated_count: number;
      skipped_count: number;
      failed_count: number;
      details: Array<{
        index: number;
        status: 'success' | 'updated' | 'skipped' | 'failed';
        name: string;
        barcode: string;
        error?: string;
      }>;
    }>(api.post('/products/batch-import', { products }, { signal })),

  getBarcodes: () =>
    handleResponse<string[]>(api.get('/products/barcodes')),
};


// TRANSACTIONS

interface GetTransactionsParams {
  page?: number;
  limit?: number;
  start_date?: string; 
  end_date?: string;
  status?: string;
}

export const transactionsApi = {
  getAll: (params?: GetTransactionsParams) =>
    handleResponse<Transaction[]>(api.get('/transactions', { params })),

  getById: (id: number) =>
    handleResponse<Transaction>(api.get(`/transactions/${id}`)),

  checkout: (payload: CheckoutPayload) =>
    handleResponse<Transaction>(api.post('/checkout', payload)),

  void: (id: number) =>
    handleResponse<Transaction>(api.post(`/transactions/${id}/void`)),

  getReceipt: (id: number) =>
    handleResponse<Transaction>(api.get(`/transactions/${id}/receipt`)),

  refund: (id: number, payload: RefundPayload) =>
    handleResponse<Refund>(api.post(`/transactions/${id}/refund`, payload)),
};

// SHIFTS

export const shiftsApi = {
  getActive: () =>
    handleResponse<Shift>(api.get('/shifts/active')),

  open: (payload: OpenShiftPayload) =>
    handleResponse<Shift>(api.post('/shifts/open', payload)),

  close: (payload: CloseShiftPayload) =>
    handleResponse<Shift>(api.post('/shifts/close', payload)),

  // Admin only
  getAllActive: () =>
    handleResponse<Shift[]>(api.get('/admin/shifts/active')),

  forceClose: (shiftId: number) =>
    handleResponse<Shift>(api.post(`/admin/shifts/${shiftId}/force-close`)),
};

// REPORTS

interface ReportParams {
  start_date: string;
  end_date: string;
}

export interface GrossProfitReport {
  period: { start_date: string; end_date: string };
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
  };
  by_product: Array<{
    product_id: number;
    product_name: string;
    qty_sold: number;
    revenue: number;
    cogs: number;
    profit: number;
  }>;
}

export interface DashboardSummary {
  today_revenue: number;
  month_revenue: number;
  total_transactions: number;
  recent_transactions: Transaction[];
}

export interface Alert {
  type: 'low_stock' | 'shift_hanging' | 'cash_difference';
  severity: 'warning' | 'critical';
  message: string;
  target_id: number;
  created_at: string;
}

export const reportsApi = {
  getDashboard: () =>
    handleResponse<DashboardSummary>(api.get('/reports/dashboard')),

  getGrossProfit: (params: ReportParams) =>
    handleResponse<GrossProfitReport>(api.get('/reports/gross-profit', { params })),

  getSalesReport: (params: ReportParams) =>
    handleResponse<unknown>(api.get('/reports/sales', { params })),

  getAlerts: () =>
    handleResponse<Alert[]>(api.get('/admin/alerts')),
};

// USERS (admin only)

export const usersApi = {
  getAll: () =>
    handleResponse<User[]>(api.get('/admin/users')),

  create: (data: { username: string; password: string; role: 'admin' | 'kasir' }) =>
    handleFormResponse<User>(api.post('/admin/users', data)),

  deactivate: (id: number) =>
    handleResponse<User>(api.patch(`/admin/users/${id}/deactivate`)),

  activate: (id: number) =>
    handleResponse<User>(api.patch(`/admin/users/${id}/activate`)),

  resetPassword: (id: number, newPassword: string) =>
    handleResponse<null>(api.patch(`/admin/users/${id}/reset-password`, { new_password: newPassword })),
};

// ACTIVITY LOG (admin only)

interface GetLogsParams {
  page?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  start_date?: string;
  end_date?: string;
}

export const activityApi = {
  getLogs: (params?: GetLogsParams) =>
    handleResponse<ActivityLog[]>(api.get('/admin/activity-logs', { params })),
};