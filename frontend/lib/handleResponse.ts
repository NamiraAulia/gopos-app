import { AxiosError } from 'axios';
import type { ApiResponse, ApiErrorResponse, ApiMeta } from '@/types/api';


export interface HandleResult<T> {
  ok: boolean;
  data: T | null;
  meta: ApiMeta | null;
  message: string;
  errorCode: string | null;
  errorDetail: string | null;
}

export async function handleResponse<T>(
  axiosPromise: Promise<{ data: ApiResponse<T> }>
): Promise<HandleResult<T>> {
  try {
    const response = await axiosPromise;
    const body = response.data;

    return {
      ok: true,
      data: body.data ?? null,
      meta: body.meta ?? null,
      message: body.message,
      errorCode: null,
      errorDetail: null,
    };

  } catch (err) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    const backendError = axiosError.response?.data;

    return {
      ok: false,
      data: null,
      meta: null,
      message: backendError?.message ?? 'Terjadi kesalahan.',
      errorCode: backendError?.error?.code ?? null,
      errorDetail: backendError?.error?.detail ?? null,
    };
  }
}


export interface FormErrorResult {
  ok: false;
  fieldErrors: Record<string, string>; 
  message: string;
}


export async function handleFormResponse<T>(
  axiosPromise: Promise<{ data: ApiResponse<T> }>
): Promise<HandleResult<T> & { fieldErrors: Record<string, string> }> {
  const result = await handleResponse<T>(axiosPromise);

  if (!result.ok && result.errorCode === 'VALIDATION_ERROR') {
    const fieldErrors = parseFieldErrors(result.errorDetail ?? '');
    return { ...result, fieldErrors };
  }

  return { ...result, fieldErrors: {} };
}

function parseFieldErrors(detail: string): Record<string, string> {
  const errors: Record<string, string> = {};
  detail.split('\n').forEach((line) => {
    const [field, ...rest] = line.split(':');
    if (field && rest.length) {
      errors[field.trim()] = rest.join(':').trim();
    }
  });
  return errors;
}