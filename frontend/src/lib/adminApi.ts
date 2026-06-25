import { API_URL } from './api';
import { getToken, clearToken } from './auth';
import {
  Settings,
  Vehicle,
  VehicleFormData,
  VehicleListResponse,
} from '@/types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Authenticated request helper for the admin panel (runs in the browser). */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isForm = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, json.message || `Алдаа (${res.status})`);
  }
  return json.data as T;
}

export interface LoginResult {
  token: string;
  user: { id: string; email: string; role: string };
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ id: string; email: string; role: string }>('/auth/me'),

  listVehicles: () => request<VehicleListResponse>('/vehicles?limit=50&sort=newest'),
  getVehicle: (id: string) => request<Vehicle>(`/vehicles/${id}`),
  createVehicle: (data: VehicleFormData) =>
    request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: string, data: VehicleFormData) =>
    request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id: string) =>
    request<unknown>(`/vehicles/${id}`, { method: 'DELETE' }),
  setStatus: (id: string, status: 'available' | 'sold') =>
    request<Vehicle>(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getSettings: () => request<Settings>('/settings'),
  updateSettings: (data: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  uploadImages: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return request<{ urls: string[] }>('/upload/images', {
      method: 'POST',
      body: fd,
    });
  },
  uploadVideo: (file: File) => {
    const fd = new FormData();
    fd.append('video', file);
    return request<{ url: string }>('/upload/video', { method: 'POST', body: fd });
  },
};
