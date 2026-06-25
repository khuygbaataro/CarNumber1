export type VehicleStatus = 'available' | 'sold';

export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  description: string;
  images: string[];
  video?: string;
  status: VehicleStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VehicleListResponse {
  items: Vehicle[];
  pagination: Pagination;
}

export interface Contact {
  phone: string;
  email: string;
  address: string;
}

export interface Social {
  facebook: string;
  instagram: string;
  youtube: string;
}

export interface Settings {
  companyName: string;
  logo: string;
  banner: string;
  contact: Contact;
  social: Social;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  description: string;
  images: string[];
  video: string;
  status: VehicleStatus;
  featured: boolean;
}

export interface VehicleQuery {
  brand?: string;
  model?: string;
  year?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: string;
  limit?: string;
}
