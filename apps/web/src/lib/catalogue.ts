import type { ProductSummary } from "@ookf/shared";
import { apiFetch } from "@/lib/api";

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isVisible: boolean;
};

export type ProductDetail = ProductSummary & {
  shortDescription: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  brand: string | null;
  tags: string[];
  clothing: Record<string, unknown> | null;
  jewellery: Record<string, unknown> | null;
  images: Array<{ url: string; alt?: string; sortOrder?: number }>;
  variants: Array<{
    id: string;
    sku: string;
    options: {
      size?: string;
      colour?: string;
      material?: string;
      other?: string;
    };
    priceCents: number;
    stockQuantity: number;
    isAvailable: boolean;
    imageUrl: string | null;
  }>;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function fetchCategories() {
  return apiFetch<CategoryDto[]>("/api/v1/categories");
}

export async function fetchProducts(params?: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    }
  }
  const query = search.toString();
  return apiFetch<ProductSummary[]>(
    `/api/v1/products${query ? `?${query}` : ""}`
  );
}

export async function fetchProductBySlug(slug: string) {
  return apiFetch<ProductDetail>(`/api/v1/products/${slug}`);
}
