import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ErrorCode } from '@/types/api';


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
  }
  return config;
});


api.interceptors.response.use(
  (response: AxiosResponse) => response,

  (error: AxiosError<ApiErrorResponse>) => {
    const backendError = error.response?.data;

    if (backendError?.error?.code) {
      handleErrorByCode(backendError.error.code, backendError.message);
    } else if (error.code === 'ECONNABORTED') {
      showToast('error', 'Koneksi timeout. Periksa jaringan Anda.');
    } else if (!error.response) {
      showToast('error', 'Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    }

    return Promise.reject(error);
  }
);


function handleErrorByCode(code: ErrorCode, message: string): void {
  switch (code) {

    case 'UNAUTHORIZED':
      clearStoredToken();
      showToast('error', 'Sesi Anda telah berakhir. Silakan login kembali.');
      redirectTo('/login');
      break;

    case 'ACCOUNT_INACTIVE':
      clearStoredToken();
      showToast('error', 'Akun Anda telah dinonaktifkan. Hubungi administrator.');
      redirectTo('/login');
      break;

    case 'FORBIDDEN':
      showToast('error', 'Anda tidak memiliki izin untuk aksi ini.');
      redirectTo('/dashboard');
      break;


    case 'SHIFT_NOT_OPEN':
      showToast('warning', 'Anda belum membuka shift. Buka shift terlebih dahulu.');
      redirectTo('/shift/open');
      break;

    case 'SHIFT_ALREADY_OPEN':
      showToast('warning', 'Shift sudah terbuka. Tutup shift aktif sebelum membuka yang baru.');
      redirectTo('/shift/active');
      break;


    case 'INSUFFICIENT_STOCK':
      showToast('error', message);
      break;

    case 'REFUND_QTY_EXCEEDED':
      showToast('error', message);
      break;

    case 'REFUND_NOT_OWN_TRANSACTION':
      showToast('error', 'Anda hanya bisa meretur nota transaksi Anda sendiri.');
      break;

    case 'DUPLICATE_BARCODE':
      showToast('error', message);
      break;

    case 'PROMO_INVALID':
      showToast('warning', message);
      break;


    case 'NOT_FOUND':
      showToast('error', message || 'Data tidak ditemukan.');
      break;

    case 'VALIDATION_ERROR':
      break;

    case 'INTERNAL_ERROR':
    default:
      showToast('error', 'Terjadi kesalahan pada server. Coba beberapa saat lagi.');
      break;
  }
}

// HELPERS

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gopos_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('gopos_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('gopos_token');
  localStorage.removeItem('gopos_user');
}


function redirectTo(path: string): void {
  if (typeof window !== 'undefined') {
    // Hindari redirect loop
    if (window.location.pathname !== path) {
      window.location.href = path;
    }
  }
}


type ToastType = 'success' | 'error' | 'warning' | 'info';

function showToast(type: ToastType, message: string): void {
  if (process.env.NODE_ENV === 'development') {
    console[type === 'error' ? 'error' : 'log'](`[GoPOS Toast][${type.toUpperCase()}] ${message}`);
  }
}

export default api;