import { Category } from "./category";

export interface Design {
  id: string;
  design_id: string; // e.g. "EMB-0001"
  name: string;
  description?: string | null;
  category_id?: string | null;
  category?: Category | null;
  cloudinary_public_id: string;
  cloudinary_url: string;
  thumbnail_url: string;
  original_filename: string;
  file_hash: string; // SHA-256
  file_size: number;
  width?: number | null;
  height?: number | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignFilterParams {
  category?: string;
  search?: string;
  favorite?: boolean;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc";
  page?: number;
  limit?: number;
}

export interface PaginatedDesignsResponse {
  designs: Design[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
