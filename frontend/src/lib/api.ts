import {
  Settings,
  Vehicle,
  VehicleListResponse,
  VehicleQuery,
} from '@/types';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * GET helper. Uses `no-store` so admin edits are reflected on the
 * public site immediately (the catalog is small enough not to cache).
 */
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  const json: ApiEnvelope<T> = await res.json();
  return json.data;
}

export const DEFAULT_SETTINGS: Settings = {
  companyName: 'Авто Дилер',
  logo: '',
  banner: '',
  contact: { phone: '', email: '', address: '' },
  social: { facebook: '', instagram: '', youtube: '' },
  loan: { minDownPercent: 30, monthlyInterestRate: 2.8, termOptions: [12, 24, 36] },
};

// --- Raw fetchers (may throw) ---
export const getSettings = () => apiGet<Settings>('/settings');
export const getVehicle = (id: string) => apiGet<Vehicle>(`/vehicles/${id}`);

function buildQuery(query: VehicleQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const getVehicles = (query: VehicleQuery = {}) =>
  apiGet<VehicleListResponse>(`/vehicles${buildQuery(query)}`);

// --- Safe fetchers (never throw — return fallback so pages still render) ---
export async function getSettingsSafe(): Promise<Settings> {
  try {
    return await getSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getFeaturedSafe(): Promise<Vehicle[]> {
  try {
    return await apiGet<Vehicle[]>('/vehicles/featured');
  } catch {
    return [];
  }
}

export async function getLatestSafe(): Promise<Vehicle[]> {
  try {
    return await apiGet<Vehicle[]>('/vehicles/latest');
  } catch {
    return [];
  }
}

// --- Public lead submission ---
export interface LeadPayload {
  name: string;
  phone: string;
  message?: string;
  vehicleId?: string;
  vehicleName?: string;
}

export async function createLead(payload: LeadPayload): Promise<void> {
  const res = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Илгээхэд алдаа гарлаа');
}

export async function getVehiclesSafe(
  query: VehicleQuery = {}
): Promise<VehicleListResponse> {
  try {
    return await getVehicles(query);
  } catch {
    return {
      items: [],
      pagination: { total: 0, page: 1, limit: 12, pages: 1 },
    };
  }
}
