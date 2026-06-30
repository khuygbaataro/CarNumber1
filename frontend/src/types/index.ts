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
  downPercent?: number | null;
  transmission?: string;
  steering?: string;
  fuel?: string;
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

export interface LoanConfig {
  minDownPercent: number;
  monthlyInterestRate: number; // % per month
  termOptions: number[]; // months, e.g. [12, 24, 36]
}

export interface Testimonial {
  name: string;
  text: string;
}

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'center';

export type WatermarkFont = 'Arial' | 'Verdana' | 'Impact' | 'Georgia' | 'Montserrat';

export interface WatermarkConfig {
  enabled: boolean;
  text: string; // empty → falls back to companyName
  position: WatermarkPosition;
  fontFamily: WatermarkFont;
  fontSize: number;
  opacity: number; // 0–100
  color: string;
}

export interface ImagesConfig {
  maxWidth: number;
  watermark: WatermarkConfig;
}

export interface Settings {
  companyName: string;
  logo: string;
  banner: string;
  contact: Contact;
  social: Social;
  loan: LoanConfig;
  about: string;
  workingHours: string;
  testimonials: Testimonial[];
  partners: string[];
  images: ImagesConfig;
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
  downPercent: number | null;
  transmission: string;
  steering: string;
  fuel: string;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  message: string;
  vehicleId?: string;
  vehicleName?: string;
  status: 'new' | 'contacted';
  createdAt: string;
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
